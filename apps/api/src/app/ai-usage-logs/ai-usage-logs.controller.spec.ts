import { Test, TestingModule } from '@nestjs/testing';
import { AiUsageLogsController } from './ai-usage-logs.controller';
import { AiUsageLogsService } from './ai-usage-logs.service';

describe('AiUsageLogsController', () => {
  let controller: AiUsageLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiUsageLogsController],
      providers: [AiUsageLogsService],
    }).compile();

    controller = module.get<AiUsageLogsController>(AiUsageLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
