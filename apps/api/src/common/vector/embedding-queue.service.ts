import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmbeddingTarget } from './vector-search.service';

export const EMBEDDING_QUEUE = 'embedding';

export interface EmbedJobData {
    target: EmbeddingTarget;
    id: string;
}

@Injectable()
export class EmbeddingQueueService {
    constructor(
        @InjectQueue(EMBEDDING_QUEUE)
        private readonly queue: Queue<EmbedJobData, void, string>,
    ) {}

    /** Queues one row to be embedded. Retries (attempts, backoff) come from the global BullMQ defaults. */
    async enqueue(target: EmbeddingTarget, id: string): Promise<void> {
        await this.queue.add('embed', { target, id });
    }
}
