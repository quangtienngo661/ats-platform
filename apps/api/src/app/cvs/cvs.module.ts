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

@Module({
  imports: [
    CandidatesModule,
    // TODO: Register CV Screening Queue and Mock Interview Queue (Need assessment first)
    BullModule.registerQueue({
      name: 'cv-processing',
      defaultJobOptions: { removeOnComplete: true },
    }),
    AiUsageLogsModule
  ],
  controllers: [CVsController],
  providers: [
    CvParsingProcessor, CVsService, PdfService, GeminiService, CvParsedDataService
  ],
  exports: [CVsService],
})
export class CVsModule implements OnModuleInit {
  constructor(@InjectQueue('cv-processing') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.setGlobalRateLimit(15, 60000);
  }
}
