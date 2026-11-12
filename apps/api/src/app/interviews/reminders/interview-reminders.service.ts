import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  InterviewType,
  NotificationType,
  RelatedEntityType,
  ScheduleStatus,
} from '@ats-platform/database';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  formatInterviewTime,
  formatVietnamTime,
} from '../../candidate-notifications/email/format';
import {
  INTERVIEW_REMINDERS_QUEUE,
  PlannableSchedule,
  planReminders,
  ReminderJobData,
  ReminderKind,
} from './interview-reminders.rules';

/**
 * In-app notifications (saved and pushed over Socket.IO as `notification:new`) before an
 * interview: a reminder the day before, and "the room is open" when an online room opens
 * (GĐ4 R29, R30; decisions D14, D15). No email: the schedule email already went out.
 */
@Injectable()
export class InterviewRemindersService {
  private readonly logger = new Logger(InterviewRemindersService.name);

  constructor(
    @InjectQueue(INTERVIEW_REMINDERS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Queues the reminders of a schedule just created or changed. Never throws. */
  async schedule(schedule: PlannableSchedule, now: Date = new Date()): Promise<void> {
    const data: ReminderJobData = {
      interviewId: schedule.interviewId,
      startAt: schedule.startAt.toISOString(),
    };
    for (const plan of planReminders(schedule, now)) {
      try {
        await this.queue.add(plan.kind, data, { delay: plan.delayMs, jobId: plan.jobId });
      } catch (error) {
        this.logger.warn(
          `Could not queue the ${plan.kind} job of interview ${schedule.interviewId}: ${String(error)}`,
        );
      }
    }
  }

  /**
   * Sends one reminder, unless the schedule changed since it was planned: gone, no longer
   * scheduled, moved, or (for the room) no longer online. A failed save throws, so the
   * job is retried.
   */
  async deliver(kind: ReminderKind, data: ReminderJobData): Promise<void> {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId: data.interviewId },
      select: {
        interviewId: true,
        startAt: true,
        durationMinutes: true,
        interviewType: true,
        status: true,
        scheduledBy: true,
        interviewerId: true,
        application: {
          select: {
            candidate: { select: { userId: true, user: { select: { fullName: true } } } },
            jobPosting: { select: { title: true } },
          },
        },
      },
    });

    const stale =
      !schedule ||
      schedule.status !== ScheduleStatus.scheduled ||
      schedule.startAt.getTime() !== Date.parse(data.startAt) ||
      (kind === 'room-open' && schedule.interviewType !== InterviewType.online);
    if (stale) {
      this.logger.log(`Skipped the ${kind} job of interview ${data.interviewId}: the schedule changed`);
      return;
    }

    const jobTitle = schedule.application.jobPosting.title;
    const candidateName = schedule.application.candidate.user.fullName;
    const when = formatInterviewTime(schedule.startAt, schedule.durationMinutes);
    const startTime = formatVietnamTime(schedule.startAt);

    const copy =
      kind === 'reminder'
        ? {
            title: 'Nhắc lịch phỏng vấn',
            candidate: `Bạn có buổi phỏng vấn vị trí ${jobTitle}: ${when}.`,
            staff: `Phỏng vấn ${candidateName}, vị trí ${jobTitle}: ${when}.`,
          }
        : {
            title: 'Phòng phỏng vấn đã mở',
            candidate: `Phòng phỏng vấn vị trí ${jobTitle} đã mở. Buổi phỏng vấn bắt đầu lúc ${startTime}.`,
            staff: `Phòng phỏng vấn ${candidateName}, vị trí ${jobTitle} đã mở. Bắt đầu lúc ${startTime}.`,
          };

    const candidateUserId = schedule.application.candidate.userId;
    const recipients = [
      ...new Set([candidateUserId, schedule.interviewerId, schedule.scheduledBy]),
    ];
    for (const userId of recipients) {
      await this.notifications.create({
        userId,
        type: NotificationType.interview,
        title: copy.title,
        message: userId === candidateUserId ? copy.candidate : copy.staff,
        relatedEntityId: schedule.interviewId,
        relatedEntityType: RelatedEntityType.interview,
      });
    }
  }
}
