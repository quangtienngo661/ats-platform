import { Test, TestingModule } from '@nestjs/testing';
import { AiUsageLogsService } from './ai-usage-logs.service';

describe('AiUsageLogsService', () => {
  let service: AiUsageLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiUsageLogsService],
    }).compile();

    service = module.get<AiUsageLogsService>(AiUsageLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
