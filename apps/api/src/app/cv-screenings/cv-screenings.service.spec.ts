import { Test, TestingModule } from '@nestjs/testing';
import { CvScreeningsService } from './cv-screenings.service';
import { getQueueToken } from '@nestjs/bullmq';
import { AiRecommendation } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CvScreeningsService', () => {
  let service: CvScreeningsService;
  const screeningQueueMock = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvScreeningsService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: getQueueToken('cv-screening'),
          useValue: screeningQueueMock,
        },
      ],
    }).compile();

    service = module.get<CvScreeningsService>(CvScreeningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('determineRecommendation', () => {
    it('uses 0-100 threshold values', () => {
      expect(service.determineRecommendation(80, 60)).toBe(AiRecommendation.hire);
      expect(service.determineRecommendation(60, 60)).toBe(AiRecommendation.interview);
      expect(service.determineRecommendation(59.9, 60)).toBe(AiRecommendation.reject);
    });

    it('normalizes legacy fractional threshold values', () => {
      expect(service.determineRecommendation(80, 0.6)).toBe(AiRecommendation.hire);
      expect(service.determineRecommendation(60, 0.6)).toBe(AiRecommendation.interview);
      expect(service.determineRecommendation(59.9, 0.6)).toBe(AiRecommendation.reject);
    });
  });
});
