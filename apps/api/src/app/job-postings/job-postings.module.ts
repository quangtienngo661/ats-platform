import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';

@Module({
  controllers: [JobPostingsController],
  providers: [JobPostingsService, JobPostingSkillsService],
})
export class JobPostingsModule {}
