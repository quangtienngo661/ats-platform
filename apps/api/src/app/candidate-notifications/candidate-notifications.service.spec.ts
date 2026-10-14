import { Logger } from '@nestjs/common';
import {
  ApplicationStatus,
  EmailNotificationStatus,
  EmailNotificationType,
  InterviewType,
  NotificationType,
  RelatedEntityType,
  ScheduleStatus,
  UserStatus,
} from '@ats-platform/database';
import {
  createPrismaMock,
  createQueueMock,
} from '../../test-utils/unit-test-helpers';
import { CandidateNotificationsService } from './candidate-notifications.service';
import { CandidateNotificationsModule } from './candidate-notifications.module';
import type { ScheduleSnapshot } from './schedule-changes';
import { formatInterviewTime } from './email/format';
import type {
  ApplicationContext,
  NotificationEmailPayload,
  ScheduleDetails,
} from './email/notification-email.types';

describe('CandidateNotificationsService', () => {
  const applicationId = 'c2ba6519-7149-4af6-b335-f456fdd0c020';
  const candidateUserId = 'd33020f5-cbaf-4507-bb65-47bdc6a0aa31';
  const interviewId = 'd8c436c5-3017-4635-9c1f-5334f9987404';
  const interviewerId = '02733460-e749-4ef0-b604-f2c72b978c11';
  const newInterviewerId = '10b15e89-b2ee-4463-96d3-d0fd19edb422';

  const context: ApplicationContext = {
    applicationId,
    candidateName: 'Nguyễn Minh Anh',
    jobTitle: 'Kỹ sư Backend NestJS & API',
    organizationName: 'Công ty Công nghệ Sao Việt',
    appliedAt: '2026-10-13T20:00:00.000Z',
  };

  const scheduleDetails: ScheduleDetails = {
    interviewId,
    startAt: '2026-10-20T02:30:00.000Z',
    durationMinutes: 60,
    interviewType: InterviewType.online,
    onlineMeetingLink: 'https://meet.example.com/backend-interview?invite=anh&room=1',
    location: null,
    interviewerName: 'Trần Hoàng Nam',
  };

  const makeApplication = () => ({
    applicationId,
    organizationId: 'org-1',
    appliedAt: new Date('2026-10-13T20:00:00Z'),
    organization: { name: 'Công ty Công nghệ Sao Việt' },
    jobPosting: { title: 'Kỹ sư Backend NestJS & API' },
    candidate: {
      user: {
        userId: candidateUserId,
        email: 'minh.anh.current@example.com',
        fullName: 'Nguyễn Minh Anh',
        status: UserStatus.active as UserStatus,
      },
    },
  });

  const makeSchedule = (
    overrides: Partial<ScheduleSnapshot> = {},
  ): ScheduleSnapshot => ({
    interviewId,
    applicationId,
    interviewerId,
    interviewType: InterviewType.online,
    startAt: new Date('2026-10-20T02:30:00Z'),
    durationMinutes: 60,
    onlineMeetingLink: 'https://meet.example.com/backend-interview?invite=anh&room=1',
    location: null,
    status: ScheduleStatus.scheduled,
    ...overrides,
  });

  let service: CandidateNotificationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let queue: ReturnType<typeof createQueueMock>;
  let notificationsService: { create: jest.Mock };
  let application: ReturnType<typeof makeApplication>;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    prisma = createPrismaMock();
    queue = createQueueMock();
    notificationsService = { create: jest.fn() };
    application = makeApplication();
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.user.findMany.mockResolvedValue([
      { userId: interviewerId, fullName: 'Trần Hoàng Nam' },
    ]);
    prisma.emailNotification.create.mockResolvedValue({ id: 'row-1' });
    queue.add.mockResolvedValue({ id: 'row-1' });
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    service = new CandidateNotificationsService(
      prisma as any,
      notificationsService as any,
      queue as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const applicationQuery = {
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
  };

  const expectApplicationRead = () => {
    expect(prisma.application.findUnique.mock.calls).toEqual([[applicationQuery]]);
  };

  const expectEmailRow = (
    type: EmailNotificationType,
    payload: NotificationEmailPayload,
    options: {
      interviewId?: string;
      status?: EmailNotificationStatus;
      recipientEmail?: string;
    } = {},
  ) => {
    expectApplicationRead();
    expect(prisma.emailNotification.create.mock.calls).toEqual([
      [
        {
          data: {
            organizationId: 'org-1',
            recipientUserId: candidateUserId,
            recipientEmail: options.recipientEmail ?? 'minh.anh.current@example.com',
            applicationId,
            interviewId: options.interviewId ?? null,
            type,
            status: options.status ?? EmailNotificationStatus.pending,
            payload,
          },
          select: { id: true },
        },
      ],
    ]);
  };

  const expectQueuedEmail = () => {
    expect(queue.add.mock.calls).toEqual([
      [
        'send-notification-email',
        { notificationId: 'row-1' },
        { jobId: 'row-1' },
      ],
    ]);
  };

  const expectInterviewerRead = (ids: string[] = [interviewerId]) => {
    expect(prisma.user.findMany.mock.calls).toEqual([
      [
        {
          where: { userId: { in: expect.arrayContaining(ids) } },
          select: { userId: true, fullName: true },
        },
      ],
    ]);
    expect(prisma.user.findMany.mock.calls[0][0].where.userId.in).toHaveLength(
      ids.length,
    );
  };

  const expectApplicationInApp = (title: string, message: string) => {
    expect(notificationsService.create.mock.calls).toEqual([
      [
        {
          userId: candidateUserId,
          type: NotificationType.application,
          title,
          message,
          relatedEntityId: applicationId,
          relatedEntityType: RelatedEntityType.application,
        },
      ],
    ]);
  };

  const expectScheduleInApp = (title: string, message: string) => {
    expect(notificationsService.create.mock.calls).toEqual([
      [
        {
          userId: candidateUserId,
          type: NotificationType.interview,
          title,
          message,
          relatedEntityId: interviewId,
          relatedEntityType: RelatedEntityType.interview,
        },
      ],
    ]);
  };

  const expectNoDelivery = () => {
    expect(prisma.emailNotification.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  };

  it("records and enqueues application_received with the candidate's current email", async () => {
    application.candidate.user.email = 'minh.anh.updated@example.com';

    await expect(service.applicationReceived(applicationId)).resolves.toBeUndefined();

    expectEmailRow(
      EmailNotificationType.application_received,
      { context },
      { recipientEmail: 'minh.anh.updated@example.com' },
    );
    expectQueuedEmail();
    expect(notificationsService.create).not.toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it.each([
    {
      status: ApplicationStatus.interview,
      type: EmailNotificationType.application_interview,
      title: 'Đơn ứng tuyển chuyển sang vòng phỏng vấn',
      message: 'Đơn ứng tuyển của bạn đã được chuyển sang vòng phỏng vấn.',
    },
    {
      status: ApplicationStatus.offer,
      type: EmailNotificationType.application_offer,
      title: 'Cập nhật đề nghị tuyển dụng',
      message: 'Đơn ứng tuyển của bạn đã được chuyển sang vòng đề nghị tuyển dụng.',
    },
    {
      status: ApplicationStatus.hired,
      type: EmailNotificationType.application_hired,
      title: 'Chúc mừng, bạn đã được tuyển',
      message:
        'Chúc mừng, đơn ứng tuyển của bạn đã được chuyển sang trạng thái trúng tuyển.',
    },
  ])(
    'sends application_$status with the unchanged in-app copy',
    async ({ status, type, title, message }) => {
      await expect(
        service.applicationStatusChanged(applicationId, status, []),
      ).resolves.toBeUndefined();

      expectEmailRow(type, { context });
      expectQueuedEmail();
      expectApplicationInApp(title, message);
    },
  );

  it('sends one application_rejected listing the cancelled schedules and no schedule_cancelled', async () => {
    const cancelledSchedules = [
      {
        interviewId,
        startAt: new Date('2026-10-20T02:30:00Z'),
        durationMinutes: 60,
        interviewType: InterviewType.online,
      },
      {
        interviewId: '0828d196-ee39-4d23-881e-a1e2ef251899',
        startAt: new Date('2026-10-21T07:00:00Z'),
        durationMinutes: 45,
        interviewType: InterviewType.onsite,
      },
    ];

    await service.applicationStatusChanged(
      applicationId,
      ApplicationStatus.rejected,
      cancelledSchedules,
    );

    expectEmailRow(EmailNotificationType.application_rejected, {
      context,
      cancelledSchedules: [
        {
          startAt: '2026-10-20T02:30:00.000Z',
          durationMinutes: 60,
          interviewType: InterviewType.online,
        },
        {
          startAt: '2026-10-21T07:00:00.000Z',
          durationMinutes: 45,
          interviewType: InterviewType.onsite,
        },
      ],
    });
    expectQueuedEmail();
    expectApplicationInApp(
      'Đơn ứng tuyển đã bị từ chối',
      'Rất tiếc, đơn ứng tuyển của bạn đã bị từ chối.',
    );
  });

  it.each([
    ApplicationStatus.screening,
    ApplicationStatus.applied,
    ApplicationStatus.cancelled,
  ])('does nothing for %s', async (status) => {
    await expect(
      service.applicationStatusChanged(applicationId, status, []),
    ).resolves.toBeUndefined();

    expectNoDelivery();
  });

  it("schedule_created creates the interview in-app and the email with the interviewer's name", async () => {
    const schedule = makeSchedule();

    await service.scheduleCreated(schedule);

    expectEmailRow(
      EmailNotificationType.schedule_created,
      { context, schedule: scheduleDetails },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead();
    expectScheduleInApp(
      'Bạn có lịch phỏng vấn mới',
      `Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS & API: ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)}.`,
    );
  });

  it('sends schedule_updated with only the changed fields as previous', async () => {
    const before = makeSchedule();
    const after = makeSchedule({
      startAt: new Date('2026-10-21T03:00:00Z'),
      durationMinutes: 90,
    });

    await service.scheduleChanged(before, after);

    expectEmailRow(
      EmailNotificationType.schedule_updated,
      {
        context,
        schedule: {
          ...scheduleDetails,
          startAt: '2026-10-21T03:00:00.000Z',
          durationMinutes: 90,
        },
        previous: { startAt: '2026-10-20T02:30:00.000Z', durationMinutes: 60 },
      },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead();
    expectScheduleInApp(
      'Lịch phỏng vấn đã thay đổi',
      `Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS & API đã thay đổi: ${formatInterviewTime(after.startAt, after.durationMinutes)}.`,
    );
  });

  it("uses the old interviewer's name when the interviewer changes", async () => {
    const before = makeSchedule();
    const after = makeSchedule({ interviewerId: newInterviewerId });
    prisma.user.findMany.mockResolvedValue([
      { userId: newInterviewerId, fullName: 'Lê Thu Hà' },
      { userId: interviewerId, fullName: 'Trần Hoàng Nam' },
    ]);

    await service.scheduleChanged(before, after);

    expectEmailRow(
      EmailNotificationType.schedule_updated,
      {
        context,
        schedule: { ...scheduleDetails, interviewerName: 'Lê Thu Hà' },
        previous: { interviewerName: 'Trần Hoàng Nam' },
      },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead([interviewerId, newInterviewerId]);
    expectScheduleInApp(
      'Lịch phỏng vấn đã thay đổi',
      `Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS & API đã thay đổi: ${formatInterviewTime(after.startAt, after.durationMinutes)}.`,
    );
  });

  it('sends nothing when no candidate-visible field changed', async () => {
    const before = makeSchedule({ onlineMeetingLink: null });
    const after = {
      ...before,
      startAt: new Date('2026-10-20T09:30:00+07:00'),
      onlineMeetingLink: undefined,
      location: undefined,
      staffNotes: 'Chỉ cập nhật ghi chú nội bộ',
    } as unknown as ScheduleSnapshot;

    await expect(service.scheduleChanged(before, after)).resolves.toBeUndefined();

    expectNoDelivery();
  });

  it('sends schedule_cancelled when a scheduled interview is cancelled, even with other changes', async () => {
    const before = makeSchedule();
    const after = makeSchedule({
      status: ScheduleStatus.cancelled,
      startAt: new Date('2026-10-21T03:00:00Z'),
      durationMinutes: 45,
      interviewType: InterviewType.onsite,
      onlineMeetingLink: null,
      location: 'Tầng 5, 123 Nguyễn Huệ, Thành phố Hồ Chí Minh',
    });

    await service.scheduleChanged(before, after);

    expectEmailRow(
      EmailNotificationType.schedule_cancelled,
      {
        context,
        schedule: {
          ...scheduleDetails,
          startAt: '2026-10-21T03:00:00.000Z',
          durationMinutes: 45,
          interviewType: InterviewType.onsite,
          onlineMeetingLink: null,
          location: 'Tầng 5, 123 Nguyễn Huệ, Thành phố Hồ Chí Minh',
        },
      },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead();
    expectScheduleInApp(
      'Lịch phỏng vấn đã bị hủy',
      `Buổi phỏng vấn cho vị trí Kỹ sư Backend NestJS & API lúc ${formatInterviewTime(after.startAt, after.durationMinutes)} đã bị hủy.`,
    );
  });

  it('sends schedule_cancelled for a past-due scheduled interview that is cancelled', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-21T00:00:00Z') });
    const before = makeSchedule();
    const after = makeSchedule({ status: ScheduleStatus.cancelled });

    await service.scheduleChanged(before, after);

    expectEmailRow(
      EmailNotificationType.schedule_cancelled,
      { context, schedule: scheduleDetails },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead();
    expectScheduleInApp(
      'Lịch phỏng vấn đã bị hủy',
      `Buổi phỏng vấn cho vị trí Kỹ sư Backend NestJS & API lúc ${formatInterviewTime(after.startAt, after.durationMinutes)} đã bị hủy.`,
    );
  });

  it('sends nothing when the schedule is completed', async () => {
    const before = makeSchedule();
    const after = makeSchedule({
      status: ScheduleStatus.completed,
      startAt: new Date('2026-10-21T03:00:00Z'),
      durationMinutes: 90,
    });

    await expect(service.scheduleChanged(before, after)).resolves.toBeUndefined();

    expectNoDelivery();
  });

  it('scheduleRemoved sends schedule_cancelled for an upcoming scheduled interview', async () => {
    const schedule = makeSchedule();

    await service.scheduleRemoved(schedule, new Date('2026-10-19T00:00:00Z'));

    expectEmailRow(
      EmailNotificationType.schedule_cancelled,
      { context, schedule: scheduleDetails },
      { interviewId },
    );
    expectQueuedEmail();
    expectInterviewerRead();
    expectScheduleInApp(
      'Lịch phỏng vấn đã bị hủy',
      `Buổi phỏng vấn cho vị trí Kỹ sư Backend NestJS & API lúc ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)} đã bị hủy.`,
    );
  });

  it.each(['past', 'completed', 'cancelled'] as const)(
    'scheduleRemoved sends nothing for a %s schedule',
    async (scheduleCase) => {
      const removedAt = new Date('2026-10-21T00:00:00Z');
      const starts =
        scheduleCase === 'past'
          ? [new Date('2026-10-20T02:30:00Z'), removedAt]
          : [new Date('2026-10-22T02:30:00Z')];
      const status =
        scheduleCase === 'past'
          ? ScheduleStatus.scheduled
          : scheduleCase === 'completed'
            ? ScheduleStatus.completed
            : ScheduleStatus.cancelled;

      for (const startAt of starts) {
        await expect(
          service.scheduleRemoved(makeSchedule({ startAt, status }), removedAt),
        ).resolves.toBeUndefined();
      }

      expectNoDelivery();
    },
  );

  it('skips an inactive candidate', async () => {
    application.candidate.user.status = UserStatus.inactive;

    await service.applicationStatusChanged(
      applicationId,
      ApplicationStatus.interview,
      [],
    );

    expectEmailRow(
      EmailNotificationType.application_interview,
      { context },
      { status: EmailNotificationStatus.skipped },
    );
    expect(queue.add).not.toHaveBeenCalled();
    expectApplicationInApp(
      'Đơn ứng tuyển chuyển sang vòng phỏng vấn',
      'Đơn ứng tuyển của bạn đã được chuyển sang vòng phỏng vấn.',
    );
  });

  it('keeps the row pending and logs when enqueueing fails', async () => {
    const schedule = makeSchedule();
    queue.add.mockRejectedValue(new Error('Redis is unavailable'));

    await expect(service.scheduleCreated(schedule)).resolves.toBeUndefined();

    expectEmailRow(
      EmailNotificationType.schedule_created,
      { context, schedule: scheduleDetails },
      { interviewId },
    );
    expectQueuedEmail();
    expect(prisma.emailNotification.updateMany).not.toHaveBeenCalled();
    expectScheduleInApp(
      'Bạn có lịch phỏng vấn mới',
      `Lịch phỏng vấn cho vị trí Kỹ sư Backend NestJS & API: ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)}.`,
    );
    expect(warn).toHaveBeenCalledWith(
      `Failed to queue the email for schedule_created of application ${applicationId}: Redis is unavailable`,
    );
  });

  it('still queues the email when the in-app write fails', async () => {
    notificationsService.create.mockRejectedValue(new Error('Notification write failed'));

    await expect(
      service.applicationStatusChanged(applicationId, ApplicationStatus.offer, []),
    ).resolves.toBeUndefined();

    expectEmailRow(EmailNotificationType.application_offer, { context });
    expectQueuedEmail();
    expectApplicationInApp(
      'Cập nhật đề nghị tuyển dụng',
      'Đơn ứng tuyển của bạn đã được chuyển sang vòng đề nghị tuyển dụng.',
    );
    expect(warn).toHaveBeenCalledWith(
      `Failed to create the in-app notification for application_offer of application ${applicationId}: Notification write failed`,
    );
  });

  it('never rejects when reading the application fails', async () => {
    prisma.application.findUnique.mockRejectedValue(new Error('Application read failed'));
    const before = makeSchedule();
    const after = makeSchedule({ startAt: new Date('2026-10-21T03:00:00Z') });
    const calls = [
      {
        type: 'application_received',
        invoke: () => service.applicationReceived(applicationId),
      },
      {
        type: 'application_interview',
        invoke: () =>
          service.applicationStatusChanged(applicationId, ApplicationStatus.interview, []),
      },
      { type: 'schedule_created', invoke: () => service.scheduleCreated(before) },
      {
        type: 'schedule_updated',
        invoke: () => service.scheduleChanged(before, after),
      },
      {
        type: 'schedule_cancelled',
        invoke: () =>
          service.scheduleRemoved(before, new Date('2026-10-19T00:00:00Z')),
      },
    ];

    for (const { type, invoke } of calls) {
      await expect(invoke()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        `Failed to queue the email for ${type} of application ${applicationId}: Application read failed`,
      );
    }

    expect(prisma.application.findUnique.mock.calls).toEqual(
      calls.map(() => [applicationQuery]),
    );
    expectNoDelivery();
  });

  it('module sets a global rate limit of 30 per minute', async () => {
    await new CandidateNotificationsModule(queue as any).onModuleInit();

    expect(queue.setGlobalRateLimit.mock.calls).toEqual([[30, 60000]]);
  });
});
