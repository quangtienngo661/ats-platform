// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { admitCandidateAction, joinInterviewRoomAction } from './interview-room.action';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post } }));
// As in the other action tests: Next.js redirects and notFound are not what these
// cases are about.
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const access = {
  status: 'admitted',
  serverUrl: 'ws://localhost:7880',
  token: 'jwt',
  roomName: 'interview-int-1',
  identity: 'user-1',
  displayName: 'Nguyễn Ứng Viên',
  role: 'candidate',
  expiresAt: '2026-11-20T03:30:00.000Z',
  waitingCandidate: null,
};

describe('joinInterviewRoomAction', () => {
  it('asks the API for a token of that interview', async () => {
    mocks.post.mockResolvedValue({ data: access });

    await expect(joinInterviewRoomAction('int-1')).resolves.toEqual({ ok: true, room: access });
    expect(mocks.post).toHaveBeenCalledWith('/interviews/schedules/int-1/join');
  });

  it('passes a waiting answer through', async () => {
    const waiting = {
      status: 'waiting',
      displayName: 'Nguyễn Ứng Viên',
      since: '2026-11-20T02:05:00.000Z',
      closesAt: '2026-11-20T03:30:00.000Z',
    };
    mocks.post.mockResolvedValue({ data: waiting });

    await expect(joinInterviewRoomAction('int-1')).resolves.toEqual({ ok: true, room: waiting });
  });

  it.each([
    [403, 'Bạn không tham gia buổi phỏng vấn này'],
    [400, 'Phòng phỏng vấn mở lúc 08:45 ngày 20/11/2026'],
    [503, 'Phòng phỏng vấn trực tuyến chưa được cấu hình'],
  ])('passes the API message of a %s through', async (status, message) => {
    mocks.post.mockRejectedValue({ response: { status, data: { message } } });

    await expect(joinInterviewRoomAction('int-1')).resolves.toEqual({ ok: false, message });
  });

  it('falls back to a generic message when the API sent none', async () => {
    mocks.post.mockRejectedValue(new Error('socket hang up'));

    await expect(joinInterviewRoomAction('int-1')).resolves.toEqual({
      ok: false,
      message: 'Không vào được phòng phỏng vấn. Thử lại sau.',
    });
  });
});

describe('admitCandidateAction', () => {
  it('lets the candidate of that interview in', async () => {
    mocks.post.mockResolvedValue({ data: { admittedAt: '2026-11-20T02:10:00.000Z' } });

    await expect(admitCandidateAction('int-1')).resolves.toEqual({ ok: true });
    expect(mocks.post).toHaveBeenCalledWith('/interviews/schedules/int-1/admit');
  });

  it('passes the API refusal through', async () => {
    mocks.post.mockRejectedValue({ response: { status: 400, data: { message: 'Buổi phỏng vấn đã kết thúc' } } });

    await expect(admitCandidateAction('int-1')).resolves.toEqual({ ok: false, message: 'Buổi phỏng vấn đã kết thúc' });
  });

  it('falls back to a generic message', async () => {
    mocks.post.mockRejectedValue(new Error('socket hang up'));

    await expect(admitCandidateAction('int-1')).resolves.toEqual({
      ok: false,
      message: 'Không cho ứng viên vào được. Thử lại.',
    });
  });
});
