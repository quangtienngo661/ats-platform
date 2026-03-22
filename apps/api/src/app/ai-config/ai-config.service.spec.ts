import { Test, TestingModule } from '@nestjs/testing';
import { AiConfigService } from './ai-config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiConfigService', () => {
  let service: AiConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiConfigService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AiConfigService>(AiConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
