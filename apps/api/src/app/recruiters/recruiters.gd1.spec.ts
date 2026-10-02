import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { RecruitersService } from './recruiters.service';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('GĐ1 A4/A8 — recruiter identity and authority', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let socket: { disconnectUser: jest.Mock };
  let service: RecruitersService;
  const admin = callerOf(UserRole.admin);
  const orgAdmin = callerOf(UserRole.org_admin);
  const profile = {
    recruiterId: 'rec-1',
    userId: 'recruiter-user-1',
    departmentId: 'dep-1',
    organizationId: 'org-1',
    _count: { jobPostings: 0 },
  };
  const dto = { userId: 'new-user', departmentId: 'dep-1', position: 'HR' };

  beforeEach(() => {
    prisma = createPrismaMock();
    socket = { disconnectUser: jest.fn() };
    service = new RecruitersService(prisma as any, socket as any);
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    prisma.user.findUnique.mockResolvedValue({ userId: 'new-user', role: UserRole.recruiter });
    prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-1' });
    prisma.recruiter.findUnique.mockResolvedValue(null);
    prisma.recruiter.create.mockResolvedValue({ recruiterId: 'rec-new' });
    prisma.recruiter.findFirst.mockResolvedValue(profile);
    prisma.recruiter.update.mockResolvedValue(profile);
    prisma.recruiter.delete.mockResolvedValue(profile);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
  });

  it('refuses org_admin attaching an arbitrary existing global User', async () => {
    await expect(service.create(dto, orgAdmin)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.recruiter.create).not.toHaveBeenCalled();
  });

  it.each([UserRole.candidate, UserRole.admin, UserRole.org_admin])(
    'refuses a platform admin attaching a User with role %s',
    async (role) => {
      prisma.user.findUnique.mockResolvedValue({ userId: 'new-user', role });
      await expect(service.create(dto, admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.recruiter.create).not.toHaveBeenCalled();
    },
  );

  it('does not let PATCH change the owner of a recruiter profile', async () => {
    await expect(service.update('rec-1', { userId: 'new-user' }, admin))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.recruiter.update).not.toHaveBeenCalled();
  });

  it('refuses a department move when the recruiter owns a job posting', async () => {
    prisma.recruiter.findFirst.mockResolvedValue({ ...profile, _count: { jobPostings: 1 } });
    await expect(service.update('rec-1', { departmentId: 'dep-2' }, orgAdmin))
      .rejects.toThrow('tin tuyển dụng');
    expect(prisma.recruiter.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('revokes refresh tokens and socket rights after a department move', async () => {
    await service.update('rec-1', { departmentId: 'dep-2' }, orgAdmin);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: profile.userId, revoked: false },
      data: { revoked: true },
    });
    expect(socket.disconnectUser).toHaveBeenCalledWith(profile.userId);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['same department', { departmentId: 'dep-1' }],
    ['position', { position: 'Lead' }],
  ])('keeps sessions when updating %s without changing scope', async (_field, update) => {
    await service.update('rec-1', update, orgAdmin);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('does not invalidate sessions if a department move fails to persist', async () => {
    prisma.recruiter.update.mockRejectedValue(new Error('move failed'));
    await expect(service.update('rec-1', { departmentId: 'dep-2' }, orgAdmin))
      .rejects.toThrow('move failed');
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });

  it('revokes sessions and disconnects when a profile with no jobs is removed', async () => {
    await service.remove('rec-1', orgAdmin);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: profile.userId, revoked: false },
      data: { revoked: true },
    });
    expect(socket.disconnectUser).toHaveBeenCalledWith(profile.userId);
  });

  it('does not disconnect when profile deletion fails', async () => {
    prisma.recruiter.delete.mockRejectedValue(new Error('delete failed'));
    await expect(service.remove('rec-1', orgAdmin)).rejects.toThrow('delete failed');
    expect(socket.disconnectUser).not.toHaveBeenCalled();
  });
});
