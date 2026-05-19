import { AiConfigController } from './ai-config.controller';

describe('AiConfigController', () => {
  const service = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setDefault: jest.fn(),
    remove: jest.fn(),
  });

  it('delegates CRUD and default operations to the service', () => {
    const aiConfigService = service();
    const controller = new AiConfigController(aiConfigService as any);

    controller.create({ name: 'cfg' } as any);
    controller.findAll();
    controller.findOne('cfg-1');
    controller.update('cfg-1', { name: 'updated' } as any);
    controller.setDefault('cfg-1');
    controller.remove('cfg-1');

    expect(aiConfigService.create).toHaveBeenCalledWith({ name: 'cfg' });
    expect(aiConfigService.findAll).toHaveBeenCalled();
    expect(aiConfigService.findOne).toHaveBeenCalledWith('cfg-1');
    expect(aiConfigService.update).toHaveBeenCalledWith('cfg-1', { name: 'updated' });
    expect(aiConfigService.setDefault).toHaveBeenCalledWith('cfg-1');
    expect(aiConfigService.remove).toHaveBeenCalledWith('cfg-1');
  });
});
