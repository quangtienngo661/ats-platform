import { Module } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';
import { CvScreeningsController } from './cv-screenings.controller';
import { CvScreeningProcessor } from './processors/cv-screenings.processor';
import { BullModule } from '@nestjs/bullmq';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { AiUsageLogsService } from '../ai-usage-logs/ai-usage-logs.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cv-screening',
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
export class CvScreeningsModule { }
