// Component behaviour: the result report shows the real scores, the plan as steps, and each Q&A as a disclosure.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInterviewQnA, IInterviewResult } from '@/types/interfaces/interview.interface';
import InterviewResultClient from './InterviewResultClient';

function qna(over: Partial<IInterviewQnA> & { qnaId: string; orderIndex: number }): IInterviewQnA {
    return {
        difficulty: 'medium',
        questionText: 'Câu hỏi',
        expectedPoints: null,
        answerText: null,
        correctnessScore: null,
        feedback: null,
        coveredPoints: null,
        missedPoints: null,
        hasFollowup: false,
        followupQuestion: null,
        followupAnswer: null,
        followupReason: null,
        ...over,
    };
}

// overallScore is the server's difficulty-weighted figure, deliberately not the mean of the question scores (65).
const result: IInterviewResult = {
    resultId: 'r-1',
    sessionId: 's-1',
    overallScore: 68,
    strengths: ['Nắm vững vòng đời component.'],
    weaknesses: ['Chưa giải thích được khi nào nên memo hóa.'],
    actionPlan: [
        '1. Ôn lại cơ chế reconciliation của React.',
        '2. Luyện viết custom hook có cleanup đúng cách.',
        '3. Đọc tài liệu về Server Components.',
    ].join('\n'),
    generatedAt: '2026-11-10T03:00:00.000Z',
    session: {
        sessionId: 's-1',
        candidateId: 'c-1',
        topicId: 't-1',
        difficultyLevel: 'medium',
        status: 'completed',
        startedAt: '2026-11-10T02:30:00.000Z',
        topic: { topicId: 't-1', name: 'React', categoryId: null, category: null },
        qnas: [
            qna({
                qnaId: 'q-1',
                orderIndex: 1,
                questionText: 'useEffect chạy khi nào?',
                answerText: 'Sau khi trình duyệt vẽ xong.',
                correctnessScore: 90,
                feedback: 'Trả lời đúng thời điểm chạy, thiếu phần cleanup.',
            }),
            qna({
                qnaId: 'q-2',
                orderIndex: 2,
                questionText: 'Khi nào nên dùng useMemo?',
                answerText: 'Luôn luôn.',
                correctnessScore: 40,
                feedback: 'Chưa nêu chi phí của memo hóa.',
            }),
        ],
    },
};

beforeEach(() => {
    // Stat reads the motion preference on a client mount; reduced motion shows the final figure at once.
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }));
});

describe('InterviewResultClient', () => {
    it('shows the overall score from the result, not an average of the questions', () => {
        render(<InterviewResultClient result={result} />);

        const meter = screen.getByRole('meter', { name: 'Điểm tổng' });
        expect(meter).toHaveAttribute('aria-valuenow', '68');
    });

    it('gives every question its own score bar', () => {
        render(<InterviewResultClient result={result} />);

        expect(screen.getByRole('meter', { name: 'Câu 1' })).toHaveAttribute('aria-valuenow', '90');
        expect(screen.getByRole('meter', { name: 'Câu 2' })).toHaveAttribute('aria-valuenow', '40');
    });

    it('lists the action plan as numbered steps in their original order', () => {
        render(<InterviewResultClient result={result} />);

        const plan = screen.getByRole('list', { name: 'Kế hoạch cải thiện' });
        expect(within(plan).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
            'Ôn lại cơ chế reconciliation của React.',
            'Luyện viết custom hook có cleanup đúng cách.',
            'Đọc tài liệu về Server Components.',
        ]);
    });

    it('shows a prose plan as one paragraph, never cut at an abbreviation', () => {
        const prose = 'Học thêm về hệ thống phân tán. Chuyển tới TP. Hồ Chí Minh để thực tập.';
        render(<InterviewResultClient result={{ ...result, actionPlan: prose }} />);

        expect(screen.getByText(prose)).toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Kế hoạch cải thiện' })).not.toBeInTheDocument();
    });

    it('opens a question to reveal the answer and the AI feedback, and closes it again', async () => {
        const user = userEvent.setup();
        render(<InterviewResultClient result={result} />);

        const question = screen.getByRole('button', { name: /useEffect chạy khi nào\?/ });
        expect(question).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Trả lời đúng thời điểm chạy, thiếu phần cleanup.')).not.toBeInTheDocument();

        await user.click(question);

        expect(question).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Sau khi trình duyệt vẽ xong.')).toBeVisible();
        expect(screen.getByText('Trả lời đúng thời điểm chạy, thiếu phần cleanup.')).toBeVisible();
        // Only the question that was opened shows its feedback.
        expect(screen.queryByText('Chưa nêu chi phí của memo hóa.')).not.toBeInTheDocument();

        await user.click(question);

        expect(question).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Trả lời đúng thời điểm chạy, thiếu phần cleanup.')).not.toBeInTheDocument();
    });

    it('offers a new session from the report', () => {
        render(<InterviewResultClient result={result} />);

        expect(screen.getByRole('link', { name: 'Làm phiên mới' })).toHaveAttribute('href', '/mock-interview');
    });

    // The API serialises Prisma Decimal columns as strings ("72"); Task 33 saw every bar read "Chưa có điểm".
    it('reads the overall and question scores the API sends as decimal strings', () => {
        const fromApi = {
            ...result,
            overallScore: '68',
            session: {
                ...result.session,
                qnas: (result.session?.qnas ?? []).map((q) => ({ ...q, correctnessScore: String(q.correctnessScore) })),
            },
        } as unknown as IInterviewResult;
        render(<InterviewResultClient result={fromApi} />);

        expect(screen.getByRole('meter', { name: 'Điểm tổng' })).toHaveAttribute('aria-valuenow', '68');
        expect(screen.getByRole('meter', { name: 'Câu 1' })).toHaveAttribute('aria-valuenow', '90');
        expect(screen.getByRole('meter', { name: 'Câu 2' })).toHaveAttribute('aria-valuenow', '40');
        expect(screen.queryByText('Chưa có điểm')).toBeNull();
    });

    // A zero is a real score (every answer wrong); only a missing or unreadable value means "not scored".
    function withQuestionScore(score: unknown): IInterviewResult {
        const only = qna({ qnaId: 'q-1', orderIndex: 1, questionText: 'useEffect chạy khi nào?', answerText: 'Không biết.' });
        return {
            ...result,
            session: { ...result.session!, qnas: [{ ...only, correctnessScore: score }] },
        } as unknown as IInterviewResult;
    }

    it('shows a question score of "0" as a bar at 0, not as unscored', () => {
        render(<InterviewResultClient result={withQuestionScore('0')} />);

        expect(screen.getByRole('meter', { name: 'Câu 1' })).toHaveAttribute('aria-valuenow', '0');
        expect(screen.queryByText('Chưa có điểm')).toBeNull();
    });

    it('shows an overall score of "0" as a bar at 0', () => {
        render(<InterviewResultClient result={{ ...result, overallScore: '0' } as unknown as IInterviewResult} />);

        expect(screen.getByRole('meter', { name: 'Điểm tổng' })).toHaveAttribute('aria-valuenow', '0');
        expect(screen.queryByText('Chưa có điểm')).toBeNull();
    });

    it.each([
        ['an empty string', ''],
        ['null', null],
        ['text that is not a number', 'abc'],
    ])('shows a question score of %s as unscored', (_name, score) => {
        render(<InterviewResultClient result={withQuestionScore(score)} />);

        expect(screen.queryByRole('meter', { name: 'Câu 1' })).toBeNull();
        expect(screen.getByText('Chưa có điểm')).toBeInTheDocument();
    });
});
