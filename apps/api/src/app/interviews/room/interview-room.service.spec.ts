import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  InterviewType,
  NotificationType,
  RelatedEntityType,
  ScheduleStatus,
  UserRole,
} from '@ats-platform/database';
import { TokenVerifier } from 'livekit-server-sdk';
import { InterviewRoomAccess, InterviewRoomJoin, InterviewRoomService } from './interview-room.service';
import { LiveKitService } from '../../../common/external-apis/livekit/livekit.service';
import {
  callerOf,
  createPrismaMock,
  createSocketMock,
} from '../../../test-utils/unit-test-helpers';

const KEY = 'devkey';
const SECRET = 'secret-used-only-by-this-test';
const configured = {
  LIVEKIT_API_KEY: KEY,
  LIVEKIT_API_SECRET: SECRET,
  LIVEKIT_PUBLIC_URL: 'ws://localhost:7880',
};
const configOf = (values: Record<string, string | undefined>) =>
  ({ get: (key: string) => values[key] }) as any;

// 09:00 Vietnam time = 02:00 UTC; the room is open 01:45–03:30 UTC for a 60-minute interview.
const START = new Date('2026-11-20T02:00:00.000Z');
const DURING = new Date('2026-11-20T02:10:00.000Z');
const EARLIER = new Date('2026-11-20T01:50:00.000Z');

const scheduleRow = (overrides: Record<string, unknown> = {}) => ({
  interviewId: 'int-1',
  organizationId: 'org-1',
  interviewType: InterviewType.online,
  status: ScheduleStatus.scheduled,
  startAt: START,
  durationMinutes: 60,
  scheduledBy: 'scheduler-1',
  interviewerId: 'interviewer-1',
  candidateWaitingAt: null,
  candidateAdmittedAt: null,
  scheduler: { fullName: 'Lê Người Tạo' },
  interviewer: { fullName: 'Trần Người Phỏng Vấn' },
  application: {
    candidate: { userId: 'cand-user-1', user: { fullName: 'Nguyễn Ứng Viên' } },
    jobPosting: { title: 'Backend Developer' },
  },
  ...overrides,
});

const candidate = callerOf(UserRole.candidate, { userId: 'cand-user-1', organizationId: null });
const interviewer = callerOf(UserRole.recruiter, { userId: 'interviewer-1' }); // organization 'org-1'
const scheduler = callerOf(UserRole.recruiter, { userId: 'scheduler-1' });

const admitted = (result: InterviewRoomJoin): InterviewRoomAccess => {
  if (result.status !== 'admitted') throw new Error(`expected admitted, got ${result.status}`);
  return result;
};

