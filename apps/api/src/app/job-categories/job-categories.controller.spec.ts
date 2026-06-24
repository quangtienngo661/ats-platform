import { JobCategoriesController } from './job-categories.controller';

describe('JobCategoriesController', () => {
  it('delegates category endpoints to the service', async () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new JobCategoriesController(service as any);

    await controller.create({ name: 'Backend' } as any);
    await controller.findAll();
    await controller.findOne('cat-1');
    await controller.update('cat-1', { name: 'Frontend' } as any);
    await controller.remove('cat-1');

    expect(service.create).toHaveBeenCalledWith({ name: 'Backend' });
    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('cat-1');
    expect(service.update).toHaveBeenCalledWith('cat-1', { name: 'Frontend' });
    expect(service.remove).toHaveBeenCalledWith('cat-1');
  });
});
