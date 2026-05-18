import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { AiUsageLogsModule } from '../ai-usage-logs/ai-usage-logs.module';

@Module({
  imports: [AiUsageLogsModule],
  controllers: [JobPostingsController],
  providers: [JobPostingsService, JobPostingSkillsService, GeminiService],
})
export class JobPostingsModule {}
