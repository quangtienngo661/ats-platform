// Client-side states of the topic table; the actions themselves are mocked.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { deleteInterviewTopicAction } from '@/servers/interviews/interviews.action';
import InterviewTopicClient from './InterviewTopicClient';

vi.mock('@/servers/interviews/interviews.action', () => ({
  createInterviewTopicAction: vi.fn(),
  updateInterviewTopicAction: vi.fn(),
  deleteInterviewTopicAction: vi.fn(async () => ({ success: true, message: 'Đã xóa chủ đề' })),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const topics = [
  { topicId: 'topic-aaaa-1111', name: 'React nâng cao', categoryId: 'cat-it', category: { categoryId: 'cat-it', name: 'Công nghệ' }, _count: { sessions: 0 } },
  { topicId: 'topic-bbbb-2222', name: 'Java Core', categoryId: 'cat-it', category: { categoryId: 'cat-it', name: 'Công nghệ' }, _count: { sessions: 3 } },
] as unknown as IInterviewTopic[];
const jobCategories = [
  { categoryId: 'cat-it', name: 'Công nghệ' },
  { categoryId: 'cat-hr', name: 'Nhân sự' },
] as never[];

type User = ReturnType<typeof userEvent.setup>;

async function openRowMenu(user: User, name: string) {
  const row = screen.getByRole('row', { name: new RegExp(name) });
  within(row).getByRole('button', { name: 'Tùy chọn' }).focus();
  await user.keyboard('{Enter}');
  return row;
}

async function chooseFromRowMenu(user: User, name: string, item: string) {
  const row = await openRowMenu(user, name);
  const target = await screen.findByRole('menuitem', { name: item });
  for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
  expect(target).toHaveFocus();
  await user.keyboard('{Enter}');
  return row;
}

describe('InterviewTopicClient — empty and no-match states', () => {
  it('says there are no topics yet, with an add action that does not repeat the toolbar button', () => {
    render(<InterviewTopicClient topics={[]} jobCategories={jobCategories} />);
    expect(screen.getByRole('heading', { name: 'Chưa có chủ đề' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thêm chủ đề đầu tiên' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm chủ đề' })).toHaveLength(1);
  });

  it('offers "Xóa tìm kiếm" for a search that finds nothing and focuses the search field after clearing', async () => {
    const user = userEvent.setup();
    render(<InterviewTopicClient topics={topics} jobCategories={jobCategories} />);
    await user.type(screen.getByRole('searchbox', { name: 'Tìm chủ đề phỏng vấn' }), 'không có');

    expect(await screen.findByRole('heading', { name: 'Không có chủ đề khớp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));

    expect(screen.getByRole('searchbox', { name: 'Tìm chủ đề phỏng vấn' })).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: 'Tìm chủ đề phỏng vấn' })).toHaveFocus();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('offers "Xóa bộ lọc" when the category filter is set, and resets it', async () => {
    const user = userEvent.setup();
    render(<InterviewTopicClient topics={topics} jobCategories={jobCategories} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc danh mục chủ đề' }), 'cat-hr');

    expect(await screen.findByRole('heading', { name: 'Không có chủ đề khớp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

    expect(screen.getByRole('combobox', { name: 'Lọc danh mục chủ đề' })).toHaveValue('');
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});

describe('InterviewTopicClient — row menu', () => {
  it('opens the edit dialog for that topic', async () => {
    const user = userEvent.setup();
    render(<InterviewTopicClient topics={topics} jobCategories={jobCategories} />);

    await chooseFromRowMenu(user, 'React nâng cao', 'Chỉnh sửa');

    const dialog = await screen.findByRole('dialog', { name: 'Chỉnh sửa chủ đề' });
    expect(within(dialog).getByRole('textbox', { name: 'Tên chủ đề' })).toHaveValue('React nâng cao');
  });

  it('confirms in the shared dialog, then deletes only that topic', async () => {
    const user = userEvent.setup();
    render(<InterviewTopicClient topics={topics} jobCategories={jobCategories} />);

    await chooseFromRowMenu(user, 'React nâng cao', 'Xóa');

    const dialog = await screen.findByRole('dialog', { name: 'Xóa chủ đề phỏng vấn' });
    expect(deleteInterviewTopicAction).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Xóa' }));

    await waitFor(() => expect(deleteInterviewTopicAction).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(deleteInterviewTopicAction).mock.calls[0][1] as FormData;
    expect(formData.get('topicId')).toBe('topic-aaaa-1111');
  });

  it('cannot delete a topic that already has interview sessions', async () => {
    const user = userEvent.setup();
    render(<InterviewTopicClient topics={topics} jobCategories={jobCategories} />);

    await openRowMenu(user, 'Java Core');

    const item = await screen.findByRole('menuitem', { name: 'Xóa' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    const reason = screen.getByText('Không thể xóa chủ đề đã có phiên phỏng vấn');
    expect(reason).toBeVisible();
    expect(item).toHaveAccessibleDescription('Không thể xóa chủ đề đã có phiên phỏng vấn');
    expect(reason.id).not.toBe('');
  });
});
