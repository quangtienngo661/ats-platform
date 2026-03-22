import { Test, TestingModule } from '@nestjs/testing';
import { AiConfigController } from './ai-config.controller';
import { AiConfigService } from './ai-config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiConfigController', () => {
  let controller: AiConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiConfigController],
      providers: [
        AiConfigService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AiConfigController>(AiConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
