import {
  AiRecommendation,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { CvScreeningsService } from './cv-screenings.service';
import { applicationIncludeOptions } from '../../common/utils/include-options.util';
import {
  callerOf,
  createPrismaMock,
  createQueueMock,
  createSocketMock,
} from '../../test-utils/unit-test-helpers';

describe('CvScreeningsService', () => {
  let service: CvScreeningsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let queue: ReturnType<typeof createQueueMock>;
  let socket: ReturnType<typeof createSocketMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    queue = createQueueMock();
    socket = createSocketMock();
    service = new CvScreeningsService(
      prisma as any,
      queue as any,
      socket as any,
    );
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

  // The candidate API shows no AI scores today, reviewed or not. Pinning the exact keys
  // keeps a reviewer's note, identity and scores from ever leaking through it (R11).
  it('a candidate never receives review data or scores, even for a reviewed screening', async () => {
    prisma.cVScreening.findUnique.mockResolvedValue({
      screeningId: 'screen-1',
      applicationId: 'app-1',
      status: ScreeningStatus.completed,
      matchedSkills: ['nestjs'],
      screenedAt: new Date('2026-01-01T00:00:00.000Z'),
      overallScore: '70.0',
      reviewedAt: new Date(),
      reviewedById: 'rec-1',
      reviewNote: 'Ghi chú nội bộ',
      reviewedOverallScore: '77.0',
      application: { candidateId: 'cand-1' },
    });
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });

    const result = await service.getScreeningResultForCandidate(
      'app-1',
      'user-1',
    );

    expect(Object.keys(result).sort()).toEqual([
      'applicationId',
      'matchedSkills',
      'screenedAt',
      'screeningId',
      'status',
    ]);
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

  it('re-screening clears every review field (R10)', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1' });
    prisma.cVScreening.upsert.mockResolvedValue({ screeningId: 'screen-1' });

    await service.createScreeningRecord('app-1', 'cv-1');

    expect(prisma.cVScreening.upsert.mock.calls[0][0].update).toEqual(
      expect.objectContaining({
        reviewedById: null,
        reviewedAt: null,
        reviewedSkillsScore: null,
        reviewedExperienceScore: null,
        reviewedEducationScore: null,
        reviewedOverallScore: null,
        reviewNote: null,
      }),
    );
  });

  describe('reviewScreening', () => {
    const config = {
      skillsWeight: 0.5,
      experienceWeight: 0.3,
      educationWeight: 0.2,
    };
    const completed = (overrides: Record<string, unknown> = {}) => ({
      screeningId: 'screen-1',
      applicationId: 'app-1',
      organizationId: 'org-1',
      status: ScreeningStatus.completed,
      skillsScore: '80.0',
      experienceScore: '70.0',
      educationScore: '60.0',
      overallScore: '73.0',
      aiConfig: config,
      application: {
        applicationId: 'app-1',
        jobId: 'job-1',
        jobPosting: { departmentId: 'dep-1' },
      },
      ...overrides,
    });
    const recruiter = callerOf(UserRole.recruiter, { userId: 'rec-1' });
    const dto = (overrides: Record<string, unknown> = {}) => ({
      skillsScore: 80,
      experienceScore: 70,
      educationScore: 60,
      ...overrides,
    });
    const updateData = () => prisma.cVScreening.update.mock.calls[0][0].data;

    beforeEach(() => {
      prisma.cVScreening.findUnique.mockResolvedValue(completed());
      prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
      prisma.cVScreening.update.mockImplementation(async ({ data }) => ({
        ...completed(),
        ...data,
      }));
      prisma.application.findUnique.mockResolvedValue({
        applicationId: 'app-1',
        jobId: 'job-1',
      });
    });

    it('a caller without access to the job is refused (403) and nothing is written', async () => {
      prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-2' });

      await expect(
        service.reviewScreening(recruiter, 'app-1', dto()),
      ).rejects.toThrow('quyền');

      expect(prisma.cVScreening.update).not.toHaveBeenCalled();
    });

    it('an unknown application is 404', async () => {
      prisma.cVScreening.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewScreening(recruiter, 'app-9', dto()),
      ).rejects.toThrow('Không tìm thấy kết quả sàng lọc');
    });

    it.each([
      ScreeningStatus.pending,
      ScreeningStatus.processing,
      ScreeningStatus.failed,
    ])('status %s → 400 "Chỉ duyệt được kết quả sàng lọc đã hoàn tất"', async (status) => {
      prisma.cVScreening.findUnique.mockResolvedValue(completed({ status }));

      await expect(
        service.reviewScreening(recruiter, 'app-1', dto()),
      ).rejects.toThrow('Chỉ duyệt được kết quả sàng lọc đã hoàn tất');

      expect(prisma.cVScreening.update).not.toHaveBeenCalled();
    });

    it('changed score without a note → 400 "Vui lòng nhập lý do khi sửa điểm"', async () => {
      await expect(
        service.reviewScreening(recruiter, 'app-1', dto({ skillsScore: 85 })),
      ).rejects.toThrow('Vui lòng nhập lý do khi sửa điểm');
      await expect(
        service.reviewScreening(
          recruiter,
          'app-1',
          dto({ skillsScore: 85, note: '   ' }),
        ),
      ).rejects.toThrow('Vui lòng nhập lý do khi sửa điểm');

      expect(prisma.cVScreening.update).not.toHaveBeenCalled();
    });

    it('all scores equal to the AI scores and no note → confirmed, stored as reviewed with a null note', async () => {
      await service.reviewScreening(recruiter, 'app-1', dto());

      expect(updateData()).toEqual(
        expect.objectContaining({
          reviewedSkillsScore: 80,
          reviewedExperienceScore: 70,
          reviewedEducationScore: 60,
          reviewedOverallScore: 73,
          reviewNote: null,
        }),
      );
    });

    it('a changed score with a note is stored, with the note trimmed', async () => {
      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({ skillsScore: 90, note: '  Có 5 năm kinh nghiệm React  ' }),
      );

      expect(updateData()).toEqual(
        expect.objectContaining({
          reviewedSkillsScore: 90,
          reviewNote: 'Có 5 năm kinh nghiệm React',
        }),
      );
    });

    it('reviewedOverallScore = calculateOverallScore(reviewed scores, the screening aiConfig): 80/70/60 at 0.5/0.3/0.2 → 73', async () => {
      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({ skillsScore: 80, experienceScore: 70, educationScore: 60 }),
      );

      expect(updateData().reviewedOverallScore).toBe(73);

      prisma.cVScreening.update.mockClear();
      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({
          skillsScore: 100,
          experienceScore: 100,
          educationScore: 100,
          note: 'Xuất sắc',
        }),
      );

      expect(updateData().reviewedOverallScore).toBe(100);
    });

    it('72.55 is stored as 72.6 (half up; (72.55).toFixed(1) would give 72.5)', async () => {
      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({ skillsScore: 72.55, note: 'Điều chỉnh nhẹ' }),
      );

      expect(updateData().reviewedSkillsScore).toBe(72.6);
    });

    it('the overall score is computed from the already rounded scores', async () => {
      prisma.cVScreening.findUnique.mockResolvedValue(
        completed({
          aiConfig: {
            skillsWeight: 0.5,
            experienceWeight: 0.25,
            educationWeight: 0.25,
          },
        }),
      );

      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({
          skillsScore: 72.45,
          experienceScore: 0,
          educationScore: 0,
          note: 'Làm tròn',
        }),
      );

      // 72.45 → 72.5 first; 72.5 × 0.5 = 36.25 → 36.3. Using 72.45 directly would give 36.2.
      expect(updateData().reviewedSkillsScore).toBe(72.5);
      expect(updateData().reviewedOverallScore).toBe(36.3);
    });

    it('never touches Application.status or aiRecommendation (ADR 0002)', async () => {
      await service.reviewScreening(
        recruiter,
        'app-1',
        dto({ skillsScore: 10, experienceScore: 10, educationScore: 10, note: 'Thấp' }),
      );

      expect(prisma.application.update).not.toHaveBeenCalled();
      expect(Object.keys(updateData())).not.toContain('aiRecommendation');
      expect(Object.keys(updateData())).not.toContain('status');
      expect(Object.keys(updateData())).not.toContain('overallScore');
    });

    it('sets reviewedById = caller.userId and reviewedAt = now', async () => {
      const before = Date.now();

      await service.reviewScreening(recruiter, 'app-1', dto());

      expect(updateData().reviewedById).toBe('rec-1');
      expect(updateData().reviewedAt).toBeInstanceOf(Date);
      expect(updateData().reviewedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('the last review wins: a second review overwrites the reviewer and time', async () => {
      await service.reviewScreening(recruiter, 'app-1', dto());
      await service.reviewScreening(
        callerOf(UserRole.recruiter, { userId: 'rec-2' }),
        'app-1',
        dto(),
      );

      expect(prisma.cVScreening.update.mock.calls[1][0].data.reviewedById).toBe(
        'rec-2',
      );
    });

    it('emits cv-screening:reviewed to the job room with the refreshed application', async () => {
      await service.reviewScreening(recruiter, 'app-1', dto());

      // Same payload shape as cv-screening:completed, so the Kanban can reuse its handler.
      expect(prisma.application.findUnique).toHaveBeenCalledWith({
        where: { applicationId: 'app-1' },
        include: applicationIncludeOptions,
      });
      expect(socket.handleEmit).toHaveBeenCalledWith(
        'cv-screening:reviewed',
        { applicationId: 'app-1', jobId: 'job-1' },
        'job_job-1',
      );
    });

    it('a failed socket emit does not fail the review', async () => {
      socket.handleEmit.mockImplementation(() => {
        throw new Error('socket down');
      });

      await expect(
        service.reviewScreening(recruiter, 'app-1', dto()),
      ).resolves.toEqual(expect.objectContaining({ screeningId: 'screen-1' }));
    });
  });

  it('marks a bulk job as silent', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
    });
    prisma.cV.findUnique.mockResolvedValue({ cvId: 'cv-1' });
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1' });
    prisma.cVScreening.upsert.mockResolvedValue({ screeningId: 'screen-1' });

    await service.createScreeningRecord('app-1', 'cv-1', undefined, {
      notify: false,
    });

    expect(queue.add).toHaveBeenCalledWith('process-cv-screening', {
      screeningId: 'screen-1',
      cvId: 'cv-1',
      applicationId: 'app-1',
      configId: 'cfg-1',
      notify: false,
    });
  });
});
