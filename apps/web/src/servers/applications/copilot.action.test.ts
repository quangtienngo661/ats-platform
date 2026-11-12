// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  applyCopilotSuggestionAction,
  dismissCopilotSuggestionAction,
  explainCopilotSuggestionAction,
  getCopilotSuggestionsAction,
} from './copilot.action';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const refused = (status: number, message: string) => ({ response: { status, data: { message } } });

describe('co-pilot actions', () => {
  it('reads the suggestions of one job', async () => {
    mocks.get.mockResolvedValue({ data: { 'app-1': { ruleId: 'invite_interview' } } });

    await expect(getCopilotSuggestionsAction('job-1')).resolves.toEqual({ 'app-1': { ruleId: 'invite_interview' } });
    expect(mocks.get).toHaveBeenCalledWith('/applications/job/job-1/copilot');
  });

  it('shows no suggestions rather than an error page when they cannot be read', async () => {
    mocks.get.mockRejectedValue(refused(403, 'x'));

    await expect(getCopilotSuggestionsAction('job-1')).resolves.toEqual({});
  });

  it('applies with the key and returns the refreshed application', async () => {
    mocks.post.mockResolvedValue({ data: { applied: 'invite_interview', application: { applicationId: 'app-1' } } });

    await expect(applyCopilotSuggestionAction('app-1', 'k1')).resolves.toEqual({
      ok: true,
      data: { application: { applicationId: 'app-1' } },
    });
    expect(mocks.post).toHaveBeenCalledWith('/applications/app-1/copilot/apply', { key: 'k1' });
  });

  it('passes a 409 message through', async () => {
    mocks.post.mockRejectedValue(refused(409, 'Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.'));

    await expect(applyCopilotSuggestionAction('app-1', 'k1')).resolves.toEqual({
      ok: false,
      message: 'Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.',
    });
  });

  it('dismisses with the key', async () => {
    mocks.post.mockResolvedValue({ data: { dismissed: 'invite_interview' } });

    await expect(dismissCopilotSuggestionAction('app-1', 'k1')).resolves.toEqual({ ok: true, data: null });
    expect(mocks.post).toHaveBeenCalledWith('/applications/app-1/copilot/dismiss', { key: 'k1' });
  });

  it('returns the explanation, or the 503 message', async () => {
    mocks.post.mockResolvedValueOnce({ data: { explanation: 'Điểm 78 cao hơn ngưỡng 60.' } });
    await expect(explainCopilotSuggestionAction('app-1')).resolves.toEqual({
      ok: true,
      data: { explanation: 'Điểm 78 cao hơn ngưỡng 60.' },
    });
    expect(mocks.post).toHaveBeenLastCalledWith('/applications/app-1/copilot/explain');

    mocks.post.mockRejectedValueOnce(refused(503, 'Chưa tạo được giải thích, hãy dùng các lý do bên dưới.'));
    await expect(explainCopilotSuggestionAction('app-1')).resolves.toEqual({
      ok: false,
      message: 'Chưa tạo được giải thích, hãy dùng các lý do bên dưới.',
    });
  });
});
