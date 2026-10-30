import { Module, OnModuleInit } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';
import { CvScreeningsController } from './cv-screenings.controller';
import { CvScreeningProcessor } from './processors/cv-screenings.processor';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LlmModule } from '../../common/external-apis/llm/llm.module';
import { AiUsageLogsService } from '../ai-usage-logs/ai-usage-logs.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnchorRetriever } from './anchor-retriever';
import { EmbeddingModule } from '../../common/external-apis/embedding/embedding.module';
import { VectorModule } from '../../common/vector/vector.module';

@Module({
  imports: [
    // No `defaultJobOptions` here on purpose — it would replace, not extend, the
    // global defaults in app.module.ts (attempts/backoff/removeOnComplete).
    BullModule.registerQueue({ name: 'cv-screening' }),
    NotificationsModule,
    LlmModule,
    EmbeddingModule,
    VectorModule,
  ],
  controllers: [CvScreeningsController],
  providers: [
    CvScreeningsService,
    CvScreeningProcessor,
    AnchorRetriever,
    AiUsageLogsService,
  ],
  exports: [CvScreeningsService],
})
export class CvScreeningsModule implements OnModuleInit {
  constructor(@InjectQueue('cv-screening') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(15, 60000);
  }
}
