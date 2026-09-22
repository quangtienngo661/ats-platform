import { UserRole } from '@ats-platform/database';
import { AiConfigController } from './ai-config.controller';
import { callerOf } from '../../test-utils/unit-test-helpers';

describe('AiConfigController', () => {
  const service = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setDefault: jest.fn(),
    remove: jest.fn(),
  });

  it('delegates CRUD and default operations to the service with the caller', () => {
    const aiConfigService = service();
    const controller = new AiConfigController(aiConfigService as any);
    const caller = callerOf(UserRole.org_admin);

    controller.create({ name: 'cfg' } as any, caller);
    controller.findAll(caller);
    controller.findOne('cfg-1', caller);
    controller.update('cfg-1', { name: 'updated' } as any, caller);
    controller.setDefault('cfg-1', caller);
    controller.remove('cfg-1', caller);

    expect(aiConfigService.create).toHaveBeenCalledWith({ name: 'cfg' }, caller);
    expect(aiConfigService.findAll).toHaveBeenCalledWith(caller);
    expect(aiConfigService.findOne).toHaveBeenCalledWith('cfg-1', caller);
    expect(aiConfigService.update).toHaveBeenCalledWith('cfg-1', { name: 'updated' }, caller);
    expect(aiConfigService.setDefault).toHaveBeenCalledWith('cfg-1', caller);
    expect(aiConfigService.remove).toHaveBeenCalledWith('cfg-1', caller);
  });
});
