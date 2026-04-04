import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';
import { BullModule } from '@nestjs/bullmq';
import { JDProcessingProcessor } from './processors/jd-parsing.processor';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { AiUsageLogsModule } from '../ai-usage-logs/ai-usage-logs.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'jd-parsing',
    }),
    AiUsageLogsModule
  ],
  controllers: [JobPostingsController],
  providers: [JobPostingsService, JobPostingSkillsService, JDProcessingProcessor, GeminiService],
})
export class JobPostingsModule { }
