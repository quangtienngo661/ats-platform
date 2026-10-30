import { InterviewGenerationProcessor } from './interview-generation.processor';
import { InterviewStatus } from '@ats-platform/database';
import { createPrismaMock, createPrismaTransactionMock, createSocketMock } from '../../../test-utils/unit-test-helpers';

describe('InterviewGenerationProcessor', () => {
    let processor: InterviewGenerationProcessor;
    let prisma: ReturnType<typeof createPrismaMock>;
    let llmService: { generateInterviewQuestions: jest.Mock };
    let socketIoService: ReturnType<typeof createSocketMock>;
    let embeddingService: { embed: jest.Mock };
    let vectorSearch: { nearestQuestions: jest.Mock };

    const tenQuestions = Array.from({ length: 10 }, (_, index) => ({
        difficulty: 'medium',
        questionText: `Question ${index + 1}`,
        expectedPoints: ['point'],
    }));

    const jobData = {
        sessionId: 'session-1',
        candidateId: 'cand-1',
        topicId: 'topic-1',
        topicName: 'Backend',
        categoryName: 'IT',
        difficultyLevel: 'medium',
        candidateContext: null as string | null,
    };

    const buildJob = (attemptsMade: number, attempts = 3, data: Partial<typeof jobData> = {}) =>
        ({
            name: 'generate_questions',
            data: { ...jobData, ...data },
            attemptsMade,
            opts: { attempts },
        } as any);

    beforeEach(() => {
        prisma = createPrismaMock();
        llmService = { generateInterviewQuestions: jest.fn() };
        socketIoService = createSocketMock();
        embeddingService = { embed: jest.fn().mockResolvedValue([[1, 0, 0]]) };
        vectorSearch = { nearestQuestions: jest.fn().mockResolvedValue([]) };
        processor = new InterviewGenerationProcessor(
            prisma as any,
            llmService as any,
            socketIoService as any,
            embeddingService as any,
            vectorSearch as any,
        );
    });

    it('generates questions, flips status to in_progress, and emits session_ready on success', async () => {
        const tx = createPrismaTransactionMock();
        llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);
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
        llmService.generateInterviewQuestions.mockRejectedValue(new Error('Gemini timeout'));

        await expect(processor.process(buildJob(0, 3))).rejects.toThrow('Gemini timeout');

        expect(prisma.interviewSession.update).not.toHaveBeenCalled();
        expect(socketIoService.handleEmit).not.toHaveBeenCalled();
    });

    it('marks the session abandoned, emits session_failed, and still rethrows on the final attempt', async () => {
        llmService.generateInterviewQuestions.mockRejectedValue(new Error('Gemini down'));
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
        llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions.slice(0, 3));

        await expect(processor.process(buildJob(0, 3))).rejects.toThrow('10');
        expect(prisma.interviewSession.update).not.toHaveBeenCalled();
    });

    describe('question bank (R14, R15, C11, E6, C12)', () => {
        const bankQuestion = (n: number) => ({
            questionId: `bank-${n}`,
            questionText: `Bank question ${n}`,
            expectedPoints: [`bank point ${n}`],
            difficulty: 'medium',
        });
        const bankOf = (count: number) => Array.from({ length: count }, (_, i) => bankQuestion(i + 1));
        /** The model answers with the first `usedBank` bank ids, then fresh questions up to 10. */
        const modelAnswer = (usedBank: number) =>
            Array.from({ length: 10 }, (_, i) =>
                i < usedBank
                    ? { bankQuestionId: `bank-${i + 1}`, questionText: `Rewritten ${i + 1}`, expectedPoints: ['model'], difficulty: 'medium' }
                    : { questionText: `Fresh ${i + 1}`, expectedPoints: ['fresh point'], difficulty: 'easy' },
            );
        const savedQnas = (tx: ReturnType<typeof createPrismaTransactionMock>) =>
            tx.interviewQnA.createMany.mock.calls[0][0].data;
        const promptSent = () => JSON.parse(llmService.generateInterviewQuestions.mock.calls[0][1]);
        let tx: ReturnType<typeof createPrismaTransactionMock>;

        beforeEach(() => {
            tx = createPrismaTransactionMock();
            prisma.$transaction.mockImplementation((callback: any) => callback(tx));
        });

        it('searches the topic and difficulty of the session for the 25 nearest questions to topic + context', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(12));
            llmService.generateInterviewQuestions.mockResolvedValue(modelAnswer(10));

            await processor.process(buildJob(0, 3, { candidateContext: 'Senior Java developer' }));

            expect(embeddingService.embed).toHaveBeenCalledWith('cand-1', ['Backend\nSenior Java developer']);
            expect(vectorSearch.nearestQuestions).toHaveBeenCalledWith('topic-1', 'medium', [1, 0, 0], 25);
        });

        it('with no context the search text is the topic alone', async () => {
            llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);

            await processor.process(buildJob(0));

            expect(embeddingService.embed).toHaveBeenCalledWith('cand-1', ['Backend']);
        });

        it('12 retrieved → the prompt lists them with their ids and asks for no new questions; 10 are saved as bank', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(12));
            llmService.generateInterviewQuestions.mockResolvedValue(modelAnswer(10));

            await processor.process(buildJob(0));

            const prompt = promptSent();
            expect(prompt.questionBank).toHaveLength(12);
            expect(prompt.questionBank[0]).toEqual({
                bankQuestionId: 'bank-1',
                questionText: 'Bank question 1',
                expectedPoints: ['bank point 1'],
            });
            expect(prompt.newQuestionsNeeded).toBe(0);
            const qnas = savedQnas(tx);
            expect(qnas).toHaveLength(10);
            expect(qnas.every((q: any) => q.source === 'bank' && /^bank-/.test(q.bankQuestionId))).toBe(true);
            // The bank's vetted points and difficulty are what get graded against, not the model's.
            expect(qnas[0]).toEqual(
                expect.objectContaining({
                    orderIndex: 1,
                    questionText: 'Rewritten 1',
                    expectedPoints: ['bank point 1'],
                    difficulty: 'medium',
                    bankQuestionId: 'bank-1',
                }),
            );
        });

        it('6 retrieved → asks for 4 new questions; saves 6 bank + 4 generated', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(6));
            llmService.generateInterviewQuestions.mockResolvedValue(modelAnswer(6));

            await processor.process(buildJob(0));

            expect(promptSent().newQuestionsNeeded).toBe(4);
            const qnas = savedQnas(tx);
            expect(qnas.filter((q: any) => q.source === 'bank')).toHaveLength(6);
            const generated = qnas.filter((q: any) => q.source === 'generated');
            expect(generated).toHaveLength(4);
            expect(generated.every((q: any) => q.bankQuestionId === null)).toBe(true);
        });

        it('E6: 0 retrieved → no bank in the prompt (as before) and 10 generated', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue([]);
            llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);

            await processor.process(buildJob(0));

            const prompt = promptSent();
            expect(prompt).not.toHaveProperty('questionBank');
            expect(prompt).not.toHaveProperty('newQuestionsNeeded');
            const qnas = savedQnas(tx);
            expect(qnas).toHaveLength(10);
            expect(qnas.every((q: any) => q.source === 'generated' && q.bankQuestionId === null)).toBe(true);
        });

        it('Review Focus 3: the model returning one id twice does not save a bank question twice', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(3));
            const answer = modelAnswer(0);
            answer[0] = { ...answer[0], bankQuestionId: 'bank-1' } as any;
            answer[1] = { ...answer[1], bankQuestionId: 'bank-1' } as any;
            llmService.generateInterviewQuestions.mockResolvedValue(answer);

            await processor.process(buildJob(0));

            const qnas = savedQnas(tx);
            expect(qnas.filter((q: any) => q.bankQuestionId === 'bank-1')).toHaveLength(1);
            expect(qnas[0].source).toBe('bank');
            expect(qnas[1].source).toBe('generated');
        });

        it('an id the model made up, or took from elsewhere, is saved as generated without an id', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(3));
            const answer = modelAnswer(0);
            answer[0] = { ...answer[0], bankQuestionId: 'not-in-this-search' } as any;
            llmService.generateInterviewQuestions.mockResolvedValue(answer);

            await processor.process(buildJob(0));

            expect(savedQnas(tx)[0]).toEqual(expect.objectContaining({ source: 'generated', bankQuestionId: null }));
        });

        it('C12: when the embedding fails the bank is skipped, the prompt is as before and 10 are generated', async () => {
            embeddingService.embed.mockRejectedValue(new Error('OPENAI_API_KEY is required'));
            llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);

            await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

            expect(vectorSearch.nearestQuestions).not.toHaveBeenCalled();
            expect(promptSent()).not.toHaveProperty('questionBank');
            expect(savedQnas(tx).every((q: any) => q.source === 'generated')).toBe(true);
        });

        it('C12: a failing database search degrades the same way', async () => {
            vectorSearch.nearestQuestions.mockRejectedValue(new Error('db down'));
            llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);

            await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

            expect(promptSent()).not.toHaveProperty('questionBank');
        });

        it('fewer than 10 questions after reconciling is still a failure, so BullMQ retries', async () => {
            vectorSearch.nearestQuestions.mockResolvedValue(bankOf(6));
            llmService.generateInterviewQuestions.mockResolvedValue(modelAnswer(6).slice(0, 7));

            await expect(processor.process(buildJob(0, 3))).rejects.toThrow('10');
            expect(prisma.interviewSession.update).not.toHaveBeenCalled();
        });

        it('a job queued before this feature (no topicId) skips the bank instead of failing', async () => {
            llmService.generateInterviewQuestions.mockResolvedValue(tenQuestions);
            const job = buildJob(0);
            delete job.data.topicId;

            await expect(processor.process(job)).resolves.toBeUndefined();

            expect(vectorSearch.nearestQuestions).not.toHaveBeenCalled();
        });
    });
});
