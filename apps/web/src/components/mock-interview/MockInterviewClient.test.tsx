// Component behaviour: the three-step setup, the start button's gating, and the recent sessions.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInterviewTopic, ISessionSummary } from '@/types/interfaces/interview.interface';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));

const startAction = vi.fn();
const abandonAction = vi.fn();
vi.mock('@/servers/interviews/interviews.action', () => ({
    startInterviewSessionAction: (...args: unknown[]) => startAction(...args),
    abandonInterviewSessionAction: (...args: unknown[]) => abandonAction(...args),
}));

vi.mock('@/stores/useSocketStore', () => ({
    useSocketStore: () => ({ onEvent: vi.fn(), offEvent: vi.fn() }),
}));

import MockInterviewClient from './MockInterviewClient';

const topics: IInterviewTopic[] = [
    { topicId: 't-react', name: 'React', categoryId: 'c1', category: { name: 'Frontend Development' } as IInterviewTopic['category'] },
    { topicId: 't-sql', name: 'SQL', categoryId: 'c2', category: { name: 'Database' } as IInterviewTopic['category'] },
];

function session(over: Partial<ISessionSummary> & { sessionId: string }): ISessionSummary {
    return {
        status: 'completed',
        difficultyLevel: 'medium',
        startedAt: '2026-11-01T03:00:00.000Z',
        topic: { name: 'React', categoryId: 'c1', category: null },
        result: { overallScore: 82 },
        ...over,
    } as ISessionSummary;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('MockInterviewClient', () => {
    it('keeps the start button disabled until a topic is chosen', async () => {
        const user = userEvent.setup();
        render(<MockInterviewClient topics={topics} history={[]} />);

        const start = screen.getByRole('button', { name: /Bắt đầu phỏng vấn/ });
        expect(start).toBeDisabled();
        expect(screen.getByText('Chọn chủ đề để tiếp tục.')).toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: /React/ }));
        expect(start).toBeEnabled();
    });

    it('starts the session with the chosen topic and difficulty, then opens it', async () => {
        const user = userEvent.setup();
        startAction.mockResolvedValue({ success: true, sessionId: 's-new' });
        render(<MockInterviewClient topics={topics} history={[]} />);

        await user.click(screen.getByRole('radio', { name: /SQL/ }));
        await user.click(screen.getByRole('radio', { name: 'Dễ' }));
        await user.click(screen.getByRole('button', { name: /Bắt đầu phỏng vấn/ }));

        expect(startAction).toHaveBeenCalledWith('t-sql', 'easy');
        await waitFor(() => expect(push).toHaveBeenCalledWith('/mock-interview/s-new'));
    });

    it('shows an empty state when there are no sessions yet', () => {
        render(<MockInterviewClient topics={topics} history={[]} />);
        expect(screen.getByText('Chưa có phiên nào')).toBeInTheDocument();
    });

    it('lists recent sessions with a score and the link that fits their status', () => {
        render(
            <MockInterviewClient
                topics={topics}
                history={[
                    session({ sessionId: 's-done' }),
                    session({ sessionId: 's-live', status: 'in_progress', result: null, topic: { name: 'SQL', categoryId: 'c2', category: null } }),
                ]}
            />,
        );

        const done = screen.getByRole('link', { name: /React/ });
        expect(done).toHaveAttribute('href', '/mock-interview/s-done/result');
        expect(within(done).getByText('82')).toBeInTheDocument();
        expect(within(done).getByText('Hoàn thành')).toBeInTheDocument();

        const live = screen.getByRole('link', { name: /SQL/ });
        expect(live).toHaveAttribute('href', '/mock-interview/s-live');
        expect(within(live).getByText('Đang làm')).toBeInTheDocument();
    });
});
