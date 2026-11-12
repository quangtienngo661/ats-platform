// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { joinInterviewRoomAction } from './interview-room.action';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post } }));
// As in the other action tests: Next.js redirects and notFound are not what these
// cases are about.
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const access = {
  serverUrl: 'ws://localhost:7880',
  token: 'jwt',
  roomName: 'interview-int-1',
  identity: 'user-1',
  displayName: 'Nguyễn Ứng Viên',
  role: 'candidate',
  expiresAt: '2026-11-20T03:30:00.000Z',
};

describe('joinInterviewRoomAction', () => {
  it('asks the API for a token of that interview', async () => {
    mocks.post.mockResolvedValue({ data: access });

    await expect(joinInterviewRoomAction('int-1')).resolves.toEqual({ ok: true, access });
    expect(mocks.post).toHaveBeenCalledWith('/interviews/schedules/int-1/join');
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
