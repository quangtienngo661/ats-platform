import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStatus, UserRole } from '@ats-platform/database';
import { JobPostingsService } from './job-postings.service';
import {
  callerOf,
  createPrismaMock,
  createPrismaTransactionMock,
} from '../../test-utils/unit-test-helpers';

describe('JobPostingsService', () => {
  let service: JobPostingsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jobPostingSkillsService: { create: jest.Mock; deleteByJobId: jest.Mock };
  let geminiService: { parseJD: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    jobPostingSkillsService = { create: jest.fn(), deleteByJobId: jest.fn() };
    geminiService = { parseJD: jest.fn() };
    service = new JobPostingsService(
      prisma as any,
      jobPostingSkillsService as any,
      geminiService as any,
    );
  });

  it('rejects blank JD previews and delegates valid JD parsing to Gemini', async () => {
    await expect(service.parseJdPreview('   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    geminiService.parseJD.mockResolvedValue({ title: 'Backend' });
    await expect(
      service.parseJdPreview('Need NestJS developer'),
    ).resolves.toEqual({ title: 'Backend' });
    expect(geminiService.parseJD).toHaveBeenCalledWith(
      expect.stringMatching(/^jd-preview-/),
      'Need NestJS developer',
    );
  });

  it('creates an active job posting and skill rows in one transaction', async () => {
    const tx = createPrismaTransactionMock();
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
    });
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-1',
      organizationId: 'org-1',
    });
    tx.jobPosting.create.mockResolvedValue({
      jobId: 'job-1',
      organizationId: 'org-1',
    });
    tx.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      title: 'Backend',
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(
      service.create('user-1', {
        title: 'Backend',
        locationType: 'remote' as any,
        salaryMin: 1000,
        salaryMax: 2000,
        description: 'JD',
        status: JobStatus.active,
        categoryId: 'cat-1',
        parsedRequirements: '{"skills":["nestjs"]}',
        skills: [{ skillId: 'skill-1', isRequired: true }],
      } as any),
    ).resolves.toEqual({ jobId: 'job-1', title: 'Backend' });

    expect(tx.jobPosting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parsedRequirements: { skills: ['nestjs'] },
          publishedAt: expect.any(Date),
          // The posting is tied to the organization owning the recruiter's department.
          organization: { connect: { organizationId: 'org-1' } },
        }),
      }),
    );
    expect(jobPostingSkillsService.create).toHaveBeenCalledWith(
      'job-1',
      'org-1',
      [{ skillId: 'skill-1', isRequired: true }],
      tx,
    );
  });

  it('validates create relations and salary range', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue(null);
    await expect(
      service.create('user-1', { categoryId: 'missing' } as any),
    ).rejects.toThrow('danh');

    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
    });
    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    await expect(
      service.create('user-1', { salaryMin: 2000, salaryMax: 1000 } as any),
    ).rejects.toThrow('l');
  });

  it('returns paginated filtered job postings', async () => {
    prisma.jobPosting.findMany.mockResolvedValue([{ jobId: 'job-1' }]);
    prisma.jobPosting.count.mockResolvedValue(1);

    await expect(
      service.findAll({
        page: 2,
        limit: 5,
        search: 'backend',
        status: JobStatus.active,
      }),
    ).resolves.toEqual({
      items: [{ jobId: 'job-1' }],
      pagination: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });

    expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: expect.objectContaining({ status: JobStatus.active }),
      }),
    );
  });

  it('updates relations, parsed requirements, and replaces skills when provided', async () => {
    const tx = createPrismaTransactionMock();
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      salaryMin: 1000,
      salaryMax: 3000,
      departmentId: 'dep-1',
      organizationId: 'org-1',
    });
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.recruiter.findUnique.mockResolvedValue({
      departmentId: 'dep-1',
      organizationId: 'org-1',
    });
    tx.jobPosting.update.mockResolvedValue({ jobId: 'job-1' });
    tx.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      title: 'Updated',
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.update('job-1', {
      categoryId: 'cat-1',
      createdBy: 'rec-1',
      parsedRequirements: { skills: ['react'] },
      skills: [],
    } as any);

    expect(jobPostingSkillsService.deleteByJobId).toHaveBeenCalledWith(
      'job-1',
      tx,
    );
    expect(tx.jobPosting.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parsedRequirements: { skills: ['react'] },
          category: { connect: { categoryId: 'cat-1' } },
        }),
      }),
    );
  });

  it('rejects invalid parsed requirements JSON', async () => {
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
    });
    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });

    await expect(
      service.create('user-1', { parsedRequirements: '[1,2]' } as any),
    ).rejects.toThrow('JSON');
  });

  it.each([
    ['an anonymous visitor', undefined],
    ['a candidate', callerOf(UserRole.candidate)],
  ])(
    'forces active-only listing for %s, ignoring a draft status filter',
    async (_who, viewer) => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ status: JobStatus.draft } as any, viewer);

      // The shared job board: published postings from EVERY organization.
      expect(
        prisma.jobPosting.findMany.mock.calls[0][0].where.organizationId,
      ).toBeUndefined();

      expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: JobStatus.active }),
        }),
      );
    },
  );

  // Gap surface: staff used to browse every department's drafts — every
  // organization's, once organizations exist.
  it.each([
    ['a recruiter', UserRole.recruiter],
    ['an org_admin', UserRole.org_admin],
  ])(
    'honours the status filter for %s, inside its organization only',
    async (_who, role) => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ status: JobStatus.draft } as any, callerOf(role));

      expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: JobStatus.draft,
            organizationId: 'org-1',
          }),
        }),
      );
    },
  );

  it("lists every organization's postings, any status, for a platform admin (6a)", async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.findAll(
      { status: JobStatus.draft } as any,
      callerOf(UserRole.admin),
    );

    const { where } = prisma.jobPosting.findMany.mock.calls[0][0];
    expect(where.status).toBe(JobStatus.draft);
    expect(where.organizationId).toBeUndefined();
  });

  it('hides an unpublished posting from a non-staff caller behind the same 404', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      organizationId: 'org-1',
      status: JobStatus.draft,
    });

    await expect(service.findOne('job-1')).rejects.toThrow(
      'Không tìm thấy tin tuyển dụng',
    );
    await expect(
      service.findOne('job-1', callerOf(UserRole.recruiter)),
    ).resolves.toEqual(expect.objectContaining({ jobId: 'job-1' }));
  });

  // Criterion 2 — and the same 404 as a missing posting, even when it is active.
  it("hides another organization's posting from staff behind the same 404", async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-2',
      organizationId: 'org-2',
      status: JobStatus.active,
    });

    await expect(
      service.findOne('job-2', callerOf(UserRole.recruiter)),
    ).rejects.toThrow('Không tìm thấy tin tuyển dụng');
    await expect(
      service.findOne('job-2', callerOf(UserRole.org_admin)),
    ).rejects.toThrow('Không tìm thấy tin tuyển dụng');
    // ...while the public still sees it on the shared job board.
    await expect(service.findOne('job-2')).resolves.toEqual(
      expect.objectContaining({ jobId: 'job-2' }),
    );
    await expect(
      service.findOne('job-2', callerOf(UserRole.admin)),
    ).resolves.toEqual(expect.objectContaining({ jobId: 'job-2' }));
  });

  it('fails closed for staff with no organization (E2)', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      organizationId: 'org-1',
      status: JobStatus.draft,
    });

    await expect(
      service.findOne(
        'job-1',
        callerOf(UserRole.recruiter, { organizationId: null }),
      ),
    ).rejects.toThrow('Không tìm thấy tin tuyển dụng');
  });

  describe('update — status transitions and publishedAt', () => {
    const existing = (overrides: Record<string, unknown> = {}) => ({
      jobId: 'job-1',
      salaryMin: null,
      salaryMax: null,
      status: JobStatus.active,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      departmentId: 'dep-1',
      organizationId: 'org-1',
      ...overrides,
    });

    it('refuses to reopen a closed posting', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        existing({ status: JobStatus.closed }),
      );

      await expect(
        service.update('job-1', { status: JobStatus.active } as any),
      ).rejects.toThrow('Không thể chuyển trạng thái');
    });

    it('refuses to unpublish a live posting back to draft', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(existing());

      await expect(
        service.update('job-1', { status: JobStatus.draft } as any),
      ).rejects.toThrow('Không thể chuyển trạng thái');
    });

    it('does not overwrite publishedAt when re-saving an already-published posting', async () => {
      const tx = createPrismaTransactionMock();
      prisma.jobPosting.findUnique.mockResolvedValue(existing());
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));
      tx.jobPosting.update.mockResolvedValue({ jobId: 'job-1' });
      tx.jobPosting.findUnique.mockResolvedValue({ jobId: 'job-1' });

      await service.update('job-1', {
        status: JobStatus.active,
        title: 'Updated title',
      } as any);

      // `undefined` leaves the column alone. Passing `new Date()` here would have
      // silently destroyed the real publication date on every subsequent edit.
      expect(tx.jobPosting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: undefined }),
        }),
      );
    });

    it('stamps publishedAt on the first transition to active', async () => {
      const tx = createPrismaTransactionMock();
      prisma.jobPosting.findUnique.mockResolvedValue(
        existing({ status: JobStatus.draft, publishedAt: null }),
      );
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));
      tx.jobPosting.update.mockResolvedValue({ jobId: 'job-1' });
      tx.jobPosting.findUnique.mockResolvedValue({ jobId: 'job-1' });

      await service.update('job-1', { status: JobStatus.active } as any);

      expect(tx.jobPosting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        }),
      );
    });

    it('realigns departmentId when the posting is handed to a recruiter in another department', async () => {
      const tx = createPrismaTransactionMock();
      prisma.jobPosting.findUnique.mockResolvedValue(existing());
      prisma.recruiter.findUnique.mockResolvedValue({
        departmentId: 'dep-2',
        organizationId: 'org-1',
      });
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));
      tx.jobPosting.update.mockResolvedValue({ jobId: 'job-1' });
      tx.jobPosting.findUnique.mockResolvedValue({ jobId: 'job-1' });

      await service.update('job-1', { createdBy: 'rec-2' } as any);

      expect(tx.jobPosting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            department: { connect: { departmentId: 'dep-2' } },
          }),
        }),
      );
    });

    // Never across organizations — not even for a platform admin: the posting's
    // organizationId would stay behind while its department moved.
    it('refuses to hand a posting to a recruiter in another organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(existing());
      prisma.recruiter.findUnique.mockResolvedValue({
        departmentId: 'dep-of-org-2',
        organizationId: 'org-2',
      });

      await expect(
        service.update('job-1', { createdBy: 'rec-of-org-2' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
