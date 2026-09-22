import { UserRole } from '@ats-platform/database';
import { DepartmentsController } from './departments.controller';
import { callerOf } from '../../test-utils/unit-test-helpers';

describe('DepartmentsController', () => {
  it('delegates department endpoints to the service with the caller', async () => {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new DepartmentsController(service as any);
    const caller = callerOf(UserRole.org_admin);

    await controller.create({ name: 'Engineering' } as any, caller);
    await controller.findAll(caller);
    await controller.findOne('dep-1', caller);
    await controller.update('dep-1', { name: 'HR' } as any, caller);
    await controller.remove('dep-1', caller);

    expect(service.create).toHaveBeenCalledWith(
      { name: 'Engineering' },
      caller,
    );
    expect(service.findAll).toHaveBeenCalledWith(caller);
    expect(service.findOne).toHaveBeenCalledWith('dep-1', caller);
    expect(service.update).toHaveBeenCalledWith(
      'dep-1',
      { name: 'HR' },
      caller,
    );
    expect(service.remove).toHaveBeenCalledWith('dep-1', caller);
  });
});
