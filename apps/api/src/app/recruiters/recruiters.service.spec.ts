import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { RecruitersService } from './recruiters.service';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('RecruitersService', () => {
  let service: RecruitersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const orgAdmin = callerOf(UserRole.org_admin); // organization 'org-1'
  const recruiter = callerOf(UserRole.recruiter); // organization 'org-1'
  const platformAdmin = callerOf(UserRole.admin);

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RecruitersService(prisma as any);
  });

  describe('create', () => {
    it('stamps the recruiter with its department\'s organization', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 'user-2' });
      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      prisma.recruiter.findUnique.mockResolvedValue(null);
      prisma.recruiter.create.mockResolvedValue({ recruiterId: 'rec-1' });

      await service.create(
        { userId: 'user-2', departmentId: 'dep-1', position: 'HR' },
        orgAdmin,
      );

      // Asserted field by field: toEqual treats an `undefined` organizationId as
      // absent, which is how a missing stamp once passed this test unnoticed.
      const { data } = prisma.recruiter.create.mock.calls[0][0];
      expect(data.organizationId).toBe('org-1');
      expect(data).toMatchObject({ userId: 'user-2', departmentId: 'dep-1', position: 'HR' });
    });

    it('refuses an org_admin placing a recruiter in another organization\'s department', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 'user-2' });
      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-2' });

      await expect(
        service.create({ userId: 'user-2', departmentId: 'dep-of-org-2', position: 'HR' }, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.recruiter.create).not.toHaveBeenCalled();
    });

    it('lets a platform admin place a recruiter in any organization\'s department', async () => {
      prisma.user.findUnique.mockResolvedValue({ userId: 'user-2' });
      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-2' });
      prisma.recruiter.findUnique.mockResolvedValue(null);
      prisma.recruiter.create.mockResolvedValue({ recruiterId: 'rec-9' });

      await service.create(
        { userId: 'user-2', departmentId: 'dep-of-org-2', position: 'HR' },
        platformAdmin,
      );

      expect(prisma.recruiter.create.mock.calls[0][0].data.organizationId).toBe('org-2');
    });

    it('rejects missing user, missing department, and duplicate profile', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ userId: 'missing', departmentId: 'dep-1', position: 'HR' }, orgAdmin),
      ).rejects.toThrow('người dùng');

      prisma.user.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.department.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ userId: 'user-1', departmentId: 'missing', position: 'HR' }, orgAdmin),
      ).rejects.toThrow('phòng ban');

      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-1' });
      prisma.recruiter.findUnique.mockResolvedValue({ recruiterId: 'rec-1' });
      await expect(
        service.create({ userId: 'user-1', departmentId: 'dep-1', position: 'HR' }, orgAdmin),
      ).rejects.toThrow('đã tồn tại');
    });
  });

  it('gets and updates the current recruiter profile by user id', async () => {
    prisma.recruiter.findUnique.mockResolvedValue({ recruiterId: 'rec-1' });
    prisma.recruiter.update.mockResolvedValue({ recruiterId: 'rec-1', position: 'Lead' });

    await expect(service.getMe('user-1')).resolves.toEqual({ recruiterId: 'rec-1' });
    await expect(service.updateMe('user-1', { position: 'Lead' })).resolves.toEqual({
      recruiterId: 'rec-1',
      position: 'Lead',
    });
  });

  // Gap surface: the recruiters directory listed every recruiter of every
  // department to any recruiter.
  describe('directory is scoped to the caller\'s organization', () => {
    it('lists only the recruiter\'s organization', async () => {
      prisma.recruiter.findMany.mockResolvedValue([]);

      await service.findAll(recruiter);

      expect(prisma.recruiter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } }),
      );
    });

    it('lists every organization for a platform admin (criterion 6a)', async () => {
      prisma.recruiter.findMany.mockResolvedValue([]);

      await service.findAll(platformAdmin);

      expect(prisma.recruiter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('reports another organization\'s recruiter as not found (E1)', async () => {
      prisma.recruiter.findFirst.mockResolvedValue(null);

      await expect(service.findOne('rec-of-org-2', recruiter)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.recruiter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recruiterId: 'rec-of-org-2', organizationId: 'org-1' },
        }),
      );
    });

    it('fails closed for a recruiter with no resolvable organization (E2)', async () => {
      await expect(
        service.findAll(callerOf(UserRole.recruiter, { organizationId: null })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.recruiter.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    // A recruiter moved to another department used to keep its old organizationId:
    // the DTO was written verbatim, and the denormalised column never followed.
    it('moves the organization together with the department', async () => {
      prisma.recruiter.findFirst.mockResolvedValue({ recruiterId: 'rec-1' });
      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-2' });
      prisma.recruiter.update.mockResolvedValue({ recruiterId: 'rec-1' });

      await service.update('rec-1', { departmentId: 'dep-of-org-2' }, platformAdmin);

      expect(prisma.recruiter.update.mock.calls[0][0].data).toMatchObject({
        departmentId: 'dep-of-org-2',
        organizationId: 'org-2',
      });
    });

    it('leaves the organization alone when the department is unchanged', async () => {
      prisma.recruiter.findFirst.mockResolvedValue({ recruiterId: 'rec-1' });
      prisma.recruiter.update.mockResolvedValue({ recruiterId: 'rec-1' });

      await service.update('rec-1', { position: 'Lead' }, orgAdmin);

      expect(prisma.recruiter.update.mock.calls[0][0].data.organizationId).toBeUndefined();
      expect(prisma.department.findUnique).not.toHaveBeenCalled();
    });

    it('refuses an org_admin moving a recruiter into another organization', async () => {
      prisma.recruiter.findFirst.mockResolvedValue({ recruiterId: 'rec-1' });
      prisma.department.findUnique.mockResolvedValue({ organizationId: 'org-2' });

      await expect(
        service.update('rec-1', { departmentId: 'dep-of-org-2' }, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.recruiter.update).not.toHaveBeenCalled();
    });
  });

  it('throws for a recruiter the caller cannot see, on update and remove', async () => {
    prisma.recruiter.findFirst.mockResolvedValue(null);

    await expect(service.update('missing', { position: 'HR' }, orgAdmin)).rejects.toThrow(
      'Không tìm thấy nhà tuyển dụng',
    );
    await expect(service.remove('missing', orgAdmin)).rejects.toThrow(
      'Không tìm thấy nhà tuyển dụng',
    );
    expect(prisma.recruiter.update).not.toHaveBeenCalled();
    expect(prisma.recruiter.delete).not.toHaveBeenCalled();
  });
});
