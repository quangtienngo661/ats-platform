import { RecruitersController } from './recruiters.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('RecruitersController', () => {
  it('delegates recruiter endpoints and reads req.user for me routes', async () => {
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

    await controller.create({ userId: 'user-2' } as any);
    await controller.getMe(req);
    await controller.updateMe(req, { position: 'Lead' } as any);
    await controller.findAll();
    await controller.findOne('rec-1');
    await controller.update('rec-1', { position: 'HR' } as any);
    await controller.remove('rec-1');

    expect(service.create).toHaveBeenCalledWith({ userId: 'user-2' });
    expect(service.getMe).toHaveBeenCalledWith('user-1');
    expect(service.updateMe).toHaveBeenCalledWith('user-1', { position: 'Lead' });
    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('rec-1');
    expect(service.update).toHaveBeenCalledWith('rec-1', { position: 'HR' });
    expect(service.remove).toHaveBeenCalledWith('rec-1');
  });
});
