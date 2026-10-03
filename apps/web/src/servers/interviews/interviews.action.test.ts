// @vitest-environment node
// The web server can run in any timezone (the Docker image runs in UTC). The time a
// recruiter picks must reach the API exactly as the browser converted it.
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInterviewScheduleAction,
  getCandidateInterviewSchedulesAction,
  updateInterviewScheduleAction,
} from './interviews.action';

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

describe('schedule actions — interview type (C4, R3)', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({ data: { interviewId: 'int-1' } });
    mocks.patch.mockResolvedValue({ data: { interviewId: 'int-1' } });
  });

  it('sends the chosen online type with its meeting link', async () => {
    await createInterviewScheduleAction(
      initialState,
      scheduleForm({ interviewType: 'online', onlineMeetingLink: 'https://meet.example.com/x', location: '' }),
    );

    const payload = mocks.post.mock.calls[0][1];
    expect(payload).toMatchObject({ interviewType: 'online', onlineMeetingLink: 'https://meet.example.com/x' });
    expect(payload).not.toHaveProperty('location');
  });

  it('sends the onsite location', async () => {
    await createInterviewScheduleAction(
      initialState,
      scheduleForm({ interviewType: 'onsite', location: 'Tầng 5, 123 Lê Lợi, Q.1', onlineMeetingLink: '' }),
    );

    const payload = mocks.post.mock.calls[0][1];
    expect(payload).toMatchObject({ interviewType: 'onsite', location: 'Tầng 5, 123 Lê Lợi, Q.1' });
    expect(payload).not.toHaveProperty('onlineMeetingLink');
  });

  it.each([
    ['without a link', ''],
    ['with a non-http(s) link', 'javascript:alert(1)'],
  ])('refuses an online interview %s', async (_label, link) => {
    const result = await createInterviewScheduleAction(
      initialState,
      scheduleForm({ interviewType: 'online', onlineMeetingLink: link, location: null }),
    );

    expect(result).toEqual({ success: false, message: 'Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ' });
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('refuses an onsite interview without a location', async () => {
    const result = await createInterviewScheduleAction(initialState, scheduleForm({ location: '   ' }));

    expect(result).toEqual({ success: false, message: 'Phỏng vấn trực tiếp cần địa điểm' });
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('sends the type and link when rescheduling', async () => {
    const form = scheduleForm({ interviewType: 'online', onlineMeetingLink: 'https://meet.example.com/y', location: null });
    form.set('interviewId', 'int-1');

    await updateInterviewScheduleAction(initialState, form);

    expect(mocks.patch).toHaveBeenCalledWith('/interviews/schedules/int-1', {
      interviewerId: 'user-2',
      interviewType: 'online',
      startAt: '2026-10-05T02:00:00.000Z',
      durationMinutes: 60,
      onlineMeetingLink: 'https://meet.example.com/y',
    });
  });
});

describe('getCandidateInterviewSchedulesAction', () => {
  it('asks the API for the candidate schedules with the requested order', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } } });

    await getCandidateInterviewSchedulesAction({ status: 'scheduled', fromDate: '2026-10-04', order: 'asc', limit: 50 });

    expect(mocks.get).toHaveBeenCalledWith('/interviews/schedules/my', {
      params: { status: 'scheduled', fromDate: '2026-10-04', order: 'asc', limit: 50 },
    });
  });
});
