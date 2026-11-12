import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../../external-apis/embedding/embedding.service';
import { buildEmbeddingText } from '../embedding-text';
import { EMBEDDING_QUEUE, EmbedJobData } from '../embedding-queue.service';
import { EMBEDDING_TARGETS, EmbeddingTarget, VectorSearchService } from '../vector-search.service';

@Processor(EMBEDDING_QUEUE, { concurrency: 5 })
export class EmbeddingProcessor extends WorkerHost {
    private readonly logger = new Logger(EmbeddingProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly embeddingService: EmbeddingService,
        private readonly vectorSearch: VectorSearchService,
    ) {
        super();
    }

    async process(job: Job<EmbedJobData, void, string>): Promise<void> {
        if (job.name !== 'embed') return;

        const { target, id } = job.data;
        try {
            if (!(target in EMBEDDING_TARGETS)) throw new Error(`Unknown embedding target: ${String(target)}`);

            const row = await this.loadRow(target, id);
            if (!row) {
                this.logger.log(`Embedding skipped: ${target} ${id} no longer exists`);
                return;
            }

            const text = buildEmbeddingText(target, row);
            if (text === null) {
                this.logger.log(`Embedding skipped: ${target} ${id} has no text to embed`);
                return;
            }

            const [vector] = await this.embeddingService.embed(id, [text]);
            await this.vectorSearch.writeEmbedding(target, id, vector);
        } catch (error) {
            this.logger.error(
                `Embedding ${target} ${id} failed (attempt ${job.attemptsMade + 1}): ${error.message}`,
                error.stack,
            );
            // Rethrow: swallowing it would make BullMQ record the job as completed.
            throw error;
        }
    }

    private async loadRow(target: EmbeddingTarget, id: string) {
        switch (target) {
            case 'skill':
                return this.prisma.skill.findUnique({
                    where: { skillId: id },
                    select: { name: true, synonyms: true },
                });
            case 'cv_parsed_data':
                return this.prisma.cVParsedData.findUnique({
                    where: { id },
                    select: { summary: true, skills: true, experience: true },
                });
        }
    }
}
