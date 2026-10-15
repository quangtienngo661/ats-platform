import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { deleteInterviewTopicAction } from '@/servers/interviews/interviews.action';
import { DeleteInterviewTopicButton } from './DeleteInterviewTopicButton';

vi.mock('@/servers/interviews/interviews.action', () => ({
  deleteInterviewTopicAction: vi.fn(async () => ({ success: true, message: 'Đã xóa chủ đề' })),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const deleteTopic = vi.mocked(deleteInterviewTopicAction);

describe('DeleteInterviewTopicButton', () => {
  it('asks in the shared confirm dialog and deletes nothing when cancelled', async () => {
    const user = userEvent.setup();
    render(<DeleteInterviewTopicButton topicId="topic-1" />);

    await user.click(screen.getByRole('button', { name: 'Xóa chủ đề phỏng vấn' }));
    const dialog = screen.getByRole('dialog', { name: 'Xóa chủ đề phỏng vấn' });
    await user.click(within(dialog).getByRole('button', { name: 'Hủy' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteTopic).not.toHaveBeenCalled();
  });

  it('deletes the topic once the dialog is confirmed', async () => {
    const user = userEvent.setup();
    render(<DeleteInterviewTopicButton topicId="topic-1" />);

    await user.click(screen.getByRole('button', { name: 'Xóa chủ đề phỏng vấn' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xóa' }));

    await waitFor(() => expect(deleteTopic).toHaveBeenCalledTimes(1));
    const formData = deleteTopic.mock.calls[0][1] as FormData;
    expect(formData.get('topicId')).toBe('topic-1');
  });
});
