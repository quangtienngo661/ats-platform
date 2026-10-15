// @vitest-environment node
import { ScorecardRecommendation } from '@ats-platform/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getApplicationScorecardsAction, submitScorecardAction } from './scorecards.action';

const mocks = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn(), revalidate: vi.fn(), rethrow: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { put: mocks.put, get: mocks.get } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ unstable_rethrow: mocks.rethrow }));

const input = {
  technicalSkills: 4,
  problemSolving: 5,
  communication: 3,
  cultureFit: 4,
  recommendation: ScorecardRecommendation.yes,
};
const apiScorecard = {
  id: 'scorecard-1',
  interviewId: 'int-1',
  ...input,
  comment: null,
  submittedAt: '2026-10-14T02:00:00.000Z',
  updatedAt: '2026-10-14T02:00:00.000Z',
  author: { userId: 'user-2', fullName: 'Nguyễn An' },
};

describe('scorecard actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.put.mockResolvedValue({ data: apiScorecard });
  });

  it('submitScorecardAction sends a PUT to /interviews/schedules/:id/scorecard with the five fields', async () => {
    for (const submittedInput of [input, { ...input, comment: '' }, { ...input, comment: '   ' }]) {
      const result = await submitScorecardAction('int-1', submittedInput);

      expect(mocks.put).toHaveBeenLastCalledWith('/interviews/schedules/int-1/scorecard', input);
      expect(mocks.put.mock.calls.at(-1)?.[1]).not.toHaveProperty('comment');
      expect(result).toMatchObject({ success: true, data: apiScorecard });
      expect(mocks.revalidate).toHaveBeenCalled();
    }

    const withComment = { ...apiScorecard, comment: 'Giải thích rõ ràng' };
    mocks.put.mockResolvedValueOnce({ data: withComment });
    const result = await submitScorecardAction('int-1', { ...input, comment: '  Giải thích rõ ràng  ' });

    expect(mocks.put).toHaveBeenLastCalledWith('/interviews/schedules/int-1/scorecard', {
      ...input,
      comment: 'Giải thích rõ ràng',
    });
    expect(result).toMatchObject({ success: true, data: withComment });
    expect(mocks.put).toHaveBeenCalledTimes(4);
    expect(mocks.revalidate.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('shows the API Vietnamese message on a 409', async () => {
    const message = 'Đơn đã chốt, không thể sửa đánh giá';
    const error = { response: { status: 409, data: { message } } };
    mocks.put.mockRejectedValueOnce(error);

    expect(await submitScorecardAction('int-1', input)).toEqual({ success: false, message });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();

    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/sign-in;307;' });
    mocks.put.mockRejectedValueOnce(redirect);
    mocks.rethrow.mockImplementationOnce(() => { throw redirect; });
    await expect(submitScorecardAction('int-1', input)).rejects.toBe(redirect);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('getApplicationScorecardsAction reads /interview-scorecards/application/:id', async () => {
    const items = [{
      ...apiScorecard,
      interview: {
        interviewId: 'int-1',
        startAt: '2026-10-13T02:00:00.000Z',
        interviewType: 'onsite',
        status: 'completed',
      },
    }];
    mocks.get.mockResolvedValueOnce({ data: items });

    await expect(getApplicationScorecardsAction('app-1')).resolves.toEqual(items);
    expect(mocks.get).toHaveBeenCalledWith('/interview-scorecards/application/app-1');
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('read actions rethrow with the standard message', async () => {
    const error = new Error('offline');
    mocks.get.mockRejectedValueOnce(error);
    const result = getApplicationScorecardsAction('app-1');

    await expect(result).rejects.toThrow('Không thể tải dữ liệu. Vui lòng thử lại.');
    await expect(result).rejects.toMatchObject({ cause: error });
    expect(mocks.rethrow).toHaveBeenCalledWith(error);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
