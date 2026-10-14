import {
  AiRecommendation,
  ApplicationStatus,
  Prisma,
  ScorecardRecommendation,
  UserRole,
} from '@ats-platform/database';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import {
  ApplicationComparisonService,
  type ComparisonItem,
} from './application-comparison.service';
import { CompareApplicationsQueryDto } from './dto/compare-applications-query.dto';

const validIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
];
const applicationIds = validIds.slice(0, 2);
const jobId = 'job-1';
const caller = callerOf(UserRole.recruiter, { userId: 'recruiter-1' });
const job = { jobId, organizationId: 'org-1', departmentId: 'dep-1' };
const applications = [
  {
    applicationId: applicationIds[0],
    jobId,
    status: ApplicationStatus.interview,
    appliedAt: new Date('2026-10-12T02:00:00.000Z'),
    candidate: { user: { fullName: 'Nguyễn An' } },
    screening: {
      overallScore: new Prisma.Decimal('82.5'),
      skillsScore: new Prisma.Decimal('90'),
      experienceScore: new Prisma.Decimal('75.5'),
      educationScore: new Prisma.Decimal('80'),
      aiRecommendation: AiRecommendation.interview,
      matchedSkills: ['TypeScript', 'NestJS'],
      missingSkills: ['Docker'],
    },
  },
  {
    applicationId: applicationIds[1],
    jobId,
    status: ApplicationStatus.screening,
    appliedAt: new Date('2026-10-13T03:00:00.000Z'),
    candidate: { user: { fullName: 'Trần Bình' } },
    screening: {
      overallScore: null,
      skillsScore: new Prisma.Decimal('0'),
      experienceScore: new Prisma.Decimal('60'),
      educationScore: null,
      aiRecommendation: null,
      matchedSkills: [],
      missingSkills: null,
    },
  },
];
const firstScorecard = {
  id: 'scorecard-1',
  interviewId: 'interview-1',
  technicalSkills: 4,
  problemSolving: 3,
  communication: 5,
  cultureFit: 4,
  recommendation: ScorecardRecommendation.strong_yes,
  interview: { applicationId: applicationIds[0] },
  author: { fullName: 'Lê Minh' },
};
const secondScorecard = {
  id: 'scorecard-2',
  interviewId: 'interview-2',
  technicalSkills: 3,
  problemSolving: 2,
  communication: 4,
  cultureFit: 3,
  recommendation: ScorecardRecommendation.no,
  interview: { applicationId: applicationIds[1] },
  author: { fullName: 'Phạm Hoa' },
};
const expectedItems: ComparisonItem[] = [
  {
    applicationId: applicationIds[0],
    candidateName: 'Nguyễn An',
    status: ApplicationStatus.interview,
    appliedAt: new Date('2026-10-12T02:00:00.000Z'),
    screening: {
      overallScore: 82.5,
      skillsScore: 90,
      experienceScore: 75.5,
      educationScore: 80,
      aiRecommendation: AiRecommendation.interview,
      matchedSkills: ['TypeScript', 'NestJS'],
      missingSkills: ['Docker'],
    },
    scorecards: {
      count: 1,
      average: {
        technicalSkills: 4,
        problemSolving: 3,
        communication: 5,
        cultureFit: 4,
      },
      recommendations: [
        { interviewerName: 'Lê Minh', recommendation: ScorecardRecommendation.strong_yes },
      ],
    },
    noteCount: 3,
  },
  {
    applicationId: applicationIds[1],
    candidateName: 'Trần Bình',
    status: ApplicationStatus.screening,
    appliedAt: new Date('2026-10-13T03:00:00.000Z'),
    screening: {
      overallScore: null,
      skillsScore: 0,
      experienceScore: 60,
      educationScore: null,
      aiRecommendation: null,
      matchedSkills: [],
      missingSkills: null,
    },
    scorecards: {
      count: 1,
      average: {
        technicalSkills: 3,
        problemSolving: 2,
        communication: 4,
        cultureFit: 3,
      },
      recommendations: [
        { interviewerName: 'Phạm Hoa', recommendation: ScorecardRecommendation.no },
      ],
    },
    noteCount: 1,
  },
];

