import { AiRecommendation, ScreeningStatus, UserRole } from '@ats-platform/database';
import { CvScreeningsService } from './cv-screenings.service';
import { createPrismaMock, createQueueMock } from '../../test-utils/unit-test-helpers';

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
    prisma.application.findUnique.mockResolvedValue({ applicationId: 'app-1' });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1' });
    prisma.cVScreening.upsert.mockResolvedValue({ screeningId: 'screen-1' });

    await service.createScreeningRecord('app-1', 'cv-1');

    expect(prisma.cVScreening.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { applicationId: 'app-1' },
        create: expect.objectContaining({ status: ScreeningStatus.pending, configId: 'cfg-1' }),
        update: expect.objectContaining({ status: ScreeningStatus.processing, retryCount: { increment: 1 } }),
      }),
    );
    expect(queue.add).toHaveBeenCalledWith('process-cv-screening', {
      screeningId: 'screen-1',
      cvId: 'cv-1',
      applicationId: 'app-1',
      configId: 'cfg-1',
    });
  });

  it('throws when application, CV, or config is missing', async () => {
    prisma.application.findUnique.mockResolvedValue(null);
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    await expect(service.createScreeningRecord('missing', 'cv-1')).rejects.toThrow('ng');

    prisma.application.findUnique.mockResolvedValue({ applicationId: 'app-1' });
    prisma.cV.findUnique.mockResolvedValue(null);
    await expect(service.createScreeningRecord('app-1', 'missing')).rejects.toThrow('CV');

    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findUnique.mockResolvedValue(null);
    await expect(service.createScreeningRecord('app-1', 'cv-1', 'missing')).rejects.toThrow('AI');
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

    await expect(service.getScreeningResultForCandidate('app-1', 'user-1')).resolves.toEqual(
      expect.objectContaining({
        screeningId: 'screen-1',
        matchedSkills: ['nestjs'],
      }),
    );

    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'other' });
    await expect(service.getScreeningResultForCandidate('app-1', 'user-1')).rejects.toThrow('ng');
  });

  it('aggregates screening stats', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue({ jobId: 'job-1', title: 'Backend', departmentId: 'dep-1' });
    prisma.cVScreening.findMany.mockResolvedValue([
      { status: ScreeningStatus.completed, overallScore: 80, aiRecommendation: AiRecommendation.hire },
      { status: ScreeningStatus.failed, overallScore: null, aiRecommendation: null },
      { status: ScreeningStatus.completed, overallScore: 60, aiRecommendation: AiRecommendation.interview },
    ]);

    await expect(service.getScreeningStats('job-1', 'admin-1', UserRole.admin)).resolves.toEqual(
      expect.objectContaining({
        total: 3,
        averageScore: 70,
        byStatus: expect.objectContaining({ completed: 2, failed: 1 }),
        byRecommendation: expect.objectContaining({ hire: 1, interview: 1 }),
      }),
    );
  });

  it('allows only same-department recruiters to view full screening results', async () => {
    prisma.cVScreening.findUnique.mockResolvedValue({
      screeningId: 'screen-1',
      applicationId: 'app-1',
      application: {
        jobPosting: { departmentId: 'dep-1' },
      },
    });
    prisma.recruiter.findUnique.mockResolvedValueOnce({ departmentId: 'dep-1' });

    await expect(service.getScreeningResult('app-1', 'rec-1', UserRole.recruiter)).resolves.toEqual(
      expect.objectContaining({ screeningId: 'screen-1' }),
    );

    prisma.recruiter.findUnique.mockResolvedValueOnce({ departmentId: 'dep-2' });
    await expect(service.getScreeningResult('app-1', 'rec-2', UserRole.recruiter)).rejects.toThrow('quy');
  });

  it('calculates scores and normalizes fractional thresholds', () => {
    expect(
      service.calculateOverallScore(80, 70, 90, {
        skillsWeight: 0.5,
        experienceWeight: 0.3,
        educationWeight: 0.2,
      }),
    ).toBe(79);

    expect(service.determineRecommendation(80, 60)).toBe(AiRecommendation.hire);
    expect(service.determineRecommendation(60, 0.6)).toBe(AiRecommendation.interview);
    expect(service.determineRecommendation(59.9, 0.6)).toBe(AiRecommendation.reject);
  });
});
