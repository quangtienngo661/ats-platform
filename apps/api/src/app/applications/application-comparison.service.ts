import {
  AiRecommendation,
  ApplicationStatus,
  Prisma,
  ScorecardRecommendation,
} from '@ats-platform/database';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertInCallerOrganizationOr404,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { ApplicationsService } from './applications.service';

export type ComparisonItem = {
  applicationId: string;
  candidateName: string;
  status: ApplicationStatus;
  appliedAt: Date;
  screening: {
    overallScore: number | null;
    skillsScore: number | null;
    experienceScore: number | null;
    educationScore: number | null;
    aiRecommendation: AiRecommendation | null;
    matchedSkills: unknown;
    missingSkills: unknown;
  } | null;
  scorecards: {
    count: number;
    average: {
      technicalSkills: number | null;
      problemSolving: number | null;
      communication: number | null;
      cultureFit: number | null;
    };
    recommendations: {
      interviewerName: string;
      recommendation: ScorecardRecommendation;
    }[];
  };
  noteCount: number;
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

@Injectable()
export class ApplicationComparisonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async compare(
    caller: TenantCaller,
    jobId: string,
    applicationIds: string[],
  ): Promise<ComparisonItem[]> {
    const job = await this.prisma.jobPosting.findUnique({ where: { jobId } });
    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }
    assertInCallerOrganizationOr404(
      caller,
      job.organizationId,
      'Không tìm thấy tin tuyển dụng',
    );

    const applications = await this.prisma.application.findMany({
      where: { applicationId: { in: applicationIds } },
      select: {
        applicationId: true,
        jobId: true,
        status: true,
        appliedAt: true,
        candidate: { select: { user: { select: { fullName: true } } } },
        screening: {
          select: {
            overallScore: true,
            skillsScore: true,
            experienceScore: true,
            educationScore: true,
            aiRecommendation: true,
            matchedSkills: true,
            missingSkills: true,
          },
        },
      },
    });
    if (
      applications.length < applicationIds.length ||
      applications.some((application) => application.jobId !== jobId)
    ) {
      throw new BadRequestException('Chỉ so sánh 2–4 ứng viên của cùng một tin');
    }

    for (const applicationId of applicationIds) {
      await this.applicationsService.assertCanAccessApplication(caller, applicationId);
    }

    const scorecards = await this.prisma.interviewScorecard.findMany({
      where: { interview: { applicationId: { in: applicationIds } } },
      select: {
        technicalSkills: true,
        problemSolving: true,
        communication: true,
        cultureFit: true,
        recommendation: true,
        interview: { select: { applicationId: true } },
        author: { select: { fullName: true } },
      },
    });
    const noteCounts = await this.prisma.applicationNote.groupBy({
      by: ['applicationId'],
      where: { applicationId: { in: applicationIds } },
      _count: { _all: true },
    });
    const applicationsById = new Map(
      applications.map((application) => [application.applicationId, application]),
    );
    const noteCountsById = new Map(
      noteCounts.map((noteCount) => [noteCount.applicationId, noteCount._count._all]),
    );

    return applicationIds.map((applicationId) => {
      const application = applicationsById.get(applicationId)!;
      const { screening } = application;
      const applicationScorecards = scorecards.filter(
        (scorecard) => scorecard.interview.applicationId === applicationId,
      );
      const average = (field: keyof ComparisonItem['scorecards']['average']) => {
        if (applicationScorecards.length === 0) return null;
        const total = applicationScorecards.reduce((sum, scorecard) => sum + scorecard[field], 0);
        return Math.round((total / applicationScorecards.length) * 10) / 10;
      };

      return {
        applicationId,
        candidateName: application.candidate.user.fullName,
        status: application.status,
        appliedAt: application.appliedAt,
        screening: screening
          ? {
              overallScore: decimalToNumber(screening.overallScore),
              skillsScore: decimalToNumber(screening.skillsScore),
              experienceScore: decimalToNumber(screening.experienceScore),
              educationScore: decimalToNumber(screening.educationScore),
              aiRecommendation: screening.aiRecommendation,
              matchedSkills: screening.matchedSkills,
              missingSkills: screening.missingSkills,
            }
          : null,
        scorecards: {
          count: applicationScorecards.length,
          average: {
            technicalSkills: average('technicalSkills'),
            problemSolving: average('problemSolving'),
            communication: average('communication'),
            cultureFit: average('cultureFit'),
          },
          recommendations: applicationScorecards.map((scorecard) => ({
            interviewerName: scorecard.author.fullName,
            recommendation: scorecard.recommendation,
          })),
        },
        noteCount: noteCountsById.get(applicationId) ?? 0,
      };
    });
  }
}
