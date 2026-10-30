import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EmbeddingQueueService } from '../../../common/vector/embedding-queue.service';
import {
    CreateInterviewQuestionDto,
    ListInterviewQuestionsQueryDto,
    UpdateInterviewQuestionDto,
} from './dto/interview-question.dto';

const TOPIC_NOT_FOUND = 'Không tìm thấy chủ đề phỏng vấn';
const QUESTION_NOT_FOUND = 'Không tìm thấy câu hỏi phỏng vấn';
const DEFAULT_PAGE_SIZE = 20;

/** The system-wide interview question bank. Only platform admins reach it (see the controller). */
@Injectable()
export class InterviewQuestionsService {
    private readonly logger = new Logger(InterviewQuestionsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly embeddingQueue: EmbeddingQueueService,
    ) {}

    async list(topicId: string, query: ListInterviewQuestionsQueryDto) {
        await this.assertTopicExists(topicId);

        const page = query.page ?? 1;
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const where: Prisma.InterviewQuestionWhereInput = {
            topicId,
            ...(query.difficulty ? { difficulty: query.difficulty } : {}),
            ...(query.includeInactive ? {} : { isActive: true }),
        };

        const [items, total] = await Promise.all([
            this.prisma.interviewQuestion.findMany({
                where,
                orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.interviewQuestion.count({ where }),
        ]);

        return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async create(topicId: string, dto: CreateInterviewQuestionDto, createdById: string) {
        await this.assertTopicExists(topicId);

        const question = await this.prisma.interviewQuestion.create({
            data: {
                topicId,
                difficulty: dto.difficulty,
                questionText: dto.questionText.trim(),
                expectedPoints: dto.expectedPoints.map((point) => point.trim()),
                createdById,
            },
        });
        await this.queueEmbedding(question.questionId);
        return question;
    }

    async update(questionId: string, dto: UpdateInterviewQuestionDto) {
        const existing = await this.prisma.interviewQuestion.findUnique({
            where: { questionId },
            select: { questionText: true },
        });
        if (!existing) throw new NotFoundException(QUESTION_NOT_FOUND);

        const data: Prisma.InterviewQuestionUpdateInput = {};
        if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
        if (dto.questionText !== undefined) data.questionText = dto.questionText.trim();
        if (dto.expectedPoints !== undefined) data.expectedPoints = dto.expectedPoints.map((point) => point.trim());
        if (dto.isActive !== undefined) data.isActive = dto.isActive;

        const updated = await this.prisma.interviewQuestion.update({ where: { questionId }, data });

        // The embedding is built from the text alone; other edits leave it valid.
        if (data.questionText !== undefined && data.questionText !== existing.questionText.trim()) {
            await this.queueEmbedding(questionId);
        }
        return updated;
    }

    /** Deleting hides: the row stays so sessions that used the question keep their reference. */
    async remove(questionId: string) {
        const existing = await this.prisma.interviewQuestion.findUnique({
            where: { questionId },
            select: { questionId: true },
        });
        if (!existing) throw new NotFoundException(QUESTION_NOT_FOUND);

        return this.prisma.interviewQuestion.update({ where: { questionId }, data: { isActive: false } });
    }

    private async assertTopicExists(topicId: string) {
        const topic = await this.prisma.interviewTopic.findUnique({ where: { topicId }, select: { topicId: true } });
        if (!topic) throw new NotFoundException(TOPIC_NOT_FOUND);
    }

    // The question is saved; a missing embedding is repaired by the admin backfill.
    private async queueEmbedding(questionId: string) {
        try {
            await this.embeddingQueue.enqueue('interview_question', questionId);
        } catch (error) {
            this.logger.warn(`Could not queue the embedding of question ${questionId}: ${error.message}`);
        }
    }
}
