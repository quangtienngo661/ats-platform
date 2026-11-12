import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, UserRole } from '@ats-platform/database';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import { AnalyticsService, resolveRange } from './analytics.service';

const NOW = new Date('2026-11-20T03:00:00.000Z');
const admin = callerOf(UserRole.admin, { userId: 'admin-1' });
const orgAdmin = callerOf(UserRole.org_admin, { userId: 'oa-1' }); // org-1
const recruiter = callerOf(UserRole.recruiter, { userId: 'rec-1' }); // org-1

describe('resolveRange (R17)', () => {
  it('defaults to the 30 days before now', () => {
    expect(resolveRange({}, NOW)).toEqual({ from: new Date('2026-10-21T03:00:00.000Z'), to: NOW });
  });

  it('accepts exactly 366 days and refuses one more millisecond', () => {
    const to = '2026-11-20T00:00:00.000Z';
    expect(() => resolveRange({ from: '2025-11-19T00:00:00.000Z', to }, NOW)).not.toThrow();
    expect(() => resolveRange({ from: '2025-11-18T23:59:59.999Z', to }, NOW)).toThrow('Khoảng thống kê tối đa 366 ngày');
  });

  it.each([
    [{ from: '2026-11-10T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' }, 'Ngày bắt đầu phải trước ngày kết thúc'],
    [{ from: 'yesterday' }, 'Khoảng thời gian không hợp lệ'],
  ])('refuses %o', (query, message) => {
    expect(() => resolveRange(query, NOW)).toThrow(new BadRequestException(message));
  });
});

