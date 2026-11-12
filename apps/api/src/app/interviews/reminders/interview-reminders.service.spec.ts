import {
  InterviewType,
  NotificationType,
  RelatedEntityType,
  ScheduleStatus,
} from '@ats-platform/database';
import { InterviewRemindersService } from './interview-reminders.service';
import { createPrismaMock, createQueueMock } from '../../../test-utils/unit-test-helpers';

const HOUR = 60 * 60 * 1000;
// 09:00–10:00 Vietnam time on Friday 20/11/2026.
const START = new Date('2026-11-20T02:00:00.000Z');
const TWO_DAYS_BEFORE = new Date(START.getTime() - 48 * HOUR);

const scheduleRow = (overrides: Record<string, unknown> = {}) => ({
  interviewId: 'int-1',
  startAt: START,
  durationMinutes: 60,
  interviewType: InterviewType.online,
  status: ScheduleStatus.scheduled,
  scheduledBy: 'scheduler-1',
  interviewerId: 'interviewer-1',
  application: {
    candidate: { userId: 'cand-user-1', user: { fullName: 'Nguyễn Ứng Viên' } },
    jobPosting: { title: 'Backend Developer' },
  },
  ...overrides,
});

const job = { interviewId: 'int-1', startAt: START.toISOString() };

describe('InterviewRemindersService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let queue: ReturnType<typeof createQueueMock>;
  let notifications: { create: jest.Mock };
  let service: InterviewRemindersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow());
    queue = createQueueMock();
    queue.add.mockResolvedValue({});
    notifications = { create: jest.fn().mockResolvedValue({}) };
    service = new InterviewRemindersService(queue as any, prisma as any, notifications as any);
  });

  describe('schedule', () => {
    it('queues delayed jobs that carry the start time they were planned for', async () => {
      await service.schedule(scheduleRow(), TWO_DAYS_BEFORE);

      expect(queue.add.mock.calls).toEqual([
        ['reminder', job, { delay: 24 * HOUR, jobId: `reminder-int-1-${START.getTime()}` }],
        [
          'room-open',
          job,
          { delay: 48 * HOUR - 15 * 60 * 1000, jobId: `room-open-int-1-${START.getTime()}` },
        ],
      ]);
    });

    it('never fails the schedule change when the queue is down', async () => {
      queue.add.mockRejectedValue(new Error('redis down'));

      await expect(service.schedule(scheduleRow(), TWO_DAYS_BEFORE)).resolves.toBeUndefined();
    });
  });

  describe('deliver (R30)', () => {
    const sent = () => notifications.create.mock.calls.map(([dto]) => dto);

    it('reminds the candidate, the interviewer and the scheduler a day before', async () => {
      await service.deliver('reminder', job);

      const when = '09:00–10:00, Thứ Sáu, 20/11/2026 (giờ Việt Nam)';
      const common = {
        type: NotificationType.interview,
        title: 'Nhắc lịch phỏng vấn',
        relatedEntityId: 'int-1',
        relatedEntityType: RelatedEntityType.interview,
      };
      expect(sent()).toEqual([
        { ...common, userId: 'cand-user-1', message: `Bạn có buổi phỏng vấn vị trí Backend Developer: ${when}.` },
        {
          ...common,
          userId: 'interviewer-1',
          message: `Phỏng vấn Nguyễn Ứng Viên, vị trí Backend Developer: ${when}.`,
        },
        {
          ...common,
          userId: 'scheduler-1',
          message: `Phỏng vấn Nguyễn Ứng Viên, vị trí Backend Developer: ${when}.`,
        },
      ]);
    });

    it('tells everyone the room has opened', async () => {
      await service.deliver('room-open', job);

      expect(sent().map(({ userId, title, message }) => ({ userId, title, message }))).toEqual([
        {
          userId: 'cand-user-1',
          title: 'Phòng phỏng vấn đã mở',
          message: 'Phòng phỏng vấn vị trí Backend Developer đã mở. Buổi phỏng vấn bắt đầu lúc 09:00.',
        },
        {
          userId: 'interviewer-1',
          title: 'Phòng phỏng vấn đã mở',
          message: 'Phòng phỏng vấn Nguyễn Ứng Viên, vị trí Backend Developer đã mở. Bắt đầu lúc 09:00.',
        },
        {
          userId: 'scheduler-1',
          title: 'Phòng phỏng vấn đã mở',
          message: 'Phòng phỏng vấn Nguyễn Ứng Viên, vị trí Backend Developer đã mở. Bắt đầu lúc 09:00.',
        },
      ]);
    });

    it('notifies an interviewer who also scheduled it once', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ scheduledBy: 'interviewer-1' }));

      await service.deliver('reminder', job);

      expect(sent().map((dto) => dto.userId)).toEqual(['cand-user-1', 'interviewer-1']);
    });

    it.each([
      ['the schedule is gone', null],
      ['it was cancelled', scheduleRow({ status: ScheduleStatus.cancelled })],
      ['it is completed', scheduleRow({ status: ScheduleStatus.completed })],
      ['it was moved', scheduleRow({ startAt: new Date(START.getTime() + HOUR) })],
    ])('sends nothing when %s', async (_label, row) => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(row);

      await service.deliver('reminder', job);

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('announces no room for an interview that became onsite', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleRow({ interviewType: InterviewType.onsite }),
      );

      await service.deliver('room-open', job);
      expect(notifications.create).not.toHaveBeenCalled();

      await service.deliver('reminder', job);
      expect(notifications.create).toHaveBeenCalledTimes(3);
    });

    it('lets a failed save fail the job, so BullMQ retries it', async () => {
      notifications.create.mockRejectedValue(new Error('db down'));

      await expect(service.deliver('reminder', job)).rejects.toThrow('db down');
    });
  });
});
