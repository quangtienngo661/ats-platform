import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { InterviewTopicRow } from './InterviewTopicRow';

vi.mock('./DeleteInterviewTopicButton', () => ({
  DeleteInterviewTopicButton: () => <button type="button">Xóa chủ đề</button>,
}));

const topic: IInterviewTopic = {
  topicId: 'topic-1',
  name: 'Node.js & NestJS',
  _count: { sessions: 2 },
};

describe('InterviewTopicRow', () => {
  it('has a "Câu hỏi" button that opens the questions of this topic', async () => {
    const onQuestions = vi.fn();
    render(<InterviewTopicRow topic={topic} onEdit={vi.fn()} onQuestions={onQuestions} />);

    await userEvent.click(screen.getByRole('button', { name: 'Câu hỏi' }));

    expect(onQuestions).toHaveBeenCalledWith(topic);
    // Control: the row's other actions are still there.
    expect(screen.getByRole('button', { name: 'Chỉnh sửa' })).toBeVisible();
  });
});
