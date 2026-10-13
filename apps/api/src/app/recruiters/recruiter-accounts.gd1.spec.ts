import * as bcrypt from 'bcrypt';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@ats-platform/database';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('account-password-hash'),
}));

// A4: identity creation is a single transaction. Rollback persistence and real
// route authorization also have a browser/API probe; this file requires no DB.
describe('GĐ1 A4 — organization-owned recruiter accounts', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: RecruitersService;
  const orgAdmin = callerOf(UserRole.org_admin);
  const dto = {
    fullName: 'New Recruiter',
    email: 'recruiter@test.local',
    password: 'Recruiter@123',
    departmentId: 'dep-1',
    position: 'HR',
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RecruitersService(prisma as any, { disconnectUser: jest.fn() } as any);
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-1', organizationId: 'org-1',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ userId: 'new-user' });
    prisma.recruiter.create.mockResolvedValue({
      recruiterId: 'rec-1', organizationId: 'org-1',
      user: { userId: 'new-user', email: dto.email, fullName: dto.fullName },
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('account-password-hash');
  });

  it('blocks org_admin on the existing-User assignment route through RolesGuard', () => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => RecruitersController.prototype.create,
      getClass: () => RecruitersController,
      switchToHttp: () => ({ getRequest: () => ({ user: orgAdmin }) }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('creates a hashed recruiter User and the scoped profile in one transaction', async () => {
    const result = await service.createAccount(dto, orgAdmin);

    expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: 'account-password-hash',
        role: UserRole.recruiter,
        status: UserStatus.active,
        emailVerified: true,
      }),
    }));
    const userData = prisma.user.create.mock.calls[0][0].data;
    expect(userData.organizationId ?? null).toBeNull();
    expect(prisma.recruiter.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'new-user', departmentId: 'dep-1',
        organizationId: 'org-1', position: 'HR',
      }),
      include: expect.objectContaining({
        user: { omit: { passwordHash: true } },
      }),
    }));
    expect(result).toEqual({
      recruiterId: 'rec-1', organizationId: 'org-1',
      user: { userId: 'new-user', email: dto.email, fullName: dto.fullName },
    });
  });

  it('rejects a duplicate email before either row is written', async () => {
    prisma.user.findUnique.mockResolvedValue({ userId: 'other-user' });

    await expect(service.createAccount(dto, orgAdmin))
      .rejects.toThrow('Email');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.recruiter.create).not.toHaveBeenCalled();
  });

  it('refuses a department outside org_admin scope before creating an account', async () => {
    prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-2' });

    await expect(service.createAccount(dto, orgAdmin))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.recruiter.create).not.toHaveBeenCalled();
  });

  it('404s a missing department before creating an account', async () => {
    prisma.department.findUnique.mockResolvedValue(null);

    await expect(service.createAccount(dto, orgAdmin))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.recruiter.create).not.toHaveBeenCalled();
  });

  it('reports a concurrent unique-email violation as a readable BadRequest', async () => {
    prisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.createAccount(dto, orgAdmin))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.recruiter.create).not.toHaveBeenCalled();
  });

  it('rejects the transaction when profile persistence fails', async () => {
    prisma.recruiter.create.mockRejectedValue(new Error('profile write failed'));

    await expect(service.createAccount(dto, orgAdmin))
      .rejects.toThrow('profile write failed');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
