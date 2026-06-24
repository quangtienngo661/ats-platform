import { SkillsController } from './skills.controller';

describe('SkillsController', () => {
  it('delegates skill endpoints to the service', async () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new SkillsController(service as any);

    await controller.create({ name: 'NestJS' } as any);
    await controller.findAll();
    await controller.search('nest', 'backend');
    await controller.findOne('skill-1');
    await controller.update('skill-1', { name: 'React' } as any);
    await controller.remove('skill-1');

    expect(service.create).toHaveBeenCalledWith({ name: 'NestJS' });
    expect(service.findAll).toHaveBeenCalled();
    expect(service.search).toHaveBeenCalledWith('nest', 'backend');
    expect(service.findOne).toHaveBeenCalledWith('skill-1');
    expect(service.update).toHaveBeenCalledWith('skill-1', { name: 'React' });
    expect(service.remove).toHaveBeenCalledWith('skill-1');
  });
});
