import { UserRole } from '@ats-platform/database';
import { RecruitersController } from './recruiters.controller';
import { callerOf, mockRequest } from '../../test-utils/unit-test-helpers';

describe('RecruitersController', () => {
  it('delegates recruiter endpoints with the caller, and reads req.user for me routes', async () => {
    const service = {
      create: jest.fn(),
      getMe: jest.fn(),
      updateMe: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new RecruitersController(service as any);
    const req = mockRequest({ userId: 'user-1' });
    const caller = callerOf(UserRole.org_admin);

    await controller.create({ userId: 'user-2' } as any, caller);
    await controller.getMe(req);
    await controller.updateMe(req, { position: 'Lead' } as any);
    await controller.findAll(caller);
    await controller.findOne('rec-1', caller);
    await controller.update('rec-1', { position: 'HR' } as any, caller);
    await controller.remove('rec-1', caller);

    expect(service.create).toHaveBeenCalledWith({ userId: 'user-2' }, caller);
    expect(service.getMe).toHaveBeenCalledWith('user-1');
    expect(service.updateMe).toHaveBeenCalledWith('user-1', { position: 'Lead' });
    expect(service.findAll).toHaveBeenCalledWith(caller);
    expect(service.findOne).toHaveBeenCalledWith('rec-1', caller);
    expect(service.update).toHaveBeenCalledWith('rec-1', { position: 'HR' }, caller);
    expect(service.remove).toHaveBeenCalledWith('rec-1', caller);
  });
});
