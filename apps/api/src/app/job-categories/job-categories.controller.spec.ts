import { Test, TestingModule } from '@nestjs/testing';
import { JobCategoriesController } from './job-categories.controller';
import { JobCategoriesService } from './job-categories.service';

describe('JobCategoriesController', () => {
  let controller: JobCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobCategoriesController],
      providers: [JobCategoriesService],
    }).compile();

    controller = module.get<JobCategoriesController>(JobCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
