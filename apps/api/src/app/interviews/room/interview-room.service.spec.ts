import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InterviewType, ScheduleStatus, UserRole } from '@ats-platform/database';
import { TokenVerifier } from 'livekit-server-sdk';
import { InterviewRoomService } from './interview-room.service';
import { LiveKitService } from '../../../common/external-apis/livekit/livekit.service';
import { callerOf, createPrismaMock } from '../../../test-utils/unit-test-helpers';

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

const scheduleRow = (overrides: Record<string, unknown> = {}) => ({
  interviewId: 'int-1',
  organizationId: 'org-1',
  interviewType: InterviewType.online,
  status: ScheduleStatus.scheduled,
  startAt: START,
  durationMinutes: 60,
  scheduledBy: 'scheduler-1',
  interviewerId: 'interviewer-1',
  scheduler: { fullName: 'Lê Người Tạo' },
  interviewer: { fullName: 'Trần Người Phỏng Vấn' },
  application: { candidate: { userId: 'cand-user-1', user: { fullName: 'Nguyễn Ứng Viên' } } },
  ...overrides,
});

const candidate = callerOf(UserRole.candidate, { userId: 'cand-user-1', organizationId: null });
const interviewer = callerOf(UserRole.recruiter, { userId: 'interviewer-1' }); // organization 'org-1'
const scheduler = callerOf(UserRole.recruiter, { userId: 'scheduler-1' });

describe('InterviewRoomService.join', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: InterviewRoomService;

  const build = (config: Record<string, string | undefined> = configured) => {
    service = new InterviewRoomService(prisma as any, new LiveKitService(configOf(config)));
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.interviewSchedule.findUnique.mockResolvedValue(scheduleRow());
    build();
  });

  it('gives the candidate of the application a token for this interview room only', async () => {
    // The SDK stamps `exp` from the wall clock plus the ttl, so pin the wall clock to "now".
    jest.useFakeTimers({ now: DURING, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    const access = await service.join('int-1', candidate, DURING).finally(() => jest.useRealTimers());

    expect(access).toEqual(
      expect.objectContaining({
        serverUrl: 'ws://localhost:7880',
        roomName: 'interview-int-1',
        identity: 'cand-user-1',
        displayName: 'Nguyễn Ứng Viên',
        role: 'candidate',
        expiresAt: '2026-11-20T03:30:00.000Z',
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
  });

  it.each([
    ['the interviewer', interviewer, 'Trần Người Phỏng Vấn'],
    ['the recruiter who scheduled it', scheduler, 'Lê Người Tạo'],
  ])('lets %s in as interviewer', async (_label, caller, name) => {
    const access = await service.join('int-1', caller, DURING);

    expect(access.role).toBe('interviewer');
    expect(access.displayName).toBe(name);
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

    const access = await service.join('int-1', callerOf(UserRole.admin, { userId: 'admin-1' }), DURING);

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
  });

  it('answers 503 when LiveKit is not configured, and only to a participant', async () => {
    build({});

    const call = service.join('int-1', candidate, DURING);
    await expect(call).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(call).rejects.toThrow('Phòng phỏng vấn trực tuyến chưa được cấu hình');
    await expect(
      service.join('int-1', callerOf(UserRole.candidate, { userId: 'x', organizationId: null }), DURING),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