describe('ApplicationComparisonService', () => {
  let service: ApplicationComparisonService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let applicationsService: { assertCanAccessApplication: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    applicationsService = { assertCanAccessApplication: jest.fn().mockResolvedValue(undefined) };
    prisma.jobPosting.findUnique.mockResolvedValue(job);
    // Database row order must not determine the comparison's column order.
    prisma.application.findMany.mockResolvedValue([applications[1], applications[0]]);
    prisma.interviewScorecard.findMany.mockResolvedValue([secondScorecard, firstScorecard]);
    prisma.applicationNote.groupBy.mockResolvedValue([
      { applicationId: applicationIds[1], _count: { _all: 1 } },
      { applicationId: applicationIds[0], _count: { _all: 3 } },
    ]);
    // The contract also permits counting notes separately for each application.
    prisma.applicationNote.count.mockImplementation(
      async ({ where }: { where: { applicationId: string } }) =>
        where.applicationId === applicationIds[0] ? 3 : 1,
    );
    service = new ApplicationComparisonService(prisma as any, applicationsService as any);
  });

  it('returns the shape of the spec for 2 applications of the job', async () => {
    const result = await service.compare(caller, jobId, applicationIds);

    expect(result).toEqual(expectedItems);
    expect(prisma.jobPosting.findUnique).toHaveBeenCalledWith({ where: { jobId } });
    expect(prisma.application.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ applicationId: { in: applicationIds } }),
      }),
    );
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledTimes(2);
    for (const id of applicationIds) {
      expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(caller, id);
    }
    expect(prisma.interviewScorecard.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.interviewScorecard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interview: { applicationId: { in: applicationIds } } },
      }),
    );
    if (prisma.applicationNote.groupBy.mock.calls.length > 0) {
      expect(prisma.applicationNote.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.applicationNote.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['applicationId'],
          where: expect.objectContaining({ applicationId: { in: applicationIds } }),
          _count: expect.anything(),
        }),
      );
    } else {
      expect(prisma.applicationNote.count).toHaveBeenCalledTimes(2);
      for (const id of applicationIds) {
        expect(prisma.applicationNote.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ applicationId: id }) }),
        );
      }
    }
  });

  it('rejects an id that belongs to another job', async () => {
    for (const rows of [
      [applications[0], { ...applications[1], jobId: 'job-2' }],
      [applications[0]],
    ]) {
      prisma.application.findMany.mockResolvedValue(rows);
      const call = service.compare(caller, jobId, applicationIds);

      await expect(call).rejects.toBeInstanceOf(BadRequestException);
      await expect(call).rejects.toMatchObject({
        status: 400,
        message: 'Chỉ so sánh 2–4 ứng viên của cùng một tin',
      });
    }
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.groupBy).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });

  it('answers 404 for a job of another organization', async () => {
    for (const inaccessibleJob of [{ ...job, organizationId: 'org-2' }, null]) {
      prisma.jobPosting.findUnique.mockResolvedValue(inaccessibleJob);
      const call = service.compare(caller, jobId, applicationIds);

      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy tin tuyển dụng',
      });
    }
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.groupBy).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });

  it('refuses a recruiter of another department', async () => {
    const otherDepartmentRecruiter = callerOf(UserRole.recruiter, {
      userId: 'recruiter-dep-2',
    });
    // Refusing the second id proves access is checked for every selected application.
    applicationsService.assertCanAccessApplication
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ForbiddenException('Bạn không có quyền truy cập phòng ban này'));
    const call = service.compare(otherDepartmentRecruiter, jobId, applicationIds);

    await expect(call).rejects.toBeInstanceOf(ForbiddenException);
    await expect(call).rejects.toMatchObject({ status: 403 });
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledTimes(2);
    for (const id of applicationIds) {
      expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(
        otherDepartmentRecruiter,
        id,
      );
    }
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.groupBy).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });

  it('gives screening null and null averages when there is neither', async () => {
    prisma.application.findMany.mockResolvedValue(
      applications.map((application) => ({ ...application, screening: null })),
    );
    prisma.interviewScorecard.findMany.mockResolvedValue([]);
    prisma.applicationNote.groupBy.mockResolvedValue([]);
    prisma.applicationNote.count.mockResolvedValue(0);

    await expect(service.compare(caller, jobId, applicationIds)).resolves.toEqual(
      expectedItems.map((item) => ({
        ...item,
        screening: null,
        scorecards: {
          count: 0,
          average: {
            technicalSkills: null,
            problemSolving: null,
            communication: null,
            cultureFit: null,
          },
          recommendations: [],
        },
        noteCount: 0,
      })),
    );
  });

  it('averages two scorecards and rounds to one decimal', async () => {
    prisma.interviewScorecard.findMany.mockResolvedValue([
      firstScorecard,
      secondScorecard,
      {
        ...firstScorecard,
        id: 'scorecard-3',
        interviewId: 'interview-3',
        technicalSkills: 5,
        problemSolving: 4,
        communication: 2,
        cultureFit: 3,
        recommendation: ScorecardRecommendation.yes,
        author: { fullName: 'Võ Lan' },
      },
    ]);
    const twoCards = await service.compare(caller, jobId, applicationIds);

    expect(twoCards[0].scorecards).toEqual({
      count: 2,
      average: {
        technicalSkills: 4.5,
        problemSolving: 3.5,
        communication: 3.5,
        cultureFit: 3.5,
      },
      recommendations: [
        { interviewerName: 'Lê Minh', recommendation: ScorecardRecommendation.strong_yes },
        { interviewerName: 'Võ Lan', recommendation: ScorecardRecommendation.yes },
      ],
    });
    expect(twoCards[1].scorecards).toEqual(expectedItems[1].scorecards);

    prisma.interviewScorecard.findMany.mockResolvedValue([
      ...[1, 2, 2].map((score, index) => ({
        ...firstScorecard,
        id: `scorecard-${index + 3}`,
        interviewId: `interview-${index + 3}`,
        technicalSkills: score,
        problemSolving: score,
        communication: score,
        cultureFit: score,
      })),
      secondScorecard,
    ]);
    const threeCards = await service.compare(caller, jobId, applicationIds);

    expect(threeCards[0].scorecards.count).toBe(3);
    expect(threeCards[0].scorecards.average).toEqual({
      technicalSkills: 1.7,
      problemSolving: 1.7,
      communication: 1.7,
      cultureFit: 1.7,
    });
    expect(threeCards[1].scorecards).toEqual(expectedItems[1].scorecards);
  });

  it('keeps a cancelled application in the comparison', async () => {
    prisma.application.findMany.mockResolvedValue([
      applications[1],
      { ...applications[0], status: ApplicationStatus.cancelled },
    ]);

    await expect(service.compare(caller, jobId, applicationIds)).resolves.toEqual([
      { ...expectedItems[0], status: ApplicationStatus.cancelled },
      expectedItems[1],
    ]);
  });

  it('has no ranking field and performs no write', async () => {
    const result = await service.compare(caller, jobId, applicationIds);

    expect(result).toEqual(expectedItems);
    for (const item of result) {
      for (const field of ['rank', 'best', 'score']) {
        expect(item).not.toHaveProperty(field);
      }
    }
    const writeMethods = new Set([
      'create',
      'createMany',
      'update',
      'upsert',
      'delete',
      'updateMany',
      'deleteMany',
    ]);
    for (const [modelName, methods] of Object.entries(prisma)) {
      if (modelName === '$transaction') continue;
      for (const [methodName, mock] of Object.entries(methods)) {
        if (writeMethods.has(methodName)) {
          expect(mock).not.toHaveBeenCalled();
        }
      }
    }
  });

  it('refuses a candidate', async () => {
    const candidate = callerOf(UserRole.candidate, { userId: 'candidate-1' });
    const call = service.compare(candidate, jobId, applicationIds);

    await expect(call).rejects.toBeInstanceOf(ForbiddenException);
    await expect(call).rejects.toMatchObject({ status: 403 });
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.groupBy).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });
});

