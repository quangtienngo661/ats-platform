import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

describe('CandidatesController', () => {
  let controller: CandidatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidatesController>(CandidatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
