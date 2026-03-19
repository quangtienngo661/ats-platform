import { Test, TestingModule } from '@nestjs/testing';
import { JobCategoriesService } from './job-categories.service';

describe('JobCategoriesService', () => {
  let service: JobCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobCategoriesService],
    }).compile();

    service = module.get<JobCategoriesService>(JobCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
