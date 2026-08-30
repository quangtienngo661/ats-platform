import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../../common/external-apis/gemini/gemini.service';
import { StartSessionDto } from './dto/start-session.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { InterviewStatus } from '@ats-platform/database';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { sessionIncludeOptions } from '../../../common/utils/include-options.util';
import { EvaluateQnaJobData } from './interview.processor';

/** How long a session may sit with no activity before the sweep abandons it. */
const INACTIVITY_GRACE_MS = 15 * 60 * 1000;

/** Activity marks outlive any plausible interview, so they never expire mid-session. */
const ACTIVITY_TTL_SECONDS = 24 * 60 * 60;

const activityKey = (sessionId: string) => `interview:activity:${sessionId}`;

@Injectable()
export class InterviewSessionService {
  private readonly logger = new Logger(InterviewSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly socketIoService: SocketIoService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('interview-evaluation')
    private readonly evaluationQueue: Queue,
    @InjectQueue('interview-generation')
    private readonly generationQueue: Queue,
  ) {}

  async startSession(userId: string, dto: StartSessionDto) {
    const topic = await this.prisma.interviewTopic.findUnique({
      where: { topicId: dto.topicId },
      include: { category: true },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề phỏng vấn');

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate)
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    const session = await this.prisma.interviewSession.create({
      data: {
        candidateId: candidate.candidateId,
        topicId: dto.topicId,
        difficultyLevel: dto.difficultyLevel,
        status: InterviewStatus.generating,
      },
    });

    await this.generationQueue.add('generate_questions', {
      sessionId: session.sessionId,
      candidateId: candidate.candidateId,
      topicName: topic.name,
      categoryName: topic.category?.name || 'Không rõ',
      difficultyLevel: dto.difficultyLevel,
      candidateContext: dto.candidateContext || null,
    });

    this.logger.log(
      `Session ${session.sessionId} created (generating), question generation queued for topic: ${topic.name}`,
    );
    return { sessionId: session.sessionId };
  }

  async verifySessionOwnership(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });

    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      select: { candidateId: true },
    });

    return (
      !!candidate && !!session && session.candidateId === candidate.candidateId
    );
  }

  async getSessionStatus(sessionId: string): Promise<InterviewStatus | null> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      select: { status: true },
    });

    return session?.status ?? null;
  }

  async getCurrentQuestion(sessionId: string) {
    const qna = await this.prisma.interviewQnA.findFirst({
      where: {
        sessionId,
        OR: [
          { answerText: null },
          {
            AND: [
              { answerText: { not: null } },
              { hasFollowup: true },
              { followupAnswer: null },
            ],
          },
        ],
      },
      orderBy: { orderIndex: 'asc' },
      select: {
        qnaId: true,
        orderIndex: true,
        questionText: true,
      },
    });
    return qna;
  }

  async submitAnswer(sessionId: string, qnaId: string, answerText: string) {
    const qna = await this.prisma.interviewQnA.findUnique({
      where: { qnaId },
    });
    if (!qna) throw new NotFoundException('Không tìm thấy câu hỏi phỏng vấn');
    if (qna.sessionId !== sessionId)
      throw new BadRequestException(
        'Câu hỏi này không thuộc phiên phỏng vấn hiện tại',
      );
    if (qna.answerText)
      throw new BadRequestException('Câu hỏi này đã được trả lời');

    await this.touchActivity(sessionId);

    await this.prisma.interviewQnA.update({
      where: { qnaId },
      data: { answerText },
    });

    const followupContent = JSON.stringify({
      question: qna.questionText,
      expectedPoints: qna.expectedPoints,
      candidateAnswer: answerText,
    });

    const followupResult = await this.geminiService.checkInterviewFollowup(
      qnaId,
      followupContent,
    );

    if (followupResult.hasFollowup && followupResult.followupQuestion) {
      await this.prisma.interviewQnA.update({
        where: { qnaId },
        data: {
          hasFollowup: true,
          followupQuestion: followupResult.followupQuestion,
          followupReason: followupResult.reason || null,
        },
      });

      return {
        type: 'followup' as const,
        followupQuestion: followupResult.followupQuestion,
        qnaId,
      };
    } else {
      await this.evaluationQueue.add('evaluate_qna', {
        qnaId,
      } satisfies EvaluateQnaJobData);

      const nextQuestion = await this.getCurrentQuestion(sessionId);
      if (nextQuestion) {
        return { type: 'next_question' as const, question: nextQuestion };
      }
      return { type: 'end' as const };
    }
  }

  async submitFollowupAnswer(
    sessionId: string,
    qnaId: string,
    followupAnswer: string,
  ) {
    const qna = await this.prisma.interviewQnA.findUnique({
      where: { qnaId },
    });
    if (!qna) throw new NotFoundException('Không tìm thấy câu hỏi phỏng vấn');
    if (qna.sessionId !== sessionId)
      throw new BadRequestException(
        'Câu hỏi này không thuộc phiên phỏng vấn hiện tại',
      );
    if (!qna.hasFollowup)
      throw new BadRequestException('Câu hỏi này không có câu hỏi phụ');

    await this.touchActivity(sessionId);

    await this.prisma.interviewQnA.update({
      where: { qnaId },
      data: { followupAnswer },
    });

    await this.evaluationQueue.add('evaluate_qna', { qnaId });

    const nextQuestion = await this.getCurrentQuestion(sessionId);
    if (nextQuestion) {
      return { type: 'next_question' as const, question: nextQuestion };
    }
    return { type: 'end' as const };
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      include: {
        topic: true,
        candidate: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên phỏng vấn');

    const existingResult = await this.prisma.interviewResult.findUnique({
      where: { sessionId },
    });
    if (existingResult) return existingResult;

    const allQnAs = await this.prisma.interviewQnA.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
    });

    const hasPendingEvaluation = allQnAs.some(
      (qna) =>
        qna.correctnessScore === null && !qna.feedback?.startsWith('[ERROR]'),
    );

    if (hasPendingEvaluation) {
      await this.prisma.interviewSession.update({
        where: { sessionId },
        data: { status: InterviewStatus.pending_result },
      });

      return {
        status: 'pending_result',
        message:
          'Câu trả lời phỏng vấn vẫn đang được chấm điểm. Kết quả sẽ được gửi khi sẵn sàng.',
      };
    }

    const difficultyWeight: Record<string, number> = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
    };

    let weightedSum = 0;
    let totalWeight = 0;
    for (const qna of allQnAs) {
      const score = qna.correctnessScore ? Number(qna.correctnessScore) : 0;
      const weight = difficultyWeight[qna.difficulty] || 1.0;
      weightedSum += score * weight;
      totalWeight += 100 * weight;
    }
    const weightedOverallScore =
      totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 100 * 100) / 100
        : 0;

    const resultContent = JSON.stringify({
      candidateInfo: {
        name: session.candidate?.user?.fullName || 'Unknown',
        topic: session.topic?.name || 'Unknown',
        difficulty: session.difficultyLevel,
      },
      weightedOverallScore,
      evaluations: allQnAs.map((qna) => ({
        orderIndex: qna.orderIndex,
        question: qna.questionText,
        difficulty: qna.difficulty,
        answer: qna.answerText,
        followupQuestion: qna.followupQuestion,
        followupAnswer: qna.followupAnswer,
        score: qna.correctnessScore ? Number(qna.correctnessScore) : null,
        feedback: qna.feedback,
        coveredPoints: qna.coveredPoints,
        missedPoints: qna.missedPoints,
      })),
    });

    this.logger.log(
      `Generating final result for session ${sessionId} — weightedScore: ${weightedOverallScore}`,
    );
    const aiResult = await this.geminiService.generateInterviewResult(
      sessionId,
      resultContent,
    );

    const result = await this.prisma.interviewResult.upsert({
      where: { sessionId },
      update: {
        overallScore: aiResult.overallScore,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        actionPlan: aiResult.actionPlan,
      },
      create: {
        sessionId,
        overallScore: aiResult.overallScore,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        actionPlan: aiResult.actionPlan,
      },
    });

    await this.prisma.interviewSession.update({
      where: { sessionId },
      data: { status: InterviewStatus.completed },
    });

    this.logger.log(
      `Session ${sessionId} completed with overallScore: ${aiResult.overallScore}`,
    );
    return result;
  }

  async finalizeSession(sessionId: string, emitCompleted = true) {
    const result = await this.endSession(sessionId);

    if (emitCompleted && (result as any)?.status !== 'pending_result') {
      this.socketIoService.handleEmit(
        'interview:session_completed',
        result,
        `interview_${sessionId}`,
      );
    }

    return result;
  }

  async resumeSession(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate) return null;

    const activeSession = await this.prisma.interviewSession.findFirst({
      where: {
        candidateId: candidate.candidateId,
        status: InterviewStatus.in_progress,
      },
      include: sessionIncludeOptions,
      orderBy: { startedAt: 'desc' },
    });

    if (!activeSession) return null;

    const currentQuestion = await this.getCurrentQuestion(
      activeSession.sessionId,
    );
    return {
      session: activeSession,
      currentQuestion,
    };
  }

  async abandonSession(sessionId: string, userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate)
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      select: { sessionId: true, candidateId: true, status: true },
    });

    if (!session) throw new NotFoundException('Không tìm thấy phiên phỏng vấn');
    if (session.candidateId !== candidate.candidateId) {
      throw new BadRequestException(
        'Phiên phỏng vấn này không thuộc về người dùng hiện tại',
      );
    }
    if (
      ![InterviewStatus.in_progress, InterviewStatus.generating].includes(
        session.status as any,
      )
    ) {
      throw new BadRequestException(
        'Chỉ có thể hủy phiên phỏng vấn đang diễn ra',
      );
    }

    const updatedSession = await this.prisma.interviewSession.update({
      where: { sessionId },
      data: { status: InterviewStatus.abandon },
    });

    this.logger.log(`Session ${sessionId} abandoned by user ${userId}`);
    return updatedSession;
  }

  /**
   * Abandon a session the candidate walked away from (closed the tab, lost the
   * network and never came back). Called from the delayed BullMQ sweep, not from
   * a user request — so there is no ownership check and no throw on a session
   * that already finished; a no-op is the correct outcome in that case.
   */
  async touchActivity(sessionId: string): Promise<void> {
    await this.redis
      .set(activityKey(sessionId), Date.now(), 'EX', ACTIVITY_TTL_SECONDS)
      .catch((error) =>
        this.logger.warn(
          `Could not record activity for session ${sessionId}: ${error.message}`,
        ),
      );
  }

  /**
   * Abandon interview sessions nobody is working on any more.
   *
   * Runs periodically rather than off a socket `disconnect`, because the worst case
   * isn't a dropped connection — it's a session that never got a socket at all (the
   * candidate called startSession then closed the tab), which no disconnect handler
   * would ever see. A session is abandoned only when BOTH signals agree: inactive
   * past the grace period AND nobody currently in its room. The room check stops a
   * candidate who is mid-answer from being cut off if Redis lost the activity mark.
   */
  async sweepStaleSessions(): Promise<string[]> {
    const staleBefore = Date.now() - INACTIVITY_GRACE_MS;

    const candidates = await this.prisma.interviewSession.findMany({
      where: {
        status: {
          in: [InterviewStatus.in_progress, InterviewStatus.generating],
        },
        startedAt: { lt: new Date(staleBefore) },
      },
      select: { sessionId: true, startedAt: true },
    });

    const abandoned: string[] = [];

    for (const session of candidates) {
      const mark = await this.redis
        .get(activityKey(session.sessionId))
        .catch(() => null);
      const lastActivity = mark ? Number(mark) : session.startedAt.getTime();

      if (lastActivity >= staleBefore) continue;

      const room = `interview_${session.sessionId}`;
      if (await this.socketIoService.hasClientsInRoom(room)) continue;

      // Guarded update: the status must still be sweepable at write time, otherwise
      // a session the candidate finished a moment ago would be clobbered.
      const updated = await this.prisma.interviewSession.updateMany({
        where: {
          sessionId: session.sessionId,
          status: {
            in: [InterviewStatus.in_progress, InterviewStatus.generating],
          },
        },
        data: { status: InterviewStatus.abandon },
      });

      if (updated.count === 0) continue;

      await this.redis
        .del(activityKey(session.sessionId))
        .catch(() => undefined);

      this.socketIoService.handleEmit(
        'interview:session_abandoned',
        {
          sessionId: session.sessionId,
          message: 'Phiên phỏng vấn đã bị hủy do không có hoạt động.',
        },
        room,
      );

      abandoned.push(session.sessionId);
      this.logger.log(
        `Session ${session.sessionId} abandoned after inactivity`,
      );
    }

    return abandoned;
  }
}
