import { Module } from '@nestjs/common';
import { JobPostingSkillsService } from './job-posting-skills.service';
import { JobPostingSkillsController } from './job-posting-skills.controller';

@Module({
  controllers: [JobPostingSkillsController],
  providers: [JobPostingSkillsService],
})
export class JobPostingSkillsModule {}
