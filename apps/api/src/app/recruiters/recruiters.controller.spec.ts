import { Test, TestingModule } from '@nestjs/testing';
import { RecuitersController } from './recuiters.controller';
import { RecuitersService } from './recuiters.service';

describe('RecuitersController', () => {
  let controller: RecuitersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecuitersController],
      providers: [RecuitersService],
    }).compile();

    controller = module.get<RecuitersController>(RecuitersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
