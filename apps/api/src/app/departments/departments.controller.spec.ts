import { DepartmentsController } from './departments.controller';

describe('DepartmentsController', () => {
  it('delegates department endpoints to the service', async () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new DepartmentsController(service as any);

    await controller.create({ name: 'Engineering' } as any);
    await controller.findAll();
    await controller.findOne('dep-1');
    await controller.update('dep-1', { name: 'HR' } as any);
    await controller.remove('dep-1');

    expect(service.create).toHaveBeenCalledWith({ name: 'Engineering' });
    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('dep-1');
    expect(service.update).toHaveBeenCalledWith('dep-1', { name: 'HR' });
    expect(service.remove).toHaveBeenCalledWith('dep-1');
  });
});
