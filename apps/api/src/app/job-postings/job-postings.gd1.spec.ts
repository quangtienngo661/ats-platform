import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobStatus, UserRole } from '@ats-platform/database';
import { JobPostingsService } from './job-postings.service';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('GĐ1 A5 — scoped job creation without a caller Recruiter profile', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: JobPostingsService;
  const owner = {
    recruiterId: 'rec-1',
    userId: 'recruiter-user-1',
    departmentId: 'dep-1',
    organizationId: 'org-1',
    user: { role: UserRole.recruiter, status: 'active' },
  };
  const dto = {
    title: 'Backend',
    description: 'Build the API',
    locationType: 'remote' as any,
    status: JobStatus.draft,
    createdBy: 'rec-1',
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    // Only a recruiterId lookup finds the owner. Looking up the org_admin's own
    // profile returns null: the success test cannot accidentally rely on one.
    prisma.recruiter.findUnique.mockImplementation(async ({ where }: any) =>
      where.recruiterId === owner.recruiterId ? owner : null);
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-1', organizationId: 'org-1',
    });
    prisma.jobPosting.create.mockResolvedValue({ jobId: 'job-1', organizationId: 'org-1' });
    prisma.jobPosting.findUnique.mockResolvedValue({ jobId: 'job-1', title: 'Backend' });
    service = new JobPostingsService(prisma as any,
      { create: jest.fn(), deleteByJobId: jest.fn() } as any,
      { parseJD: jest.fn() } as any);
  });

  it('lets an org_admin create for a recruiter owner in its organization', async () => {
    await expect(service.create(callerOf(UserRole.org_admin), dto))
      .resolves.toEqual({ jobId: 'job-1', title: 'Backend' });
    expect(prisma.jobPosting.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organization: { connect: { organizationId: 'org-1' } },
        department: { connect: { departmentId: 'dep-1' } },
        recruiter: { connect: { recruiterId: 'rec-1' } },
      }),
    }));
  });

  it('lets a platform admin create for an owner in any organization', async () => {
    await expect(service.create(callerOf(UserRole.admin), dto))
      .resolves.toEqual({ jobId: 'job-1', title: 'Backend' });
  });

  it('rejects a department differing from the selected recruiter owner', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(owner);
    await expect(service.create(callerOf(UserRole.org_admin), {
      ...dto, departmentId: 'dep-other',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('refuses an org_admin selecting an owner outside its organization', async () => {
    prisma.recruiter.findUnique.mockResolvedValue({
      ...owner, departmentId: 'dep-2', organizationId: 'org-2',
    });
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-2', organizationId: 'org-2',
    });
    await expect(service.create(callerOf(UserRole.org_admin), dto))
      .rejects.toThrow(new NotFoundException('Không tìm thấy nhà tuyển dụng'));
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('refuses a recruiter naming a different recruiter as owner', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(owner);
    await expect(service.create(callerOf(UserRole.recruiter, {
      userId: owner.userId,
    }), { ...dto, createdBy: 'rec-other' }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('requires a selected recruiter owner for admin without a profile', async () => {
    await expect(service.create(callerOf(UserRole.org_admin), {
      ...dto, createdBy: undefined,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('lets a recruiter create only for its own profile and department', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(owner);
    await expect(service.create(callerOf(UserRole.recruiter, {
      userId: owner.userId,
    }), { ...dto, createdBy: undefined }))
      .resolves.toEqual({ jobId: 'job-1', title: 'Backend' });
    expect(prisma.jobPosting.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        recruiter: { connect: { recruiterId: owner.recruiterId } },
        department: { connect: { departmentId: owner.departmentId } },
        organization: { connect: { organizationId: owner.organizationId } },
      }),
    }));
  });

  it.each([
    ['inactive recruiter', { ...owner.user, status: 'inactive' }],
    ['candidate-role owner', { ...owner.user, role: UserRole.candidate }],
  ])('refuses an %s as the selected owner', async (_label, user) => {
    prisma.recruiter.findUnique.mockResolvedValue({ ...owner, user });

    await expect(service.create(callerOf(UserRole.org_admin), dto))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('refuses inconsistent owner and department organization stamps', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(owner);
    prisma.department.findUnique.mockResolvedValue({
      departmentId: owner.departmentId, organizationId: 'org-2',
    });

    await expect(service.create(callerOf(UserRole.admin), dto))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });

  it('fails closed for a staff caller with no organization', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(owner);

    await expect(service.create(callerOf(UserRole.org_admin, {
      organizationId: null,
    }), dto)).rejects.toThrow(new NotFoundException('Không tìm thấy nhà tuyển dụng'));
    expect(prisma.jobPosting.create).not.toHaveBeenCalled();
  });
});
