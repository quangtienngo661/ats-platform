import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingSkillsController } from './job-posting-skills.controller';
import { JobPostingSkillsService } from './job-posting-skills.service';

describe('JobPostingSkillsController', () => {
  let controller: JobPostingSkillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobPostingSkillsController],
      providers: [JobPostingSkillsService],
    }).compile();

    controller = module.get<JobPostingSkillsController>(
      JobPostingSkillsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
