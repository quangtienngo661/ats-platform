import { InterviewGenerationProcessor } from './interview-generation.processor';
import { InterviewStatus } from '@ats-platform/database';
import { createPrismaMock, createPrismaTransactionMock, createSocketMock } from '../../../test-utils/unit-test-helpers';

describe('InterviewGenerationProcessor', () => {
    let processor: InterviewGenerationProcessor;
    let prisma: ReturnType<typeof createPrismaMock>;
    let geminiService: { generateInterviewQuestions: jest.Mock };
    let socketIoService: ReturnType<typeof createSocketMock>;

    const tenQuestions = Array.from({ length: 10 }, (_, index) => ({
        difficulty: 'medium',
        questionText: `Question ${index + 1}`,
        expectedPoints: ['point'],
    }));

    const jobData = {
        sessionId: 'session-1',
        candidateId: 'cand-1',
        topicName: 'Backend',
        categoryName: 'IT',
        difficultyLevel: 'medium',
        candidateContext: null,
    };

    const buildJob = (attemptsMade: number, attempts = 3) =>
        ({
            name: 'generate_questions',
            data: jobData,
            attemptsMade,
            opts: { attempts },
        } as any);

    beforeEach(() => {
        prisma = createPrismaMock();
        geminiService = { generateInterviewQuestions: jest.fn() };
        socketIoService = createSocketMock();
        processor = new InterviewGenerationProcessor(
            prisma as any,
            geminiService as any,
            socketIoService as any,
        );
    });

    it('generates questions, flips status to in_progress, and emits session_ready on success', async () => {
        const tx = createPrismaTransactionMock();
        geminiService.generateInterviewQuestions.mockResolvedValue(tenQuestions);
        prisma.$transaction.mockImplementation((callback: any) => callback(tx));

        await processor.process(buildJob(0));

        expect(tx.interviewQnA.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ sessionId: 'session-1', orderIndex: 1, questionText: 'Question 1' }),
            ]),
        });
        expect(tx.interviewSession.update).toHaveBeenCalledWith({
            where: { sessionId: 'session-1' },
            data: { status: InterviewStatus.in_progress },
        });
        expect(socketIoService.handleEmit).toHaveBeenCalledWith(
            'interview:session_ready',
            { sessionId: 'session-1' },
            'interview_session-1',
        );
    });

    it('rethrows without touching session state when attempts remain', async () => {
        geminiService.generateInterviewQuestions.mockRejectedValue(new Error('Gemini timeout'));

        await expect(processor.process(buildJob(0, 3))).rejects.toThrow('Gemini timeout');

        expect(prisma.interviewSession.update).not.toHaveBeenCalled();
        expect(socketIoService.handleEmit).not.toHaveBeenCalled();
    });

    it('marks the session abandoned, emits session_failed, and still rethrows on the final attempt', async () => {
        geminiService.generateInterviewQuestions.mockRejectedValue(new Error('Gemini down'));
        prisma.interviewSession.update.mockResolvedValue({ sessionId: 'session-1', status: InterviewStatus.abandon });

        await expect(processor.process(buildJob(2, 3))).rejects.toThrow('Gemini down');

        expect(prisma.interviewSession.update).toHaveBeenCalledWith({
            where: { sessionId: 'session-1' },
            data: { status: InterviewStatus.abandon },
        });
        expect(socketIoService.handleEmit).toHaveBeenCalledWith(
            'interview:session_failed',
            expect.objectContaining({ sessionId: 'session-1' }),
            'interview_session-1',
        );
    });

    it('treats fewer than 10 AI questions as a failure, following the same retry rules', async () => {
        geminiService.generateInterviewQuestions.mockResolvedValue(tenQuestions.slice(0, 3));

        await expect(processor.process(buildJob(0, 3))).rejects.toThrow('10');
        expect(prisma.interviewSession.update).not.toHaveBeenCalled();
    });
});
