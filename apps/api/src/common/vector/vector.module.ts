import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmbeddingModule } from '../external-apis/embedding/embedding.module';
import { EMBEDDING_QUEUE, EmbeddingQueueService } from './embedding-queue.service';
import { EmbeddingProcessor } from './processors/embedding.processor';
import { VectorSearchService } from './vector-search.service';

@Module({
    imports: [
        // No `defaultJobOptions` here on purpose — it would replace, not extend, the
        // global defaults in app.module.ts (attempts/backoff/removeOnComplete).
        BullModule.registerQueue({ name: EMBEDDING_QUEUE }),
        EmbeddingModule,
    ],
    providers: [VectorSearchService, EmbeddingQueueService, EmbeddingProcessor],
    exports: [VectorSearchService, EmbeddingQueueService],
})
export class VectorModule {}
