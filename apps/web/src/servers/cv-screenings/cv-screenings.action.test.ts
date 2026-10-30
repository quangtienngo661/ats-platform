// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { reviewScreeningAction } from './cv-screenings.action';

const mocks = vi.hoisted(() => ({ patch: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: vi.fn(), patch: mocks.patch } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const scores = { skillsScore: 80, experienceScore: 70, educationScore: 60 };

describe('reviewScreeningAction', () => {
  beforeEach(() => {
    mocks.patch.mockReset().mockResolvedValue({ data: { screeningId: 'screen-1' } });
    vi.mocked(revalidatePath).mockClear();
  });

  it('PATCHes /screening/:applicationId/review with the scores and revalidates the pages that show them', async () => {
    const result = await reviewScreeningAction('app-1', { ...scores, note: 'Đã xem lại' });

    expect(mocks.patch).toHaveBeenCalledWith('/screening/app-1/review', { ...scores, note: 'Đã xem lại' });
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('leaves a blank note out of the request', async () => {
    await reviewScreeningAction('app-1', { ...scores, note: '   ' });

    expect(mocks.patch.mock.calls[0][1]).toEqual(scores);
  });

  it('refuses a missing application id without calling the API', async () => {
    const result = await reviewScreeningAction('', scores);

    expect(result).toEqual({ success: false, message: 'Thiếu ID đơn ứng tuyển' });
    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it('returns the API message on failure and does not revalidate', async () => {
    mocks.patch.mockRejectedValue({
      response: { status: 400, data: { message: 'Vui lòng nhập lý do khi sửa điểm' } },
    });

    const result = await reviewScreeningAction('app-1', scores);

    expect(result).toEqual({ success: false, message: 'Vui lòng nhập lý do khi sửa điểm' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('falls back to a Vietnamese message when the failure carries none', async () => {
    mocks.patch.mockRejectedValue(new Error('network'));

    const result = await reviewScreeningAction('app-1', scores);

    expect(result).toEqual({ success: false, message: 'Duyệt điểm thất bại. Vui lòng thử lại.' });
  });
});