describe('InterviewRoomService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let socket: ReturnType<typeof createSocketMock>;
  let notifications: { create: jest.Mock };
  let service: InterviewRoomService;

  const build = (config: Record<string, string | undefined> = configured) => {
    service = new InterviewRoomService(
      prisma as any,
      new LiveKitService(configOf(config)),
      socket as any,
      notifications as any,
    );
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow());
    prisma.interviewSchedule.updateMany.mockResolvedValue({ count: 1 });
    socket = createSocketMock();
    notifications = { create: jest.fn().mockResolvedValue({}) };
    build();
  });

  describe('join', () => {
    it('gives an admitted candidate a token for this interview room only', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleRow({ candidateWaitingAt: EARLIER, candidateAdmittedAt: DURING }),
      );
      // The SDK stamps `exp` from the wall clock plus the ttl, so pin the wall clock to "now".
      jest.useFakeTimers({ now: DURING, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      const access = admitted(
        await service.join('int-1', candidate, DURING).finally(() => jest.useRealTimers()),
      );

      expect(access).toEqual(
        expect.objectContaining({
          status: 'admitted',
          serverUrl: 'ws://localhost:7880',
          roomName: 'interview-int-1',
          identity: 'cand-user-1',
          displayName: 'Nguyễn Ứng Viên',
          role: 'candidate',
          expiresAt: '2026-11-20T03:30:00.000Z',
          waitingCandidate: null,
        }),
      );

      const claims = await new TokenVerifier(KEY, SECRET).verify(access.token, 10 ** 9);
      expect(claims.sub).toBe('cand-user-1');
      expect(claims.name).toBe('Nguyễn Ứng Viên');
      expect(claims.metadata).toBe(JSON.stringify({ role: 'candidate' }));
      expect(claims.video).toEqual({
        roomJoin: true,
        room: 'interview-int-1',
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
      // The token dies when the room closes, not later.
      expect(claims.exp).toBe(Date.parse('2026-11-20T03:30:00.000Z') / 1000);
      // An admitted candidate is not waiting: nothing is written or sent.
      expect(prisma.interviewSchedule.updateMany).not.toHaveBeenCalled();
      expect(socket.handleEmit).not.toHaveBeenCalled();
    });

    it.each([
      ['the interviewer', interviewer, 'Trần Người Phỏng Vấn'],
      ['the recruiter who scheduled it', scheduler, 'Lê Người Tạo'],
    ])('lets %s in as interviewer', async (_label, caller, name) => {
      const access = admitted(await service.join('int-1', caller, DURING));

      expect(access.role).toBe('interviewer');
      expect(access.displayName).toBe(name);
      expect(access.waitingCandidate).toBeNull();
      const claims = await new TokenVerifier(KEY, SECRET).verify(access.token, 10 ** 9);
      expect(claims.metadata).toBe(JSON.stringify({ role: 'interviewer' }));
    });

    it.each([
      ['another candidate', callerOf(UserRole.candidate, { userId: 'cand-user-2', organizationId: null })],
      ['another recruiter of the same organization', callerOf(UserRole.recruiter, { userId: 'rec-9' })],
      ['the org_admin of that organization', callerOf(UserRole.org_admin, { userId: 'orgadmin-1' })],
      ['a platform admin who is not in the interview', callerOf(UserRole.admin, { userId: 'admin-1' })],
      [
        'the interviewer after moving to another organization',
        callerOf(UserRole.recruiter, { userId: 'interviewer-1', organizationId: 'org-2' }),
      ],
    ])('refuses %s', async (_label, caller) => {
      const call = service.join('int-1', caller, DURING);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toThrow('Bạn không tham gia buổi phỏng vấn này');
    });

    it('lets a platform admin who scheduled the interview in', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ scheduledBy: 'admin-1' }));

      const access = admitted(
        await service.join('int-1', callerOf(UserRole.admin, { userId: 'admin-1' }), DURING),
      );

      expect(access.role).toBe('interviewer');
    });

    it('answers 404 for an interview that does not exist', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(null);

      await expect(service.join('missing', candidate, DURING)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('applies the time window after the participant check', async () => {
      await expect(
        service.join('int-1', candidate, new Date('2026-11-20T03:30:01.000Z')),
      ).rejects.toThrow('Buổi phỏng vấn đã kết thúc');
      await expect(
        service.join('int-1', callerOf(UserRole.candidate, { userId: 'x', organizationId: null }), new Date('2026-11-20T03:30:01.000Z')),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.interviewSchedule.updateMany).not.toHaveBeenCalled();
    });

    it('answers 503 when LiveKit is not configured, and only to a participant', async () => {
      build({});

      const call = service.join('int-1', candidate, DURING);
      await expect(call).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(call).rejects.toThrow('Phòng phỏng vấn trực tuyến chưa được cấu hình');
      await expect(
        service.join('int-1', callerOf(UserRole.candidate, { userId: 'x', organizationId: null }), DURING),
      ).rejects.toBeInstanceOf(ForbiddenException);
      // A candidate is not put in a waiting room nobody can open.
      expect(prisma.interviewSchedule.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('waiting room (R24, R25)', () => {
    it('keeps a candidate who is not admitted out: no token, the wait is recorded', async () => {
      const result = await service.join('int-1', candidate, DURING);

      expect(result).toEqual({
        status: 'waiting',
        displayName: 'Nguyễn Ứng Viên',
        since: '2026-11-20T02:10:00.000Z',
        closesAt: '2026-11-20T03:30:00.000Z',
      });
      // Only the first call records when the wait began.
      expect(prisma.interviewSchedule.updateMany).toHaveBeenCalledWith({
        where: { interviewId: 'int-1', candidateWaitingAt: null },
        data: { candidateWaitingAt: DURING },
      });
    });

    it('tells the interviewer and the scheduler, and notifies them the first time', async () => {
      await service.join('int-1', candidate, DURING);

      const payload = {
        interviewId: 'int-1',
        candidateName: 'Nguyễn Ứng Viên',
        since: '2026-11-20T02:10:00.000Z',
      };
      expect(socket.handleEmit.mock.calls).toEqual([
        ['interview-room:waiting', payload, 'user_interviewer-1'],
        ['interview-room:waiting', payload, 'user_scheduler-1'],
      ]);
      expect(notifications.create.mock.calls.map(([dto]) => dto)).toEqual(
        ['interviewer-1', 'scheduler-1'].map((userId) => ({
          userId,
          type: NotificationType.interview,
          title: 'Ứng viên đang chờ',
          message: 'Nguyễn Ứng Viên đang chờ trong phòng phỏng vấn vị trí Backend Developer.',
          relatedEntityId: 'int-1',
          relatedEntityType: RelatedEntityType.interview,
        })),
      );
    });

    it('on a later call keeps the first waiting time and does not notify again', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ candidateWaitingAt: EARLIER }));
      prisma.interviewSchedule.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.join('int-1', candidate, DURING);

      expect(result).toEqual(expect.objectContaining({ status: 'waiting', since: '2026-11-20T01:50:00.000Z' }));
      expect(socket.handleEmit).toHaveBeenCalledTimes(2);
      expect(socket.handleEmit.mock.calls[0][1]).toEqual(
        expect.objectContaining({ since: '2026-11-20T01:50:00.000Z' }),
      );
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('sends one event and one notification when the interviewer also scheduled it', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ scheduledBy: 'interviewer-1' }));

      await service.join('int-1', candidate, DURING);

      expect(socket.handleEmit.mock.calls.map((call) => call[2])).toEqual(['user_interviewer-1']);
      expect(notifications.create).toHaveBeenCalledTimes(1);
    });

    it('still answers "waiting" when the notification cannot be saved', async () => {
      notifications.create.mockRejectedValue(new Error('db down'));

      await expect(service.join('int-1', candidate, DURING)).resolves.toEqual(
        expect.objectContaining({ status: 'waiting' }),
      );
    });

    it('shows the interviewer who is waiting', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ candidateWaitingAt: EARLIER }));

      const access = admitted(await service.join('int-1', interviewer, DURING));

      expect(access.waitingCandidate).toEqual({
        name: 'Nguyễn Ứng Viên',
        since: '2026-11-20T01:50:00.000Z',
      });
    });

    it('shows nobody waiting once the candidate is admitted', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleRow({ candidateWaitingAt: EARLIER, candidateAdmittedAt: DURING }),
      );

      const access = admitted(await service.join('int-1', interviewer, DURING));

      expect(access.waitingCandidate).toBeNull();
    });
  });

  describe('admit (R26)', () => {
    // A refused admission writes and sends nothing.
    const expectNothingDone = () => {
      expect(prisma.interviewSchedule.updateMany).not.toHaveBeenCalled();
      expect(socket.handleEmit).not.toHaveBeenCalled();
    };

    it.each([
      ['the interviewer', interviewer],
      ['the recruiter who scheduled it', scheduler],
    ])('lets %s admit the candidate and tells everyone in the interview', async (_label, caller) => {
      const result = await service.admit('int-1', caller, DURING);

      expect(result).toEqual({ admittedAt: '2026-11-20T02:10:00.000Z' });
      expect(prisma.interviewSchedule.updateMany).toHaveBeenCalledWith({
        where: { interviewId: 'int-1', candidateAdmittedAt: null },
        data: { candidateAdmittedAt: DURING },
      });
      expect(socket.handleEmit.mock.calls).toEqual(
        ['user_cand-user-1', 'user_interviewer-1', 'user_scheduler-1'].map((room) => [
          'interview-room:admitted',
          { interviewId: 'int-1' },
          room,
        ]),
      );
    });

    it('keeps the first admission time when called again', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow({ candidateAdmittedAt: EARLIER }));
      prisma.interviewSchedule.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.admit('int-1', interviewer, DURING)).resolves.toEqual({
        admittedAt: '2026-11-20T01:50:00.000Z',
      });
    });

    it('refuses the candidate', async () => {
      const call = service.admit('int-1', candidate, DURING);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toThrow('Chỉ người phỏng vấn được cho ứng viên vào phòng');
      expectNothingDone();
    });

    it('refuses staff who are not in the interview', async () => {
      const call = service.admit('int-1', callerOf(UserRole.org_admin, { userId: 'orgadmin-1' }), DURING);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toThrow('Bạn không tham gia buổi phỏng vấn này');
      expectNothingDone();
    });

    it('answers 404 for an interview that does not exist', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(null);

      await expect(service.admit('missing', interviewer, DURING)).rejects.toBeInstanceOf(NotFoundException);
      expectNothingDone();
    });

    it('refuses outside the room window', async () => {
      const call = service.admit('int-1', interviewer, new Date('2026-11-20T03:30:01.000Z'));

      await expect(call).rejects.toBeInstanceOf(BadRequestException);
      await expect(call).rejects.toThrow('Buổi phỏng vấn đã kết thúc');
      expectNothingDone();
    });
  });
});
