import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInterviewQuestion } from '@/types/interfaces/interview-question.interface';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { TopicQuestionsPanel } from './TopicQuestionsPanel';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/servers/interviews/interview-questions.action', () => ({
  getTopicQuestionsAction: mocks.get,
  createTopicQuestionAction: mocks.create,
  updateTopicQuestionAction: mocks.update,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: mocks.success, error: mocks.error } }));

const topic: IInterviewTopic = { topicId: 'topic-1', name: 'Node.js & NestJS' };

const question = (id: string, difficulty: IInterviewQuestion['difficulty'], isActive = true): IInterviewQuestion => ({
  questionId: id,
  topicId: 'topic-1',
  difficulty,
  questionText: `Câu hỏi ${id}`,
  expectedPoints: [`Ý của ${id}`],
  isActive,
  createdAt: '2026-10-30T00:00:00.000Z',
  updatedAt: '2026-10-30T00:00:00.000Z',
});

const page = (items: IInterviewQuestion[], total = items.length) => ({
  items,
  pagination: { page: 1, limit: 100, total, totalPages: 1 },
});

async function open(items: IInterviewQuestion[], total?: number) {
  mocks.get.mockResolvedValue(page(items, total));
  render(<TopicQuestionsPanel topic={topic} onClose={vi.fn()} />);
  const dialog = await screen.findByRole('dialog', { name: 'Câu hỏi: Node.js & NestJS' });
  await waitFor(() => expect(within(dialog).queryByText('Đang tải câu hỏi…')).not.toBeInTheDocument());
  return dialog;
}

