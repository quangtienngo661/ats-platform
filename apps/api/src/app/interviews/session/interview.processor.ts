import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../../common/external-apis/gemini/gemini.service';
import { InterviewStatus } from '@ats-platform/database';
import { InterviewSessionService } from './interview-session.service';

@Processor('interview-evaluation', { concurrency: 3 })
export class InterviewProcessor extends WorkerHost {
    private readonly logger = new Logger(InterviewProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService,
        private readonly interviewSessionService: InterviewSessionService,
    ) {
        super();
    }

    // ═══════════════════════════════════════════════════════════════
    // process — Entry point của BullMQ Worker
    // ═══════════════════════════════════════════════════════════════
    async process(job: Job<any, any, string>): Promise<any> {
        if (job.name === 'evaluate_qna') {
            const { qnaId } = job.data;
            this.logger.log(`Evaluating QnA: ${qnaId}`);

            try {
                // 1. Lấy thông tin câu hỏi + câu trả lời từ DB
                const qna = await this.prisma.interviewQnA.findUnique({
                    where: { qnaId },
                });

                if (!qna) {
                    this.logger.warn(`QnA ${qnaId} not found, skipping evaluation`);
                    return;
                }

                // 2. Build content cho Gemini evaluate
                const evaluateContent = JSON.stringify({
                    question: qna.questionText,
                    expectedPoints: qna.expectedPoints,
                    candidateAnswer: qna.answerText,
                    followupQuestion: qna.followupQuestion || undefined,
                    followupAnswer: qna.followupAnswer || undefined,
                });

                // 3. Gọi AI chấm điểm
                const aiResult = await this.geminiService.evaluateInterviewAnswer(
                    qnaId,
                    evaluateContent,
                );

                // 4. Cập nhật kết quả chấm điểm vào DB
                // coveredPoints: các expected points mà ứng viên đã đề cập đúng
                // missedPoints: các expected points mà ứng viên chưa nói tới
                await this.prisma.interviewQnA.update({
                    where: { qnaId },
                    data: {
                        correctnessScore: aiResult.score,
                        feedback: aiResult.feedback,
                        coveredPoints: aiResult.coveredPoints,
                        missedPoints: aiResult.missedPoints,
                    },
                });

                await this.finalizePendingSessionIfReady(qna.sessionId);

                this.logger.log(`QnA ${qnaId} evaluated — Score: ${aiResult.score}/100`);
            } catch (error) {
                const maxAttempts = job.opts.attempts ?? 1;
                const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

                this.logger.error(
                    `Failed to evaluate QnA ${qnaId} (attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`,
                    error.stack,
                );

                if (!isFinalAttempt) {
                    // Còn lượt retry — để BullMQ tự retry, chưa ghi [ERROR] và chưa finalize
                    throw error;
                }

                // Ghi lỗi vào feedback để endSession biết câu này bị lỗi chấm
                await this.prisma.interviewQnA.update({
                    where: { qnaId },
                    data: {
                        feedback: `[ERROR] Chấm điểm thất bại: ${error.message}`,
                    },
                });

                const qna = await this.prisma.interviewQnA.findUnique({
                    where: { qnaId },
                    select: { sessionId: true },
                });

                if (qna) {
                    await this.finalizePendingSessionIfReady(qna.sessionId);
                }

                // Hết lượt retry — ném lại lỗi để BullMQ ghi nhận job "failed", không phải "completed"
                throw error;
            }
        }
    }

    private async finalizePendingSessionIfReady(sessionId: string) {
        const session = await this.prisma.interviewSession.findUnique({
            where: { sessionId },
            select: { status: true },
        });

        if (session?.status !== InterviewStatus.pending_result) return;

        const remaining = await this.prisma.interviewQnA.count({
            where: {
                sessionId,
                correctnessScore: null,
                OR: [
                    { feedback: null },
                    { NOT: { feedback: { startsWith: '[ERROR]' } } },
                ],
            },
        });

        if (remaining === 0) {
            await this.interviewSessionService.finalizeSession(sessionId);
        }
    }
}
