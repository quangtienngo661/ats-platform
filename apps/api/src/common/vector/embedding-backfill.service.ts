import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingQueueService } from './embedding-queue.service';
import { EMBEDDING_TARGETS, EmbeddingTarget, VectorSearchService } from './vector-search.service';

/**
 * Rows queued per table in one run. Every row is one OpenAI call, so a single request must not be
 * able to queue an unbounded bill; run it again once the queue has drained to take the next batch.
 */
export const BACKFILL_BATCH_SIZE = 500;

@Injectable()
export class EmbeddingBackfillService {
    private readonly logger = new Logger(EmbeddingBackfillService.name);

    constructor(
        private readonly vectorSearch: VectorSearchService,
        private readonly embeddingQueue: EmbeddingQueueService,
    ) {}

    /** Queues rows that have no embedding yet, in every table that holds one. Returns how many. */
    async enqueueMissing(): Promise<number> {
        let enqueued = 0;
        for (const target of Object.keys(EMBEDDING_TARGETS) as EmbeddingTarget[]) {
            const ids = await this.vectorSearch.findMissing(target, BACKFILL_BATCH_SIZE);
            for (const id of ids) {
                await this.embeddingQueue.enqueue(target, id);
                enqueued += 1;
            }
            this.logger.log(`Embedding backfill: ${ids.length} ${target} row(s) queued`);
        }
        return enqueued;
    }
}
