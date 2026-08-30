import { InterviewStatus } from '@ats-platform/database';
import { InterviewSessionService } from './interview-session.service';
import {
  createPrismaMock,
  createQueueMock,
  createRedisMock,
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
  let redis: ReturnType<typeof createRedisMock>;
  let queue: ReturnType<typeof createQueueMock>;
  let generationQueue: ReturnType<typeof createQueueMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    gemini = {
      generateInterviewQuestions: jest.fn(),
      checkInterviewFollowup: jest.fn(),
      generateInterviewResult: jest.fn(),
    };
    socket = createSocketMock();
    redis = createRedisMock();
    queue = createQueueMock();
    generationQueue = createQueueMock();
    service = new InterviewSessionService(
      prisma as any,
      gemini as any,
      socket as any,
      redis as any,
      queue as any,
      generationQueue as any,
    );
  });

  it('creates a session in "generating" status and queues question generation', async () => {
    prisma.interviewTopic.findUnique.mockResolvedValue({
      topicId: 'topic-1',
      name: 'Backend',
      category: { name: 'IT' },
    });
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSession.create.mockResolvedValue({
      sessionId: 'session-1',
      status: InterviewStatus.generating,
    });

    await expect(
      service.startSession('user-1', {
        topicId: 'topic-1',
        difficultyLevel: 'medium',
      } as any),
    ).resolves.toEqual({ sessionId: 'session-1' });

    expect(prisma.interviewSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        candidateId: 'cand-1',
        topicId: 'topic-1',
        difficultyLevel: 'medium',
        status: InterviewStatus.generating,
      }),
    });
    expect(prisma.interviewQnA.createMany).not.toHaveBeenCalled();
    expect(generationQueue.add).toHaveBeenCalledWith(
      'generate_questions',
      expect.objectContaining({
        sessionId: 'session-1',
        candidateId: 'cand-1',
        topicName: 'Backend',
        categoryName: 'IT',
        difficultyLevel: 'medium',
      }),
    );
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

    await expect(
      service.submitAnswer('session-1', 'qna-1', 'Answer'),
    ).resolves.toEqual({
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
    prisma.interviewQnA.findFirst.mockResolvedValue({
      qnaId: 'qna-2',
      orderIndex: 2,
      questionText: 'Next',
    });

    await expect(
      service.submitAnswer('session-1', 'qna-1', 'Answer'),
    ).resolves.toEqual({
      type: 'next_question',
      question: { qnaId: 'qna-2', orderIndex: 2, questionText: 'Next' },
    });
    expect(queue.add).toHaveBeenCalledWith('evaluate_qna', { qnaId: 'qna-1' });
  });

  it('marks session pending when some answers are not evaluated yet', async () => {
    prisma.interviewSession.findUnique.mockResolvedValue({
      sessionId: 'session-1',
    });
    prisma.interviewResult.findUnique.mockResolvedValue(null);
    prisma.interviewQnA.findMany.mockResolvedValue([
      { correctnessScore: null, feedback: null, difficulty: 'medium' },
    ]);
    prisma.interviewSession.update.mockResolvedValue({
      sessionId: 'session-1',
      status: InterviewStatus.pending_result,
    });

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
    prisma.interviewResult.upsert.mockResolvedValue({
      resultId: 'result-1',
      overallScore: 80,
    });

    await expect(service.finalizeSession('session-1')).resolves.toEqual({
      resultId: 'result-1',
      overallScore: 80,
    });
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
    prisma.interviewSession.update.mockResolvedValue({
      sessionId: 'session-1',
      status: InterviewStatus.abandon,
    });

    await expect(
      service.abandonSession('session-1', 'user-1'),
    ).resolves.toEqual({
      sessionId: 'session-1',
      status: InterviewStatus.abandon,
    });
  });

  it('also allows abandoning a session still generating questions', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSession.findUnique.mockResolvedValue({
      sessionId: 'session-1',
      candidateId: 'cand-1',
      status: InterviewStatus.generating,
    });
    prisma.interviewSession.update.mockResolvedValue({
      sessionId: 'session-1',
      status: InterviewStatus.abandon,
    });

    await expect(
      service.abandonSession('session-1', 'user-1'),
    ).resolves.toEqual({
      sessionId: 'session-1',
      status: InterviewStatus.abandon,
    });
  });

  describe('sweepStaleSessions', () => {
    const staleSession = {
      sessionId: 'session-1',
      startedAt: new Date(Date.now() - 60 * 60 * 1000), // an hour ago
    };

    it('abandons a session nobody ever joined (no activity mark, no live socket)', async () => {
      prisma.interviewSession.findMany.mockResolvedValue([staleSession]);
      redis.get.mockResolvedValue(null); // never joined → falls back to startedAt
      socket.hasClientsInRoom.mockResolvedValue(false);
      prisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.sweepStaleSessions()).resolves.toEqual([
        'session-1',
      ]);

      expect(socket.handleEmit).toHaveBeenCalledWith(
        'interview:session_abandoned',
        expect.objectContaining({ sessionId: 'session-1' }),
        'interview_session-1',
      );
    });

    it('spares a session whose candidate is still in the room', async () => {
      prisma.interviewSession.findMany.mockResolvedValue([staleSession]);
      redis.get.mockResolvedValue(null);
      socket.hasClientsInRoom.mockResolvedValue(true);

      await expect(service.sweepStaleSessions()).resolves.toEqual([]);
      expect(prisma.interviewSession.updateMany).not.toHaveBeenCalled();
    });

    it('spares a session that was active within the grace period', async () => {
      prisma.interviewSession.findMany.mockResolvedValue([staleSession]);
      redis.get.mockResolvedValue(String(Date.now() - 1000)); // answered a second ago
      socket.hasClientsInRoom.mockResolvedValue(false);

      await expect(service.sweepStaleSessions()).resolves.toEqual([]);
      expect(prisma.interviewSession.updateMany).not.toHaveBeenCalled();
    });

    it('does not emit when the session finished between the read and the write', async () => {
      prisma.interviewSession.findMany.mockResolvedValue([staleSession]);
      redis.get.mockResolvedValue(null);
      socket.hasClientsInRoom.mockResolvedValue(false);
      // Guarded updateMany matched nothing → the session left in_progress already.
      prisma.interviewSession.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.sweepStaleSessions()).resolves.toEqual([]);
      expect(socket.handleEmit).not.toHaveBeenCalled();
    });
  });
});
