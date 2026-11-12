import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LlmService } from '../../../common/external-apis/llm/llm.service';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { InterviewStatus, DifficultyLevel } from '@ats-platform/database';
import { EmbeddingService } from '../../../common/external-apis/embedding/embedding.service';
import { BankQuestion, VectorSearchService } from '../../../common/vector/vector-search.service';
import { reconcileSelection } from './question-selection';

/** Questions a session needs. */
const QUESTIONS_PER_SESSION = 10;
/** Bank questions shown to the model: more than it needs, so it can choose. */
const BANK_CANDIDATES = 25;

export interface GenerateQuestionsJobData {
    sessionId: string;
    candidateId: string;
    /** Absent on jobs queued before the question bank existed; those skip the bank. */
    topicId?: string;
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
        private readonly llmService: LlmService,
        private readonly socketIoService: SocketIoService,
        private readonly embeddingService: EmbeddingService,
        private readonly vectorSearch: VectorSearchService,
    ) {
        super();
    }

    // ═══════════════════════════════════════════════════════════════
    // process — Entry point của BullMQ Worker
    // ═══════════════════════════════════════════════════════════════
    async process(job: Job<GenerateQuestionsJobData, void, string>): Promise<void> {
        if (job.name !== 'generate_questions') return;

        const { sessionId, candidateId, topicId, topicName, categoryName, difficultyLevel, candidateContext } = job.data;

        try {
            const bank = await this.findBankQuestions(job.data);
            const promptContent = JSON.stringify({
                topic: topicName,
                category: categoryName || 'Không rõ',
                difficulty: difficultyLevel,
                candidateContext: candidateContext || null,
                // Only when something was retrieved: with an empty bank the prompt is the one used before the bank existed.
                ...(bank.length > 0
                    ? {
                          questionBank: bank.map(({ questionId, questionText, expectedPoints }) => ({
                              bankQuestionId: questionId,
                              questionText,
                              expectedPoints,
                          })),
                          newQuestionsNeeded: Math.max(0, QUESTIONS_PER_SESSION - bank.length),
                      }
                    : {}),
            });

            this.logger.log(
                `Generating ${QUESTIONS_PER_SESSION} questions for session ${sessionId} (topic: ${topicName}, difficulty: ${difficultyLevel}, bank candidates: ${bank.length})`,
            );
            const aiResult = await this.llmService.generateInterviewQuestions(candidateId, promptContent);

            if (!Array.isArray(aiResult) || aiResult.length < QUESTIONS_PER_SESSION) {
                throw new Error(`AI chỉ tạo được ${aiResult?.length ?? 0} câu hỏi thay vì ${QUESTIONS_PER_SESSION} câu`);
            }

            const drafts = reconcileSelection(aiResult.slice(0, QUESTIONS_PER_SESSION), bank);

            await this.prisma.$transaction(async (tx) => {
                const qnaData = drafts.map((draft, index) => ({
                    sessionId,
                    orderIndex: index + 1,
                    difficulty: draft.difficulty,
                    questionText: draft.questionText,
                    expectedPoints: draft.expectedPoints,
                    source: draft.source,
                    bankQuestionId: draft.bankQuestionId,
                }));
                await tx.interviewQnA.createMany({ data: qnaData });
                await tx.interviewSession.update({
                    where: { sessionId },
                    data: { status: InterviewStatus.in_progress },
                });
            });

            this.logger.log(
                `Session ${sessionId} ready with ${QUESTIONS_PER_SESSION} questions (${drafts.filter((d) => d.source === 'bank').length} from the bank)`,
            );
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

    /**
     * The bank questions nearest to the topic and the candidate's context, for the session's own
     * difficulty. Any failure (no embedding key, the API or the database down, an old job without a
     * topic id) means "no bank": the questions are then generated as they were before the bank (R16).
     */
    private async findBankQuestions(data: GenerateQuestionsJobData): Promise<BankQuestion[]> {
        if (!data.topicId) return [];
        try {
            const text = data.candidateContext ? `${data.topicName}\n${data.candidateContext}` : data.topicName;
            const [vector] = await this.embeddingService.embed(data.candidateId, [text]);
            return await this.vectorSearch.nearestQuestions(data.topicId, data.difficultyLevel, vector, BANK_CANDIDATES);
        } catch (error) {
            this.logger.warn(
                `Question bank unavailable for session ${data.sessionId}, generating every question: ${error.message}`,
            );
            return [];
        }
    }
}
