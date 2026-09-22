import {
  AiRecommendation,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { CvScreeningsService } from './cv-screenings.service';
import {
  callerOf,
  createPrismaMock,
  createQueueMock,
} from '../../test-utils/unit-test-helpers';

describe('CvScreeningsService', () => {
  let service: CvScreeningsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let queue: ReturnType<typeof createQueueMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    queue = createQueueMock();
    service = new CvScreeningsService(prisma as any, queue as any);
  });

  it('creates or resets a screening record and queues processing', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1' });
    prisma.cVScreening.upsert.mockResolvedValue({ screeningId: 'screen-1' });

    await service.createScreeningRecord('app-1', 'cv-1');

    expect(prisma.cVScreening.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { applicationId: 'app-1' },
        create: expect.objectContaining({
          status: ScreeningStatus.pending,
          configId: 'cfg-1',
        }),
        update: expect.objectContaining({
          status: ScreeningStatus.processing,
          retryCount: { increment: 1 },
        }),
      }),
    );
    expect(queue.add).toHaveBeenCalledWith('process-cv-screening', {
      screeningId: 'screen-1',
      cvId: 'cv-1',
      applicationId: 'app-1',
      configId: 'cfg-1',
    });
  });

  // Criterion 5: with no config named, the default is THIS organization's — it
  // used to be `findFirst({ isDefault: true })`, i.e. any organization's.
  it("screens with the default config of the application's own organization", async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1' });
    prisma.cVScreening.upsert.mockResolvedValue({ screeningId: 'screen-1' });

    await service.createScreeningRecord('app-1', 'cv-1');

    expect(prisma.aiConfig.findFirst).toHaveBeenCalledWith({
      where: { isDefault: true, organizationId: 'org-1' },
    });
    expect(
      prisma.cVScreening.upsert.mock.calls[0][0].create.organizationId,
    ).toBe('org-1');
  });

  it('treats a named config of another organization as not found', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue(null);

    await expect(
      service.createScreeningRecord('app-1', 'cv-1', 'cfg-of-org-2'),
    ).rejects.toThrow('cfg-of-org-2');
    expect(prisma.aiConfig.findFirst).toHaveBeenCalledWith({
      where: { configId: 'cfg-of-org-2', organizationId: 'org-1' },
    });
    expect(prisma.cVScreening.upsert).not.toHaveBeenCalled();
  });

  it('throws when application, CV, or config is missing', async () => {
    prisma.application.findUnique.mockResolvedValue(null);
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    await expect(
      service.createScreeningRecord('missing', 'cv-1'),
    ).rejects.toThrow('ng');

    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue(null);
    await expect(
      service.createScreeningRecord('app-1', 'missing'),
    ).rejects.toThrow('CV');

    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue(null);
    await expect(
      service.createScreeningRecord('app-1', 'cv-1', 'missing'),
    ).rejects.toThrow('AI');
  });

  it('returns a redacted candidate screening result only for the owner', async () => {
    prisma.cVScreening.findUnique.mockResolvedValue({
      screeningId: 'screen-1',
      applicationId: 'app-1',
      status: ScreeningStatus.completed,
      matchedSkills: ['nestjs'],
      screenedAt: new Date('2026-01-01T00:00:00.000Z'),
      application: { candidateId: 'cand-1' },
    });
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });

    await expect(
      service.getScreeningResultForCandidate('app-1', 'user-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        screeningId: 'screen-1',
        matchedSkills: ['nestjs'],
      }),
    );

    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'other' });
    await expect(
      service.getScreeningResultForCandidate('app-1', 'user-1'),
    ).rejects.toThrow('ng');
  });

  it('aggregates screening stats', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      title: 'Backend',
      departmentId: 'dep-1',
      organizationId: 'org-1',
    });
    prisma.cVScreening.findMany.mockResolvedValue([
      {
        status: ScreeningStatus.completed,
        overallScore: 80,
        aiRecommendation: AiRecommendation.interview,
      },
      {
        status: ScreeningStatus.failed,
        overallScore: null,
        aiRecommendation: null,
      },
      {
        status: ScreeningStatus.completed,
        overallScore: 60,
        aiRecommendation: AiRecommendation.interview,
      },
    ]);

    await expect(
      service.getScreeningStats('job-1', callerOf(UserRole.admin)),
    ).resolves.toEqual(
      expect.objectContaining({
        // organizationId is an internal filter column, never response data
        job: { jobId: 'job-1', title: 'Backend', departmentId: 'dep-1' },
        total: 3,
        averageScore: 70,
        byStatus: expect.objectContaining({ completed: 2, failed: 1 }),
        byRecommendation: expect.objectContaining({ interview: 2 }),
      }),
    );
  });

  it('allows only same-department recruiters to view full screening results', async () => {
    prisma.cVScreening.findUnique.mockResolvedValue({
      screeningId: 'screen-1',
      applicationId: 'app-1',
      organizationId: 'org-1',
      application: {
        jobPosting: { departmentId: 'dep-1' },
      },
    });
    prisma.recruiter.findUnique.mockResolvedValueOnce({
      departmentId: 'dep-1',
    });

    await expect(
      service.getScreeningResult(
        'app-1',
        callerOf(UserRole.recruiter, { userId: 'rec-1' }),
      ),
    ).resolves.toEqual(expect.objectContaining({ screeningId: 'screen-1' }));

    prisma.recruiter.findUnique.mockResolvedValueOnce({
      departmentId: 'dep-2',
    });
    await expect(
      service.getScreeningResult(
        'app-1',
        callerOf(UserRole.recruiter, { userId: 'rec-2' }),
      ),
    ).rejects.toThrow('quyền');
  });

  describe('full screening result across organizations', () => {
    beforeEach(() => {
      prisma.cVScreening.findUnique.mockResolvedValue({
        screeningId: 'screen-2',
        applicationId: 'app-2',
        organizationId: 'org-2',
        application: { jobPosting: { departmentId: 'dep-of-org-2' } },
      });
    });

    it('refuses an org_admin of another organization (criterion 2)', async () => {
      await expect(
        service.getScreeningResult('app-2', callerOf(UserRole.org_admin)),
      ).rejects.toThrow('tổ chức khác');
    });

    it('lets the org_admin of that organization in, with no department check (6b)', async () => {
      await expect(
        service.getScreeningResult(
          'app-2',
          callerOf(UserRole.org_admin, { organizationId: 'org-2' }),
        ),
      ).resolves.toEqual(expect.objectContaining({ screeningId: 'screen-2' }));
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it('lets a platform admin in (6a)', async () => {
      await expect(
        service.getScreeningResult('app-2', callerOf(UserRole.admin)),
      ).resolves.toEqual(expect.objectContaining({ screeningId: 'screen-2' }));
    });
  });

  it('calculates scores and normalizes fractional thresholds', () => {
    expect(
      service.calculateOverallScore(80, 70, 90, {
        skillsWeight: 0.5,
        experienceWeight: 0.3,
        educationWeight: 0.2,
      }),
    ).toBe(79);

    expect(service.determineRecommendation(80, 60)).toBe(
      AiRecommendation.interview,
    );
    expect(service.determineRecommendation(60, 0.6)).toBe(
      AiRecommendation.interview,
    );
    expect(service.determineRecommendation(59.9, 0.6)).toBe(
      AiRecommendation.reject,
    );
  });
});
