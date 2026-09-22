import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { DepartmentsService } from './departments.service';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';

const body = {
  name: 'Engineering',
  description: 'Build team',
  color: '#123456',
};

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const orgAdmin = callerOf(UserRole.org_admin); // organization 'org-1'
  const recruiter = callerOf(UserRole.recruiter); // organization 'org-1'
  const platformAdmin = callerOf(UserRole.admin);

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DepartmentsService(prisma as any);
  });

  // Module spec criterion 7: who creates the department decides its organization.
  describe('create — criterion 7', () => {
    it.each([
      ['an org_admin', orgAdmin],
      ['a recruiter', recruiter],
    ])(
      'puts a department created by %s in its own organization',
      async (_who, caller) => {
        prisma.department.create.mockResolvedValue({ departmentId: 'dep-1' });

        await service.create(body, caller);

        expect(prisma.department.create).toHaveBeenCalledWith({
          data: { organizationId: 'org-1', ...body },
        });
      },
    );

    it('refuses an org_admin naming another organization, writing nothing', async () => {
      await expect(
        service.create({ ...body, organizationId: 'org-2' }, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.department.create).not.toHaveBeenCalled();
    });

    it('accepts an org_admin naming its own organization', async () => {
      prisma.department.create.mockResolvedValue({ departmentId: 'dep-1' });

      await service.create({ ...body, organizationId: 'org-1' }, orgAdmin);

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-1', ...body },
      });
    });

    it('requires a platform admin to name the organization explicitly', async () => {
      await expect(service.create(body, platformAdmin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.department.create).not.toHaveBeenCalled();
    });

    it('404s a platform admin naming an organization that does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...body, organizationId: 'org-ghost' }, platformAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.department.create).not.toHaveBeenCalled();
    });

    it("creates a platform admin's department in the organization it names", async () => {
      prisma.organization.findUnique.mockResolvedValue({
        organizationId: 'org-2',
      });
      prisma.department.create.mockResolvedValue({ departmentId: 'dep-9' });

      await service.create({ ...body, organizationId: 'org-2' }, platformAdmin);

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { organizationId: 'org-2', ...body },
      });
    });

    it('fails closed for a recruiter whose organization cannot be resolved (E2)', async () => {
      await expect(
        service.create(
          body,
          callerOf(UserRole.recruiter, { organizationId: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.department.create).not.toHaveBeenCalled();
    });
  });

  describe('reads are scoped (gap surface: department CRUD had no scoping)', () => {
    it("lists only the org_admin's organization", async () => {
      prisma.department.findMany.mockResolvedValue([]);

      await service.findAll(orgAdmin);

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } }),
      );
    });

    it('lists every organization for a platform admin (criterion 6a)', async () => {
      prisma.department.findMany.mockResolvedValue([]);

      await service.findAll(platformAdmin);

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it("reports another organization's department as not found (criterion 2)", async () => {
      prisma.department.findFirst.mockResolvedValue(null);

      await expect(service.findOne('dep-of-org-2', orgAdmin)).rejects.toThrow(
        'Không tìm thấy phòng ban',
      );
      expect(prisma.department.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { departmentId: 'dep-of-org-2', organizationId: 'org-1' },
        }),
      );
    });
  });

  it('updates only a department the caller can see', async () => {
    prisma.department.findFirst.mockResolvedValue({ departmentId: 'dep-1' });
    prisma.department.update.mockResolvedValue({
      departmentId: 'dep-1',
      name: 'HR',
    });

    await service.update('dep-1', { name: 'HR' }, orgAdmin);

    expect(prisma.department.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: 'dep-1' },
        data: expect.objectContaining({ name: 'HR' }),
      }),
    );
  });

  it("never updates another organization's department", async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.update('dep-of-org-2', { name: 'HR' }, orgAdmin),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.department.update).not.toHaveBeenCalled();
  });

  it('deletes an empty department', async () => {
    const department = {
      departmentId: 'dep-1',
      _count: { recruiters: 0, jobPostings: 0 },
    };
    prisma.department.findFirst.mockResolvedValue(department);
    prisma.department.delete.mockResolvedValue(department);

    await expect(service.remove('dep-1', orgAdmin)).resolves.toBe(department);
    expect(prisma.department.delete).toHaveBeenCalledWith({
      where: { departmentId: 'dep-1' },
    });
  });

  it('refuses to delete a department that still has recruiters', async () => {
    prisma.department.findFirst.mockResolvedValue({
      departmentId: 'dep-1',
      _count: { recruiters: 2, jobPostings: 0 },
    });

    await expect(service.remove('dep-1', orgAdmin)).rejects.toThrow(
      'nhà tuyển dụng',
    );
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete a department that still has job postings', async () => {
    prisma.department.findFirst.mockResolvedValue({
      departmentId: 'dep-1',
      _count: { recruiters: 0, jobPostings: 1 },
    });

    await expect(service.remove('dep-1', orgAdmin)).rejects.toThrow(
      'tin tuyển dụng',
    );
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });
});
