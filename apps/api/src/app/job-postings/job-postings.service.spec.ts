import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '@ats-platform/database';
import { JobPostingsService } from './job-postings.service';
import {
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
    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    tx.jobPosting.create.mockResolvedValue({ jobId: 'job-1' });
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
        }),
      }),
    );
    expect(jobPostingSkillsService.create).toHaveBeenCalledWith(
      'job-1',
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
    });
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.recruiter.findUnique.mockResolvedValue({ recruiterId: 'rec-1' });
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

  it('forces active-only listing for non-staff callers, ignoring a draft status filter', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.findAll({ status: JobStatus.draft } as any, false);

    expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: JobStatus.active }),
      }),
    );
  });

  it('honours the status filter for staff callers', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.findAll({ status: JobStatus.draft } as any, true);

    expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: JobStatus.draft }),
      }),
    );
  });

  it('hides an unpublished posting from a non-staff caller behind the same 404', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      status: JobStatus.draft,
    });

    await expect(service.findOne('job-1', false)).rejects.toThrow(
      'Không tìm thấy tin tuyển dụng',
    );
    await expect(service.findOne('job-1', true)).resolves.toEqual(
      expect.objectContaining({ jobId: 'job-1' }),
    );
  });

  describe('update — status transitions and publishedAt', () => {
    const existing = (overrides: Record<string, unknown> = {}) => ({
      jobId: 'job-1',
      salaryMin: null,
      salaryMax: null,
      status: JobStatus.active,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      departmentId: 'dep-1',
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
      prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-2' });
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
  });
});
