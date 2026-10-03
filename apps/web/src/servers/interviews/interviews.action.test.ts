// @vitest-environment node
// The web server can run in any timezone (the Docker image runs in UTC). The time a
// recruiter picks must reach the API exactly as the browser converted it.
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInterviewScheduleAction } from './interviews.action';

const originalTz = process.env.TZ;
process.env.TZ = 'UTC';

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), get: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post, patch: mocks.patch, get: mocks.get } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const initialState = { success: false, message: '' };

function scheduleForm(overrides: Record<string, string | null> = {}) {
  const fields: Record<string, string | null> = {
    applicationId: 'app-1',
    interviewerId: 'user-2',
    scheduledDate: '2026-10-05',
    scheduledTime: '09:00',
    startAt: '2026-10-05T02:00:00.000Z',
    durationMinutes: '60',
    interviewType: 'onsite',
    location: 'Tầng 5',
    ...overrides,
  };
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value !== null) form.set(name, value);
  }
  return form;
}

afterAll(() => {
  process.env.TZ = originalTz;
});

describe('createInterviewScheduleAction — start time (C17)', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({ data: { interviewId: 'int-1' } });
  });

  it('sends the browser-converted start time even when the server runs in UTC', async () => {
    const result = await createInterviewScheduleAction(initialState, scheduleForm());

    expect(result.success).toBe(true);
    expect(mocks.post).toHaveBeenCalledWith(
      '/interviews/schedules',
      expect.objectContaining({ startAt: '2026-10-05T02:00:00.000Z' }),
    );
  });

  it('refuses a start time without an explicit offset', async () => {
    const result = await createInterviewScheduleAction(
      initialState,
      scheduleForm({ startAt: '2026-10-05T09:00:00' }),
    );

    expect(result).toEqual({ success: false, message: 'Ngày hoặc giờ phỏng vấn không hợp lệ' });
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('refuses a missing start time', async () => {
    const result = await createInterviewScheduleAction(initialState, scheduleForm({ startAt: null }));

    expect(result).toEqual({ success: false, message: 'Ngày hoặc giờ phỏng vấn không hợp lệ' });
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
