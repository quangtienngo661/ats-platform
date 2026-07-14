import { Module, OnModuleInit } from '@nestjs/common';
import { CandidatesModule } from '../candidates/candidates.module';
import { CVsController } from './cvs.controller';
import { CVsService } from './cvs.service';
import { PdfService } from '../../common/pdf/pdf.service';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CvParsingProcessor } from './processors/cv-parsing.processor';
import { CvParsedDataService } from './cv-parsed-data/cv-parsed-data.service';
import { AiUsageLogsModule } from '../ai-usage-logs/ai-usage-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CandidatesModule,
    // No `defaultJobOptions` here on purpose — it would replace, not extend, the
    // global defaults in app.module.ts (attempts/backoff/removeOnComplete).
    BullModule.registerQueue({ name: 'cv-processing' }),
    AiUsageLogsModule,
    NotificationsModule,
  ],
  controllers: [CVsController],
  providers: [
    CvParsingProcessor,
    CVsService,
    PdfService,
    GeminiService,
    CvParsedDataService,
  ],
  exports: [CVsService],
})
export class CVsModule implements OnModuleInit {
  constructor(@InjectQueue('cv-processing') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(15, 60000);
  }
}