describe('CompareApplicationsQueryDto', () => {
  it('rejects 1 and 5 ids, duplicate ids and non-UUID ids', async () => {
    for (const { applicationIds: ids, constraint } of [
      { applicationIds: [validIds[0]], constraint: 'arrayMinSize' },
      { applicationIds: validIds, constraint: 'arrayMaxSize' },
      { applicationIds: [validIds[0], validIds[0]], constraint: 'arrayUnique' },
      { applicationIds: [validIds[0], 'not-a-uuid'], constraint: 'isUuid' },
      { applicationIds: 42, constraint: 'isArray' },
    ]) {
      const instance: CompareApplicationsQueryDto = plainToInstance(CompareApplicationsQueryDto, {
        applicationIds: ids,
      });
      const errors = await validate(instance);

      expect(errors).toEqual([
        expect.objectContaining({
          property: 'applicationIds',
          constraints: expect.objectContaining({ [constraint]: expect.any(String) }),
        }),
      ]);
    }

    const split: CompareApplicationsQueryDto = plainToInstance(CompareApplicationsQueryDto, {
      applicationIds: 'a,b',
    });
    expect(split.applicationIds).toEqual(['a', 'b']);
    await expect(validate(split)).resolves.toEqual([
      expect.objectContaining({
        property: 'applicationIds',
        constraints: expect.objectContaining({ isUuid: expect.any(String) }),
      }),
    ]);

    for (const size of [2, 3, 4]) {
      const ids = validIds.slice(0, size);
      const arrayInstance: CompareApplicationsQueryDto = plainToInstance(CompareApplicationsQueryDto, {
        applicationIds: ids,
      });
      const stringInstance: CompareApplicationsQueryDto = plainToInstance(CompareApplicationsQueryDto, {
        applicationIds: ids.map((id) => ` ${id} `).join(','),
      });

      expect(arrayInstance.applicationIds).toEqual(ids);
      expect(stringInstance.applicationIds).toEqual(ids);
      await expect(validate(arrayInstance)).resolves.toEqual([]);
      await expect(validate(stringInstance)).resolves.toEqual([]);
    }

    const untrimmedIds = [` ${validIds[0]} `, validIds[1]];
    const arrayInstance: CompareApplicationsQueryDto = plainToInstance(CompareApplicationsQueryDto, {
      applicationIds: untrimmedIds,
    });
    expect(arrayInstance.applicationIds).toEqual(untrimmedIds);
  });
});
