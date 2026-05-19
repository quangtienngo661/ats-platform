import { NotificationsController } from './notifications.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('NotificationsController', () => {
  it('passes current user id to notification service methods', () => {
    const service = {
      findAll: jest.fn(),
      getUnreadCount: jest.fn(),
      markAllAsRead: jest.fn(),
      markAsRead: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new NotificationsController(service as any);
    const req = mockRequest({ userId: 'user-1' });

    controller.findAll(req, { isRead: false } as any);
    controller.getUnreadCount(req);
    controller.markAllAsRead(req);
    controller.markAsRead('n-1', req);
    controller.remove('n-1', req);

    expect(service.findAll).toHaveBeenCalledWith('user-1', { isRead: false });
    expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
    expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
    expect(service.markAsRead).toHaveBeenCalledWith('n-1', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('n-1', 'user-1');
  });
});
