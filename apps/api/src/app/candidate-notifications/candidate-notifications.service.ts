import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ApplicationStatus,
  EmailNotificationStatus,
  EmailNotificationType,
  NotificationType,
  Prisma,
  RelatedEntityType,
  ScheduleStatus,
  UserStatus,
} from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import {
  NOTIFICATION_EMAIL_QUEUE,
  SEND_NOTIFICATION_EMAIL_JOB,
} from './notification-email.constants';
import {
  changedScheduleFields,
  type CancelledScheduleSummary,
  type ScheduleField,
  type ScheduleSnapshot,
} from './schedule-changes';
import { formatInterviewTime } from './email/format';
import type {
  ApplicationContext,
  NotificationEmailPayload,
  ScheduleDetails,
} from './email/notification-email.types';

const NOTIFY_CANDIDATE_ON: ApplicationStatus[] = [
  ApplicationStatus.interview,
  ApplicationStatus.offer,
  ApplicationStatus.hired,
  ApplicationStatus.rejected,
];

const APPLICATION_STATUS_NOTIFICATION_COPY: Record<
  string,
  { title: string; message: string }
> = {
  [ApplicationStatus.interview]: {
    title: 'Đơn ứng tuyển chuyển sang vòng phỏng vấn',
    message: 'Đơn ứng tuyển của bạn đã được chuyển sang vòng phỏng vấn.',
  },
  [ApplicationStatus.offer]: {
    title: 'Cập nhật đề nghị tuyển dụng',
    message:
      'Đơn ứng tuyển của bạn đã được chuyển sang vòng đề nghị tuyển dụng.',
  },
  [ApplicationStatus.hired]: {
    title: 'Chúc mừng, bạn đã được tuyển',
    message:
      'Chúc mừng, đơn ứng tuyển của bạn đã được chuyển sang trạng thái trúng tuyển.',
  },
  [ApplicationStatus.rejected]: {
    title: 'Đơn ứng tuyển đã bị từ chối',
    message: 'Rất tiếc, đơn ứng tuyển của bạn đã bị từ chối.',
  },
};

type ScheduleNotificationType =
  | typeof EmailNotificationType.schedule_created
  | typeof EmailNotificationType.schedule_updated
  | typeof EmailNotificationType.schedule_cancelled;

@Injectable()
export class CandidateNotificationsService {
  private readonly logger = new Logger(CandidateNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(NOTIFICATION_EMAIL_QUEUE) private readonly queue: Queue,
  ) {}

  async applicationReceived(applicationId: string): Promise<void> {
    await this.notify(
      applicationId,
      EmailNotificationType.application_received,
      (context) => ({ context }),
    );
  }

  async applicationStatusChanged(
    applicationId: string,
    status: ApplicationStatus,
    cancelledSchedules: CancelledScheduleSummary[],
  ): Promise<void> {
    if (!NOTIFY_CANDIDATE_ON.includes(status)) return;

    const type = `application_${status}` as EmailNotificationType;
    await this.notify(
      applicationId,
      type,
      (context) => ({
        context,
        ...(status === ApplicationStatus.rejected
          ? {
              cancelledSchedules: cancelledSchedules.map((schedule) => ({
                startAt: schedule.startAt.toISOString(),
                durationMinutes: schedule.durationMinutes,
                interviewType: schedule.interviewType,
              })),
            }
          : {}),
      }),
      () => ({
        type: NotificationType.application,
        ...APPLICATION_STATUS_NOTIFICATION_COPY[status],
        relatedEntityId: applicationId,
        relatedEntityType: RelatedEntityType.application,
      }),
    );
  }

  async scheduleCreated(schedule: ScheduleSnapshot): Promise<void> {
    await this.notifySchedule(EmailNotificationType.schedule_created, schedule);
  }

  async scheduleChanged(
    before: ScheduleSnapshot,
    after: ScheduleSnapshot,
  ): Promise<void> {
    if (
      before.status === ScheduleStatus.scheduled &&
      after.status === ScheduleStatus.cancelled
    ) {
      await this.notifySchedule(EmailNotificationType.schedule_cancelled, after);
      return;
    }

    if (after.status !== ScheduleStatus.scheduled) return;

    const fields = changedScheduleFields(before, after);
    if (fields.length === 0) return;

    await this.notifySchedule(
      EmailNotificationType.schedule_updated,
      after,
      before,
      fields,
    );
  }

  async scheduleRemoved(
    schedule: ScheduleSnapshot,
    removedAt: Date,
  ): Promise<void> {
    if (
      schedule.status !== ScheduleStatus.scheduled ||
      schedule.startAt.getTime() <= removedAt.getTime()
    ) {
      return;
    }

    await this.notifySchedule(EmailNotificationType.schedule_cancelled, schedule);
  }

