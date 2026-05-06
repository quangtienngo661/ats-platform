import { Module, OnModuleInit } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';
import { CvScreeningsController } from './cv-screenings.controller';
import { CvScreeningProcessor } from './processors/cv-screenings.processor';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { AiUsageLogsService } from '../ai-usage-logs/ai-usage-logs.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cv-screening',
      defaultJobOptions: { removeOnComplete: true },
    })
  ],
  controllers: [CvScreeningsController],
  providers: [
    CvScreeningsService,
    CvScreeningProcessor,
    GeminiService,
    AiUsageLogsService
  ],
  exports: [CvScreeningsService]
})
export class CvScreeningsModule implements OnModuleInit {
  constructor(@InjectQueue('cv-screening') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(15, 60000);
  }
}