describe('TopicQuestionsPanel (C13)', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.create.mockReset().mockResolvedValue({ success: true, message: 'Đã thêm câu hỏi' });
    mocks.update.mockReset().mockResolvedValue({ success: true, message: 'Đã cập nhật câu hỏi' });
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it('admin opens the panel of a topic and sees its questions grouped by difficulty', async () => {
    const dialog = await open([
      question('hard-1', 'hard'),
      question('easy-1', 'easy'),
      question('easy-2', 'easy'),
      question('medium-1', 'medium'),
    ]);

    const group = (name: string) => within(dialog).getByRole('region', { name });
    expect(within(group('Dễ')).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Câu hỏi easy-1'),
      expect.stringContaining('Câu hỏi easy-2'),
    ]);
    expect(within(group('Trung bình')).getAllByRole('listitem')).toHaveLength(1);
    expect(within(group('Khó')).getByText('Câu hỏi hard-1')).toBeVisible();
    // The expected points of a question are part of what the admin maintains.
    expect(within(group('Dễ')).getByText('Ý của easy-1')).toBeVisible();
    expect(mocks.get).toHaveBeenCalledWith('topic-1');
  });

  it('says so when a difficulty has no question yet', async () => {
    const dialog = await open([question('easy-1', 'easy')]);

    expect(within(within(dialog).getByRole('region', { name: 'Khó' })).getByText('Chưa có câu hỏi')).toBeVisible();
  });

  it('adding a question with empty expected points shows "Cần ít nhất một ý mong đợi" and sends nothing', async () => {
    const dialog = await open([]);

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Câu hỏi' }), 'REST là gì?');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Ý mong đợi/ }), '  \n  ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Thêm câu hỏi' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Cần ít nhất một ý mong đợi');
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('an empty question text is refused too', async () => {
    const dialog = await open([]);

    await userEvent.type(within(dialog).getByRole('textbox', { name: /Ý mong đợi/ }), 'Stateless');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Thêm câu hỏi' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vui lòng nhập nội dung câu hỏi');
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('a valid question is sent with one point per non-blank line, then shows in its difficulty group', async () => {
    const dialog = await open([]);

    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Độ khó' }), 'Khó');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Câu hỏi' }), '  REST là gì?  ');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Ý mong đợi/ }), 'Stateless{enter}{enter}  Cacheable  ');
    mocks.get.mockResolvedValue(page([{ ...question('new', 'hard'), questionText: 'REST là gì?' }]));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Thêm câu hỏi' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create).toHaveBeenCalledWith('topic-1', {
      difficulty: 'hard',
      questionText: 'REST là gì?',
      expectedPoints: ['Stateless', 'Cacheable'],
    });
    expect(mocks.success).toHaveBeenCalled();
    expect(await within(within(dialog).getByRole('region', { name: 'Khó' })).findByText('REST là gì?')).toBeVisible();
    // The form is cleared for the next question.
    expect(within(dialog).getByRole('textbox', { name: 'Câu hỏi' })).toHaveValue('');
  });

  it('a server refusal is shown in the panel and the typed text is kept', async () => {
    mocks.create.mockResolvedValue({ success: false, message: 'Dữ liệu không hợp lệ' });
    const dialog = await open([]);

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Câu hỏi' }), 'REST là gì?');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Ý mong đợi/ }), 'Stateless');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Thêm câu hỏi' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Dữ liệu không hợp lệ');
    expect(within(dialog).getByRole('textbox', { name: 'Câu hỏi' })).toHaveValue('REST là gì?');
  });

  it('hiding a question removes it from the active list and shows it under "Đã ẩn"', async () => {
    const dialog = await open([question('easy-1', 'easy'), question('easy-2', 'easy')]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Ẩn câu hỏi: Câu hỏi easy-1' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('easy-1', { isActive: false }));
    const easy = within(dialog).getByRole('region', { name: 'Dễ' });
    await waitFor(() => expect(within(easy).queryByText('Câu hỏi easy-1')).not.toBeInTheDocument());
    expect(within(easy).getByText('Câu hỏi easy-2')).toBeVisible();
    const hidden = within(dialog).getByRole('region', { name: 'Đã ẩn' });
    expect(within(hidden).getByText('Câu hỏi easy-1')).toBeVisible();
  });

  it('a hidden question can be shown again', async () => {
    const dialog = await open([question('easy-1', 'easy', false)]);
    const hidden = within(dialog).getByRole('region', { name: 'Đã ẩn' });

    await userEvent.click(within(hidden).getByRole('button', { name: 'Hiện lại câu hỏi: Câu hỏi easy-1' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('easy-1', { isActive: true }));
    expect(await within(within(dialog).getByRole('region', { name: 'Dễ' })).findByText('Câu hỏi easy-1')).toBeVisible();
    expect(within(dialog).queryByRole('region', { name: 'Đã ẩn' })).not.toBeInTheDocument();
  });

  it('a failed hide leaves the question where it was and says why', async () => {
    mocks.update.mockResolvedValue({ success: false, message: 'Không tìm thấy câu hỏi phỏng vấn' });
    const dialog = await open([question('easy-1', 'easy')]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Ẩn câu hỏi: Câu hỏi easy-1' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không tìm thấy câu hỏi phỏng vấn');
    expect(within(within(dialog).getByRole('region', { name: 'Dễ' })).getByText('Câu hỏi easy-1')).toBeVisible();
  });

  it('editing a question loads it into the form and sends only what changed', async () => {
    const dialog = await open([question('easy-1', 'easy')]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Sửa câu hỏi: Câu hỏi easy-1' }));
    const text = within(dialog).getByRole('textbox', { name: 'Câu hỏi' });
    expect(text).toHaveValue('Câu hỏi easy-1');
    await userEvent.clear(text);
    await userEvent.type(text, 'Câu hỏi đã sửa');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update).toHaveBeenCalledWith('easy-1', { questionText: 'Câu hỏi đã sửa' });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('a failed load is shown instead of an empty bank', async () => {
    mocks.get.mockRejectedValue(new Error('Không thể tải dữ liệu'));
    render(<TopicQuestionsPanel topic={topic} onClose={vi.fn()} />);

    const dialog = await screen.findByRole('dialog', { name: 'Câu hỏi: Node.js & NestJS' });

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không thể tải câu hỏi. Vui lòng thử lại.');
    expect(within(dialog).queryByRole('region', { name: 'Dễ' })).not.toBeInTheDocument();
  });

  it('says when only the first part of a long bank is shown', async () => {
    const dialog = await open([question('easy-1', 'easy')], 250);

    expect(within(dialog).getByText('Đang hiển thị 1 trên 250 câu hỏi')).toBeVisible();
  });
});
