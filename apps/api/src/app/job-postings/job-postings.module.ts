import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';
import { LlmModule } from '../../common/external-apis/llm/llm.module';
import { AiUsageLogsModule } from '../ai-usage-logs/ai-usage-logs.module';

@Module({
  imports: [AiUsageLogsModule, LlmModule],
  controllers: [JobPostingsController],
  providers: [JobPostingsService, JobPostingSkillsService],
})
export class JobPostingsModule {}
