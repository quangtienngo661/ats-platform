import { Test, TestingModule } from '@nestjs/testing';
import { CvScreeningsController } from './cv-screenings.controller';
import { CvScreeningsService } from './cv-screenings.service';

describe('CvScreeningsController', () => {
  let controller: CvScreeningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvScreeningsController],
      providers: [CvScreeningsService],
    }).compile();

    controller = module.get<CvScreeningsController>(CvScreeningsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
