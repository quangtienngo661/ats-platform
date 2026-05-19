import { InterviewStatus } from '@ats-platform/database';
import { InterviewSessionService } from './interview-session.service';
import {
  createPrismaMock,
  createPrismaTransactionMock,
  createQueueMock,
  createSocketMock,
} from '../../../test-utils/unit-test-helpers';

const tenQuestions = Array.from({ length: 10 }, (_, index) => ({
  difficulty: 'medium',
  questionText: `Question ${index + 1}`,
  expectedPoints: ['point'],
}));

describe('InterviewSessionService', () => {
  let service: InterviewSessionService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let gemini: {
    generateInterviewQuestions: jest.Mock;
    checkInterviewFollowup: jest.Mock;
    generateInterviewResult: jest.Mock;
  };
  let socket: ReturnType<typeof createSocketMock>;
  let queue: ReturnType<typeof createQueueMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    gemini = {
      generateInterviewQuestions: jest.fn(),
      checkInterviewFollowup: jest.fn(),
      generateInterviewResult: jest.fn(),
    };
    socket = createSocketMock();
    queue = createQueueMock();
    service = new InterviewSessionService(prisma as any, gemini as any, socket as any, queue as any);
  });

  it('starts a session only when AI returns at least ten questions', async () => {
    const tx = createPrismaTransactionMock();
    prisma.interviewTopic.findUnique.mockResolvedValue({ topicId: 'topic-1', name: 'Backend', category: { name: 'IT' } });
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    gemini.generateInterviewQuestions.mockResolvedValue(tenQuestions);
    tx.interviewSession.create.mockResolvedValue({ sessionId: 'session-1' });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(
      service.startSession('user-1', { topicId: 'topic-1', difficultyLevel: 'medium' } as any),
    ).resolves.toEqual({ sessionId: 'session-1' });

    expect(tx.interviewQnA.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ sessionId: 'session-1', orderIndex: 1, questionText: 'Question 1' }),
      ]),
    });

    gemini.generateInterviewQuestions.mockResolvedValue(tenQuestions.slice(0, 3));
    await expect(
      service.startSession('user-1', { topicId: 'topic-1', difficultyLevel: 'medium' } as any),
    ).rejects.toThrow('10');
  });

  it('returns follow-up questions without queuing evaluation', async () => {
    prisma.interviewQnA.findUnique.mockResolvedValue({
      qnaId: 'qna-1',
      sessionId: 'session-1',
      answerText: null,
      questionText: 'Question',
      expectedPoints: ['point'],
    });
    gemini.checkInterviewFollowup.mockResolvedValue({
      hasFollowup: true,
      followupQuestion: 'Can you clarify?',
      reason: 'Need detail',
    });

    await expect(service.submitAnswer('session-1', 'qna-1', 'Answer')).resolves.toEqual({
      type: 'followup',
      followupQuestion: 'Can you clarify?',
      qnaId: 'qna-1',
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('queues evaluation and returns the next question when no follow-up is needed', async () => {
    prisma.interviewQnA.findUnique.mockResolvedValue({
      qnaId: 'qna-1',
      sessionId: 'session-1',
      answerText: null,
      questionText: 'Question',
      expectedPoints: ['point'],
    });
    gemini.checkInterviewFollowup.mockResolvedValue({ hasFollowup: false });
    prisma.interviewQnA.findFirst.mockResolvedValue({ qnaId: 'qna-2', orderIndex: 2, questionText: 'Next' });

    await expect(service.submitAnswer('session-1', 'qna-1', 'Answer')).resolves.toEqual({
      type: 'next_question',
      question: { qnaId: 'qna-2', orderIndex: 2, questionText: 'Next' },
    });
    expect(queue.add).toHaveBeenCalledWith('evaluate_qna', { qnaId: 'qna-1' });
  });

  it('marks session pending when some answers are not evaluated yet', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue({ sessionId: 'session-1' });
    prisma.interviewResult.findUnique.mockResolvedValue(null);
    prisma.interviewQnA.findMany.mockResolvedValue([
      { correctnessScore: null, feedback: null, difficulty: 'medium' },
    ]);
    prisma.interviewSession.update.mockResolvedValue({ sessionId: 'session-1', status: InterviewStatus.pending_result });

    await expect(service.endSession('session-1')).resolves.toEqual(
      expect.objectContaining({ status: 'pending_result' }),
    );
  });

  it('generates a final result and emits completion through finalizeSession', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue({
      sessionId: 'session-1',
      difficultyLevel: 'medium',
      topic: { name: 'Backend' },
      candidate: { user: { fullName: 'Alice' } },
    });
    prisma.interviewResult.findUnique.mockResolvedValue(null);
    prisma.interviewQnA.findMany.mockResolvedValue([
      {
        orderIndex: 1,
        questionText: 'Question',
        difficulty: 'medium',
        answerText: 'Answer',
        correctnessScore: 80,
        feedback: 'Good',
        coveredPoints: [],
        missedPoints: [],
      },
    ]);
    gemini.generateInterviewResult.mockResolvedValue({
      overallScore: 80,
      strengths: ['A'],
      weaknesses: ['B'],
      actionPlan: ['C'],
    });
    prisma.interviewResult.upsert.mockResolvedValue({ resultId: 'result-1', overallScore: 80 });

    await expect(service.finalizeSession('session-1')).resolves.toEqual({ resultId: 'result-1', overallScore: 80 });
    expect(socket.handleEmit).toHaveBeenCalledWith(
      'interview:session_completed',
      { resultId: 'result-1', overallScore: 80 },
      'interview_session-1',
    );
  });

  it('abandons only owned in-progress sessions', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSession.findUnique.mockResolvedValue({
      sessionId: 'session-1',
      candidateId: 'cand-1',
      status: InterviewStatus.in_progress,
    });
    prisma.interviewSession.update.mockResolvedValue({ sessionId: 'session-1', status: InterviewStatus.abandon });

    await expect(service.abandonSession('session-1', 'user-1')).resolves.toEqual({
      sessionId: 'session-1',
      status: InterviewStatus.abandon,
    });
  });
});