  private async readApplication(
    applicationId: string,
    type: EmailNotificationType,
  ) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { applicationId },
        select: {
          applicationId: true,
          organizationId: true,
          appliedAt: true,
          organization: { select: { name: true } },
          jobPosting: { select: { title: true } },
          candidate: {
            select: {
              user: {
                select: { userId: true, email: true, fullName: true, status: true },
              },
            },
          },
        },
      });

      if (!application) {
        this.warnEmailFailure(
          type,
          applicationId,
          new Error('Application not found'),
        );
        return null;
      }

      const context: ApplicationContext = {
        applicationId: application.applicationId,
        candidateName: application.candidate.user.fullName,
        jobTitle: application.jobPosting.title,
        organizationName: application.organization.name,
        appliedAt: application.appliedAt.toISOString(),
      };

      return { application, context };
    } catch (error) {
      this.warnEmailFailure(type, applicationId, error);
      return null;
    }
  }

  private async notify(
    applicationId: string,
    type: EmailNotificationType,
    createPayload: (
      context: ApplicationContext,
    ) => NotificationEmailPayload | Promise<NotificationEmailPayload>,
    createInApp?: (
      context: ApplicationContext,
    ) => Omit<CreateNotificationDto, 'userId'>,
    interviewId: string | null = null,
  ): Promise<void> {
    const result = await this.readApplication(applicationId, type);
    if (!result) return;

    const { application, context } = result;
    const user = application.candidate.user;

    if (createInApp) {
      try {
        await this.notificationsService.create({
          userId: user.userId,
          ...createInApp(context),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to create the in-app notification for ${type} of application ${applicationId}: ${message}`,
        );
      }
    }

    try {
      const payload = await createPayload(context);
      const status =
        user.status === UserStatus.inactive
          ? EmailNotificationStatus.skipped
          : EmailNotificationStatus.pending;
      const { id } = await this.prisma.emailNotification.create({
        data: {
          organizationId: application.organizationId,
          recipientUserId: user.userId,
          recipientEmail: user.email,
          applicationId,
          interviewId,
          type,
          status,
          payload: payload as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      if (status === EmailNotificationStatus.skipped) return;

      await this.queue.add(
        SEND_NOTIFICATION_EMAIL_JOB,
        { notificationId: id },
        { jobId: id },
      );
    } catch (error) {
      this.warnEmailFailure(type, applicationId, error);
    }
  }

  private async notifySchedule(
    type: ScheduleNotificationType,
    schedule: ScheduleSnapshot,
    before?: ScheduleSnapshot,
    fields: ScheduleField[] = [],
  ): Promise<void> {
    await this.notify(
      schedule.applicationId,
      type,
      async (context) => {
        const interviewerIds = [
          ...new Set([
            schedule.interviewerId,
            ...(before ? [before.interviewerId] : []),
          ]),
        ];
        const interviewers = await this.prisma.user.findMany({
          where: { userId: { in: interviewerIds } },
          select: { userId: true, fullName: true },
        });
        const names = new Map(
          interviewers.map((user) => [user.userId, user.fullName]),
        );
        const payload: NotificationEmailPayload = {
          context,
          schedule: this.scheduleDetails(
            schedule,
            names.get(schedule.interviewerId) ?? '',
          ),
        };

        if (before) {
          const previous: Partial<ScheduleDetails> = {};
          for (const field of fields) {
            switch (field) {
              case 'startAt':
                previous.startAt = before.startAt.toISOString();
                break;
              case 'durationMinutes':
                previous.durationMinutes = before.durationMinutes;
                break;
              case 'interviewType':
                previous.interviewType = before.interviewType;
                break;
              case 'onlineMeetingLink':
                previous.onlineMeetingLink = before.onlineMeetingLink ?? null;
                break;
              case 'location':
                previous.location = before.location ?? null;
                break;
              case 'interviewerId':
                previous.interviewerName = names.get(before.interviewerId) ?? '';
                break;
            }
          }
          payload.previous = previous;
        }

        return payload;
      },
      (context) => {
        const when = formatInterviewTime(
          schedule.startAt,
          schedule.durationMinutes,
        );
        const copy = {
          [EmailNotificationType.schedule_created]: {
            title: 'Bạn có lịch phỏng vấn mới',
            message: `Lịch phỏng vấn cho vị trí ${context.jobTitle}: ${when}.`,
          },
          [EmailNotificationType.schedule_updated]: {
            title: 'Lịch phỏng vấn đã thay đổi',
            message: `Lịch phỏng vấn cho vị trí ${context.jobTitle} đã thay đổi: ${when}.`,
          },
          [EmailNotificationType.schedule_cancelled]: {
            title: 'Lịch phỏng vấn đã bị hủy',
            message: `Buổi phỏng vấn cho vị trí ${context.jobTitle} lúc ${when} đã bị hủy.`,
          },
        }[type];

        return {
          type: NotificationType.interview,
          ...copy,
          relatedEntityId: schedule.interviewId,
          relatedEntityType: RelatedEntityType.interview,
        };
      },
      schedule.interviewId,
    );
  }

  private scheduleDetails(
    schedule: ScheduleSnapshot,
    interviewerName: string,
  ): ScheduleDetails {
    return {
      interviewId: schedule.interviewId,
      startAt: schedule.startAt.toISOString(),
      durationMinutes: schedule.durationMinutes,
      interviewType: schedule.interviewType,
      onlineMeetingLink: schedule.onlineMeetingLink ?? null,
      location: schedule.location ?? null,
      interviewerName,
    };
  }

  private warnEmailFailure(
    type: EmailNotificationType,
    applicationId: string,
    error: unknown,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Failed to queue the email for ${type} of application ${applicationId}: ${message}`,
    );
  }
}
