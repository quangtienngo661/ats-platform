import { Test, TestingModule } from '@nestjs/testing';
import { RecuitersService } from './recuiters.service';

describe('RecuitersService', () => {
  let service: RecuitersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecuitersService],
    }).compile();

    service = module.get<RecuitersService>(RecuitersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
