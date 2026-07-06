import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../../common/external-apis/gemini/gemini.service';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { InterviewStatus, DifficultyLevel } from '@ats-platform/database';

export interface GenerateQuestionsJobData {
    sessionId: string;
    candidateId: string;
    topicName: string;
    categoryName: string;
    difficultyLevel: DifficultyLevel;
    candidateContext?: string | null;
}

@Processor('interview-generation', { concurrency: 3 })
export class InterviewGenerationProcessor extends WorkerHost {
    private readonly logger = new Logger(InterviewGenerationProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService,
        private readonly socketIoService: SocketIoService,
    ) {
        super();
    }

    // ═══════════════════════════════════════════════════════════════
    // process — Entry point của BullMQ Worker
    // ═══════════════════════════════════════════════════════════════
    async process(job: Job<GenerateQuestionsJobData, void, string>): Promise<void> {
        if (job.name !== 'generate_questions') return;

        const { sessionId, candidateId, topicName, categoryName, difficultyLevel, candidateContext } = job.data;

        try {
            const promptContent = JSON.stringify({
                topic: topicName,
                category: categoryName || 'Không rõ',
                difficulty: difficultyLevel,
                candidateContext: candidateContext || null,
            });

            this.logger.log(`Generating 10 questions for session ${sessionId} (topic: ${topicName}, difficulty: ${difficultyLevel})`);
            const aiResult = await this.geminiService.generateInterviewQuestions(candidateId, promptContent);

            if (!Array.isArray(aiResult) || aiResult.length < 10) {
                throw new Error(`AI chỉ tạo được ${aiResult?.length ?? 0} câu hỏi thay vì 10 câu`);
            }

            await this.prisma.$transaction(async (tx) => {
                const qnaData = aiResult.slice(0, 10).map((q: any, index: number) => ({
                    sessionId,
                    orderIndex: index + 1,
                    difficulty: q.difficulty,
                    questionText: q.questionText,
                    expectedPoints: q.expectedPoints,
                }));
                await tx.interviewQnA.createMany({ data: qnaData });
                await tx.interviewSession.update({
                    where: { sessionId },
                    data: { status: InterviewStatus.in_progress },
                });
            });

            this.logger.log(`Session ${sessionId} ready with 10 questions`);
            this.socketIoService.handleEmit('interview:session_ready', { sessionId }, `interview_${sessionId}`);
        } catch (error) {
            const maxAttempts = job.opts.attempts ?? 1;
            const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

            this.logger.error(
                `Failed to generate questions for session ${sessionId} (attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`,
                error.stack,
            );

            if (!isFinalAttempt) {
                // Còn lượt retry — để BullMQ tự retry, chưa đổi trạng thái session
                throw error;
            }

            // Hết lượt retry — đánh dấu session hủy, báo client qua socket
            await this.prisma.interviewSession.update({
                where: { sessionId },
                data: { status: InterviewStatus.abandon },
            }).catch((updateErr) => {
                this.logger.error(`Failed to mark session ${sessionId} abandoned after generation failure`, updateErr.stack);
            });

            this.socketIoService.handleEmit(
                'interview:session_failed',
                { sessionId, message: 'Không thể tạo câu hỏi phỏng vấn. Vui lòng thử lại.' },
                `interview_${sessionId}`,
            );

            // Vẫn ném lại lỗi để BullMQ ghi nhận job "failed", không phải "completed"
            throw error;
        }
    }
}
