import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { deleteInterviewTopicAction } from '@/servers/interviews/interviews.action';
import { InterviewTopicRow } from './InterviewTopicRow';

vi.mock('@/servers/interviews/interviews.action', () => ({
  deleteInterviewTopicAction: vi.fn(async () => ({ success: true, message: 'Đã xóa chủ đề' })),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const deleteTopic = vi.mocked(deleteInterviewTopicAction);
const topic = { topicId: 'topic-1', name: 'React', _count: { sessions: 0 } } as unknown as IInterviewTopic;

/** Opens the shared confirm dialog from the row menu, the way the shipped table does. */
async function openConfirm(user: ReturnType<typeof userEvent.setup>) {
  render(<table><tbody><InterviewTopicRow topic={topic} onEdit={vi.fn()} /></tbody></table>);
  screen.getByRole('button', { name: 'Tùy chọn' }).focus();
  await user.keyboard('{Enter}');
  await user.click(await screen.findByRole('menuitem', { name: 'Xóa' }));
  return screen.findByRole('dialog', { name: 'Xóa chủ đề phỏng vấn' });
}

describe('delete topic confirm dialog (row menu)', () => {
  it('deletes nothing when cancelled, and focus returns to the row menu', async () => {
    const user = userEvent.setup();
    const dialog = await openConfirm(user);
    await user.click(within(dialog).getByRole('button', { name: 'Hủy' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteTopic).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tùy chọn' })).toHaveFocus());
  });

  it('deletes the topic once the dialog is confirmed', async () => {
    const user = userEvent.setup();
    const dialog = await openConfirm(user);
    await user.click(within(dialog).getByRole('button', { name: 'Xóa' }));

    await waitFor(() => expect(deleteTopic).toHaveBeenCalledTimes(1));
    const formData = deleteTopic.mock.calls[0][1] as FormData;
    expect(formData.get('topicId')).toBe('topic-1');
  });
});
