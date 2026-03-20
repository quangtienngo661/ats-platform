import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingSkillsService } from './job-posting-skills.service';

describe('JobPostingSkillsService', () => {
  let service: JobPostingSkillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobPostingSkillsService],
    }).compile();

    service = module.get<JobPostingSkillsService>(JobPostingSkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
