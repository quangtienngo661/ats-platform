import { UsersController } from './users.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('UsersController', () => {
  it('delegates user endpoints and reads current user id', async () => {
    const service = {
      findOne: jest.fn(),
      updateMe: jest.fn(),
      changePassword: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new UsersController(service as any);
    const req = mockRequest({ userId: 'user-1' });

    await controller.getMe(req);
    await controller.updateMe(req, { fullName: 'Alice' } as any);
    await controller.changePassword(req, { currentPassword: 'old', newPassword: 'new' } as any);
    await controller.create({ email: 'a@test.com' } as any);
    await controller.findAll();
    await controller.findOne('user-2');
    await controller.update('user-2', { fullName: 'Bob' } as any);
    await controller.remove('user-2');

    expect(service.findOne).toHaveBeenCalledWith('user-1');
    expect(service.updateMe).toHaveBeenCalledWith('user-1', { fullName: 'Alice' });
    expect(service.changePassword).toHaveBeenCalledWith('user-1', { currentPassword: 'old', newPassword: 'new' });
    expect(service.create).toHaveBeenCalledWith({ email: 'a@test.com' });
    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('user-2');
    expect(service.update).toHaveBeenCalledWith('user-2', { fullName: 'Bob' });
    expect(service.remove).toHaveBeenCalledWith('user-2');
  });
});
