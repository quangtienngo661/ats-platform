import { Test, TestingModule } from '@nestjs/testing';
import { CvScreeningsService } from './cv-screenings.service';

describe('CvScreeningsService', () => {
  let service: CvScreeningsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CvScreeningsService],
    }).compile();

    service = module.get<CvScreeningsService>(CvScreeningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
