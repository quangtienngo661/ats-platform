import { NotificationType, RelatedEntityType } from '@ats-platform/database';
import { NotificationsService } from './notifications.service';
import { createPrismaMock, createSocketMock } from '../../test-utils/unit-test-helpers';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let socket: ReturnType<typeof createSocketMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    socket = createSocketMock();
    service = new NotificationsService(prisma as any, socket as any);
  });

  it('creates and emits a notification to the user room', async () => {
    const notification = { notificationId: 'n-1', userId: 'user-1' };
    prisma.notification.create.mockResolvedValue(notification);

    await service.create({
      userId: 'user-1',
      type: NotificationType.application,
      title: 'Title',
      message: 'Message',
      relatedEntityId: 'app-1',
      relatedEntityType: RelatedEntityType.application,
    });

    expect(socket.handleEmit).toHaveBeenCalledWith('notification:new', notification, 'user_user-1');
  });

  it('returns paginated notifications with read filter', async () => {
    prisma.notification.findMany.mockResolvedValue([{ notificationId: 'n-1' }]);
    prisma.notification.count.mockResolvedValue(1);

    await expect(service.findAll('user-1', { page: 2, limit: 5, isRead: false })).resolves.toEqual({
      items: [{ notificationId: 'n-1' }],
      pagination: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', isRead: false },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('marks only owned notifications as read', async () => {
    prisma.notification.findUnique.mockResolvedValue({ notificationId: 'n-1', userId: 'other' });

    await expect(service.markAsRead('n-1', 'user-1')).rejects.toThrow('th');

    prisma.notification.findUnique.mockResolvedValue({ notificationId: 'n-1', userId: 'user-1' });
    prisma.notification.update.mockResolvedValue({ notificationId: 'n-1', isRead: true });

    await expect(service.markAsRead('n-1', 'user-1')).resolves.toEqual({
      notificationId: 'n-1',
      isRead: true,
    });
  });

  it('marks all unread notifications and deletes an owned notification', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });
    await expect(service.markAllAsRead('user-1')).resolves.toEqual({ updatedCount: 3 });

    prisma.notification.findUnique.mockResolvedValue({ notificationId: 'n-1', userId: 'user-1' });
    prisma.notification.delete.mockResolvedValue({ notificationId: 'n-1' });

    await expect(service.remove('n-1', 'user-1')).resolves.toEqual({ notificationId: 'n-1' });
  });
});