describe('AnalyticsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let applications: { assertCanAccessDepartment: jest.Mock };
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    applications = { assertCanAccessDepartment: jest.fn().mockResolvedValue(undefined) };
    service = new AnalyticsService(prisma as any, applications as any);
    prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
  });

  describe('scopeFor (C15)', () => {
    it('a recruiter counts only its department, inside its organization', async () => {
      await expect(service.scopeFor(recruiter, {})).resolves.toEqual({
        organizationId: 'org-1',
        jobPosting: { departmentId: 'dep-1' },
      });
    });

    it('an org_admin counts its organization; naming another one is 403', async () => {
      await expect(service.scopeFor(orgAdmin, {})).resolves.toEqual({ organizationId: 'org-1' });
      await expect(service.scopeFor(orgAdmin, { organizationId: 'org-1' })).resolves.toEqual({ organizationId: 'org-1' });
      await expect(service.scopeFor(orgAdmin, { organizationId: 'org-2' })).rejects.toThrow(
        new ForbiddenException('Bạn không có quyền xem thống kê của tổ chức khác'),
      );
    });

    it('a platform admin counts everything, or the organization it names', async () => {
      await expect(service.scopeFor(admin, {})).resolves.toEqual({});
      await expect(service.scopeFor(admin, { organizationId: 'org-2' })).resolves.toEqual({ organizationId: 'org-2' });
    });

    it('one job narrows the scope after the Kanban check of that job', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue({ organizationId: 'org-1', departmentId: 'dep-1' });

      await expect(service.scopeFor(recruiter, { jobId: 'job-1' })).resolves.toEqual({
        organizationId: 'org-1',
        jobPosting: { departmentId: 'dep-1' },
        jobId: 'job-1',
      });
      expect(applications.assertCanAccessDepartment).toHaveBeenCalledWith(recruiter, {
        organizationId: 'org-1',
        departmentId: 'dep-1',
      });
    });

    it('a job outside the caller’s department is refused by that check', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue({ organizationId: 'org-1', departmentId: 'dep-9' });
      applications.assertCanAccessDepartment.mockRejectedValue(new ForbiddenException());

      await expect(service.scopeFor(recruiter, { jobId: 'job-9' })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('recruitment (R18)', () => {
    const d = (iso: string) => new Date(iso);

    beforeEach(() => {
      prisma.application.findMany
        // the period's applications
        .mockResolvedValueOnce([
          {
            applicationId: 'a1',
            status: 'interview',
            appliedAt: d('2026-11-18T03:00:00.000Z'),
            history: [
              { fromStatus: null, toStatus: 'applied', changedAt: d('2026-11-18T03:00:00.000Z') },
              { fromStatus: 'applied', toStatus: 'screening', changedAt: d('2026-11-19T03:00:00.000Z') },
              { fromStatus: 'screening', toStatus: 'interview', changedAt: d('2026-11-20T00:00:00.000Z') },
            ],
          },
          { applicationId: 'a2', status: 'applied', appliedAt: d('2026-11-19T03:00:00.000Z'), history: [] },
        ])
        // the newest six
        .mockResolvedValueOnce([
          {
            applicationId: 'a2',
            jobId: 'job-1',
            status: 'applied',
            appliedAt: d('2026-11-19T03:00:00.000Z'),
            candidate: { user: { fullName: 'Ứng viên B' } },
            jobPosting: { title: 'Backend' },
          },
        ]);
      prisma.jobPosting.count.mockResolvedValue(3);
    });

    it('counts the period in the caller’s scope and lists the newest applications from the database (A-04)', async () => {
      const result = await service.recruitment(recruiter, { from: '2026-11-18T00:00:00.000Z', to: '2026-11-20T03:00:00.000Z' }, NOW);

      expect(result.totals).toEqual({ applications: 2, openJobs: 3, hired: 0, averageDaysToHire: null });
      expect(result.funnel.map((s) => [s.stage, s.reached])).toEqual([
        ['applied', 2], ['screening', 1], ['interview', 1], ['offer', 0], ['hired', 0],
      ]);
      expect(result.timeInStage.slice(0, 2)).toEqual([
        { stage: 'applied', averageDays: 1, samples: 1 },
        { stage: 'screening', averageDays: 0.9, samples: 1 },
      ]);
      expect(result.recent).toEqual([
        {
          applicationId: 'a2',
          jobId: 'job-1',
          jobTitle: 'Backend',
          candidateName: 'Ứng viên B',
          status: 'applied',
          appliedAt: '2026-11-19T03:00:00.000Z',
        },
      ]);

      const [periodQuery, recentQuery] = prisma.application.findMany.mock.calls.map(([args]: any[]) => args);
      expect(periodQuery.where).toEqual({
        organizationId: 'org-1',
        jobPosting: { departmentId: 'dep-1' },
        appliedAt: { gte: d('2026-11-18T00:00:00.000Z'), lte: d('2026-11-20T03:00:00.000Z') },
      });
      expect(recentQuery).toEqual(expect.objectContaining({ orderBy: { appliedAt: 'desc' }, take: 6 }));
      expect(prisma.jobPosting.count).toHaveBeenCalledWith({
        where: { status: 'active', organizationId: 'org-1', departmentId: 'dep-1' },
      });
    });
  });

  describe('aiCost (R22)', () => {
    beforeEach(() => {
      prisma.$queryRaw = jest.fn().mockResolvedValue([
        {
          month: '2026-11',
          action_type: 'cv_scoring',
          model_name: 'model-a',
          calls: BigInt(2),
          failed_calls: BigInt(0),
          prompt_tokens: BigInt(1_000_000),
          completion_tokens: BigInt(0),
        },
      ]);
      prisma.aiModelPrice.findMany.mockResolvedValue([
        { modelName: 'model-a', inputUsdPerMillion: new Prisma.Decimal('2.5'), outputUsdPerMillion: new Prisma.Decimal('10') },
      ]);
    });

    it('turns the grouped rows and the prices into the cost summary', async () => {
      const result = await service.aiCost(admin, {}, NOW);

      expect(result.items).toEqual([
        { month: '2026-11', actionType: 'cv_scoring', calls: 2, failedCalls: 0, promptTokens: 1_000_000, completionTokens: 0, estimatedCostUsd: 2.5 },
      ]);
      expect(result.modelsWithoutPrice).toEqual([]);
      expect(result.organizationId).toBeNull();
    });

    it('an org_admin sees its own organization; another one is 403 before any query', async () => {
      await expect(service.aiCost(orgAdmin, {}, NOW)).resolves.toEqual(expect.objectContaining({ organizationId: 'org-1' }));
      const sql = (prisma.$queryRaw as jest.Mock).mock.calls[0][0] as Prisma.Sql;
      expect(sql.values).toContain('org-1');

      (prisma.$queryRaw as jest.Mock).mockClear();
      await expect(service.aiCost(orgAdmin, { organizationId: 'org-2' }, NOW)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('a platform admin without an organization filter reads every row', async () => {
      await service.aiCost(admin, {}, NOW);
      const sql = (prisma.$queryRaw as jest.Mock).mock.calls[0][0] as Prisma.Sql;
      expect(sql.sql).not.toContain('organization_id =');
    });
  });

  describe('model prices (R21)', () => {
    it('lists every model seen in the logs with its price or none', async () => {
      prisma.aiUsageLog.findMany.mockResolvedValue([{ modelName: 'model-a' }, { modelName: 'model-b' }]);
      prisma.aiModelPrice.findMany.mockResolvedValue([
        { modelName: 'model-a', inputUsdPerMillion: new Prisma.Decimal('2.5'), outputUsdPerMillion: new Prisma.Decimal('10'), updatedAt: NOW },
      ]);

      await expect(service.modelPrices()).resolves.toEqual([
        { modelName: 'model-a', inputUsdPerMillion: 2.5, outputUsdPerMillion: 10, updatedAt: NOW.toISOString() },
        { modelName: 'model-b', inputUsdPerMillion: null, outputUsdPerMillion: null, updatedAt: null },
      ]);
    });

    it('saves a price for the admin who set it', async () => {
      prisma.aiModelPrice.upsert.mockResolvedValue({
        modelName: 'model-a', inputUsdPerMillion: new Prisma.Decimal('0.15'), outputUsdPerMillion: new Prisma.Decimal('0.6'), updatedAt: NOW,
      });

      await service.setModelPrice(admin, 'model-a', { inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6 });

      expect(prisma.aiModelPrice.upsert).toHaveBeenCalledWith({
        where: { modelName: 'model-a' },
        create: { modelName: 'model-a', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, updatedById: 'admin-1' },
        update: { inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, updatedById: 'admin-1' },
      });
    });
  });
});
