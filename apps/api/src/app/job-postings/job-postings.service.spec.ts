import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingsService } from './job-postings.service';

describe('JobPostingsService', () => {
  let service: JobPostingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobPostingsService],
    }).compile();

    service = module.get<JobPostingsService>(JobPostingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
