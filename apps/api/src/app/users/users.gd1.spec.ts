import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '@ats-platform/database';
import { UsersService } from './users.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn().mockReturnValue('hashed-new-password'),
  compareSync: jest.fn().mockReturnValue(true),
}));

// A8: mocked persistence pins invalidation/order. The live probe owns DB rollback
// and cascade behavior; this suite starts no services.
describe('GĐ1 A8 — User session invalidation', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let socket: { disconnectUser: jest.Mock };
  let service: UsersService;
  const account = {
    userId: 'org-admin-1',
    email: 'org-admin@test.local',
    fullName: 'Org Admin',
    role: UserRole.org_admin,
    status: UserStatus.active,
    organizationId: 'org-1',
    passwordHash: 'old-hash',
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    socket = { disconnectUser: jest.fn() };
    service = new UsersService(prisma as any, socket as any);
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    prisma.user.findUnique.mockResolvedValue(account);
    prisma.user.update.mockResolvedValue({ ...account });
    prisma.organization.findUnique.mockResolvedValue({ organizationId: 'org-2' });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-new-password');
  });

  it.each([
    ['organization', { organizationId: 'org-2' }],
    ['role', { role: UserRole.recruiter }],
    ['status', { status: UserStatus.inactive }],
    ['password', { password: 'new-password' }],
  ])('revokes refresh tokens and disconnects sockets after changing %s', async (_field, update) => {
    await service.update(account.userId, update);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: account.userId, revoked: false },
      data: { revoked: true },
    });
    expect(socket.disconnectUser).toHaveBeenCalledTimes(1);
    expect(socket.disconnectUser).toHaveBeenCalledWith(account.userId);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('disconnects only after the mutation and revocation transaction commits', async () => {
    const order: string[] = [];
    prisma.user.update.mockImplementation(async () => {
      order.push('write');
      return account;
    });
    prisma.refreshToken.updateMany.mockImplementation(async () => {
      order.push('revoke');
      return { count: 2 };
    });
    prisma.$transaction.mockImplementation(async (callback: any) => {
      const value = await callback(prisma);
      order.push('commit');
      return value;
    });
    socket.disconnectUser.mockImplementation(() => order.push('disconnect'));

    await service.update(account.userId, { organizationId: 'org-2' });

    expect(order).toEqual(['write', 'revoke', 'commit', 'disconnect']);
  });

  it.each([
    ['name', { fullName: 'Renamed' }],
    ['same organization', { organizationId: 'org-1' }],
    ['same role', { role: UserRole.org_admin }],
    ['same status', { status: UserStatus.active }],
  ])('keeps sessions after updating %s without changing authority', async (_field, update) => {
    await service.update(account.userId, update);

    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('does not disconnect or revoke when the User write fails', async () => {
    prisma.user.update.mockRejectedValue(new Error('write failed'));

    await expect(service.update(account.userId, { organizationId: 'org-2' }))
      .rejects.toThrow('write failed');
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('does not disconnect when revocation fails and the transaction rejects', async () => {
    prisma.refreshToken.updateMany.mockRejectedValue(new Error('revoke failed'));

    await expect(service.update(account.userId, { organizationId: 'org-2' }))
      .rejects.toThrow('revoke failed');
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('revokes sessions after a correct self-service password change', async () => {
    await service.changePassword(account.userId, {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(bcrypt.hashSync).toHaveBeenCalledWith('new-password', 10);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: account.userId, revoked: false },
      data: { revoked: true },
    });
    expect(socket.disconnectUser).toHaveBeenCalledWith(account.userId);
  });

  it('keeps sessions and rejects the wrong current password', async () => {
    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

    await expect(service.changePassword(account.userId, {
      currentPassword: 'wrong',
      newPassword: 'new-password',
    })).rejects.toThrow('Mật khẩu hiện tại không đúng');
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  describe('remove', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({
        _count: { applicationHistory: 0, scheduledBy: 0, interviewSchedules: 0 },
        candidate: null,
        recruiter: null,
      });
      prisma.user.delete.mockResolvedValue({ userId: account.userId });
    });

    it('disconnects a deleted User only after deletion succeeds', async () => {
      await expect(service.remove(account.userId)).resolves.toEqual({ userId: account.userId });
      expect(socket.disconnectUser).toHaveBeenCalledWith(account.userId);
      expect(prisma.user.delete.mock.invocationCallOrder[0])
        .toBeLessThan(socket.disconnectUser.mock.invocationCallOrder[0]);
    });

    it('does not disconnect if deletion fails', async () => {
      prisma.user.delete.mockRejectedValue(new Error('delete failed'));
      await expect(service.remove(account.userId)).rejects.toThrow('delete failed');
      expect(socket.disconnectUser).not.toHaveBeenCalled();
    });
  });
});
