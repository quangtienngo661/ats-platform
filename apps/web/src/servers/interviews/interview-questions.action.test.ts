// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import {
  createTopicQuestionAction,
  getTopicQuestionsAction,
  updateTopicQuestionAction,
} from './interview-questions.action';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: mocks }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

const input = {
  difficulty: 'medium' as const,
  questionText: 'REST là gì?',
  expectedPoints: ['Stateless'],
};

describe('interview question actions', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset().mockResolvedValue({ data: { questionId: 'q-1' } });
    mocks.patch.mockReset().mockResolvedValue({ data: { questionId: 'q-1' } });
    vi.mocked(revalidatePath).mockClear();
  });

  describe('getTopicQuestionsAction', () => {
    it('asks for the hidden questions too, in one page of up to 100', async () => {
      mocks.get.mockResolvedValue({
        data: { items: [{ questionId: 'q-1' }], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } },
      });

      const result = await getTopicQuestionsAction('topic-1');

      expect(mocks.get).toHaveBeenCalledWith('/interviews/topics/topic-1/questions', {
        params: { includeInactive: true, limit: 100 },
      });
      expect(result.items).toEqual([{ questionId: 'q-1' }]);
      expect(result.pagination.total).toBe(1);
    });

    it('a failed read throws instead of looking like an empty bank', async () => {
      mocks.get.mockRejectedValue(new Error('network'));

      await expect(getTopicQuestionsAction('topic-1')).rejects.toThrow('Không thể tải dữ liệu');
    });
  });

  describe('createTopicQuestionAction', () => {
    it('POSTs the question and refreshes the admin page', async () => {
      const result = await createTopicQuestionAction('topic-1', input);

      expect(mocks.post).toHaveBeenCalledWith('/interviews/topics/topic-1/questions', input);
      expect(result).toEqual({ success: true, message: 'Đã thêm câu hỏi' });
      expect(revalidatePath).toHaveBeenCalledWith('/interview-topic-management');
    });

    it('returns the API message on failure and does not revalidate', async () => {
      mocks.post.mockRejectedValue({ response: { status: 400, data: { message: 'Dữ liệu không hợp lệ' } } });

      await expect(createTopicQuestionAction('topic-1', input)).resolves.toEqual({
        success: false,
        message: 'Dữ liệu không hợp lệ',
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('refuses a missing topic id without calling the API', async () => {
      await expect(createTopicQuestionAction('', input)).resolves.toEqual({
        success: false,
        message: 'Thiếu ID chủ đề phỏng vấn',
      });
      expect(mocks.post).not.toHaveBeenCalled();
    });
  });

  describe('updateTopicQuestionAction', () => {
    it('PATCHes only the fields given (hiding sends just isActive)', async () => {
      const result = await updateTopicQuestionAction('q-1', { isActive: false });

      expect(mocks.patch).toHaveBeenCalledWith('/interviews/questions/q-1', { isActive: false });
      expect(result).toEqual({ success: true, message: 'Đã cập nhật câu hỏi' });
      expect(revalidatePath).toHaveBeenCalledWith('/interview-topic-management');
    });

    it('returns a Vietnamese fallback when the failure carries no message', async () => {
      mocks.patch.mockRejectedValue(new Error('network'));

      await expect(updateTopicQuestionAction('q-1', { isActive: false })).resolves.toEqual({
        success: false,
        message: 'Cập nhật câu hỏi thất bại. Vui lòng thử lại.',
      });
    });

    it('refuses a missing question id', async () => {
      await expect(updateTopicQuestionAction('', { isActive: false })).resolves.toEqual({
        success: false,
        message: 'Thiếu ID câu hỏi',
      });
      expect(mocks.patch).not.toHaveBeenCalled();
    });
  });
});
