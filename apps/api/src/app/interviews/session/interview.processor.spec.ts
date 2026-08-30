import { InterviewProcessor } from './interview.processor';
import { InterviewStatus } from '@ats-platform/database';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('InterviewProcessor', () => {
    let processor: InterviewProcessor;
    let prisma: ReturnType<typeof createPrismaMock>;
    let geminiService: { evaluateInterviewAnswer: jest.Mock };
    let interviewSessionService: { finalizeSession: jest.Mock };

    const baseQna = {
        qnaId: 'qna-1',
        sessionId: 'session-1',
        questionText: 'Q',
        expectedPoints: ['p'],
        answerText: 'A',
        followupQuestion: null,
        followupAnswer: null,
    };

    const buildJob = (attemptsMade: number, attempts = 3) =>
        ({
            name: 'evaluate_qna',
            data: { qnaId: 'qna-1' },
            attemptsMade,
            opts: { attempts },
        } as any);

    beforeEach(() => {
        prisma = createPrismaMock();
        geminiService = { evaluateInterviewAnswer: jest.fn() };
        interviewSessionService = { finalizeSession: jest.fn() };
        processor = new InterviewProcessor(
            prisma as any,
            geminiService as any,
            interviewSessionService as any,
        );
    });

    it('evaluates the answer and finalizes the session on success', async () => {
        prisma.interviewQnA.findUnique.mockResolvedValue(baseQna);
        geminiService.evaluateInterviewAnswer.mockResolvedValue({
            score: 80,
            feedback: 'Good',
            coveredPoints: ['p'],
            missedPoints: [],
        });
        prisma.interviewSession.findUnique.mockResolvedValue({
            status: InterviewStatus.pending_result,
        });
        prisma.interviewQnA.count.mockResolvedValue(0);

        await processor.process(buildJob(0));

        expect(prisma.interviewQnA.update).toHaveBeenCalledWith({
            where: { qnaId: 'qna-1' },
            data: expect.objectContaining({ correctnessScore: 80, feedback: 'Good' }),
        });
        expect(interviewSessionService.finalizeSession).toHaveBeenCalledWith('session-1');
    });

    it('rethrows without recording [ERROR] or finalizing when attempts remain', async () => {
        prisma.interviewQnA.findUnique.mockResolvedValue(baseQna);
        geminiService.evaluateInterviewAnswer.mockRejectedValue(new Error('Gemini timeout'));

        await expect(processor.process(buildJob(0, 3))).rejects.toThrow('Gemini timeout');

        expect(prisma.interviewQnA.update).not.toHaveBeenCalled();
        expect(interviewSessionService.finalizeSession).not.toHaveBeenCalled();
    });

    it('records [ERROR] feedback, finalizes, and still rethrows on the final attempt', async () => {
        prisma.interviewQnA.findUnique
            .mockResolvedValueOnce(baseQna) // fetch inside try
            .mockResolvedValueOnce({ sessionId: 'session-1' }); // re-fetch inside catch
        geminiService.evaluateInterviewAnswer.mockRejectedValue(new Error('Gemini down'));
        prisma.interviewSession.findUnique.mockResolvedValue({
            status: InterviewStatus.pending_result,
        });
        prisma.interviewQnA.count.mockResolvedValue(0);

        await expect(processor.process(buildJob(2, 3))).rejects.toThrow('Gemini down');

        expect(prisma.interviewQnA.update).toHaveBeenCalledWith({
            where: { qnaId: 'qna-1' },
            data: { feedback: expect.stringContaining('[ERROR]') },
        });
        expect(interviewSessionService.finalizeSession).toHaveBeenCalledWith('session-1');
    });
});
