import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AiConfig,
  AiRecommendation,
  Prisma,
  ScreeningStatus,
} from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  applicationIncludeOptions,
  cvScreeningIncludeOptions,
} from '../../common/utils/include-options.util';
import { SocketIoService } from '../../common/socket-io/socket-io.service';
import { ReviewScreeningDto } from './dto/review-screening.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProcessCvScreeningJobData } from './processors/cv-screenings.processor';
import {
  assertOrganizationAccess,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';

const screeningResultIncludeOptions = {
  aiConfig: {
    select: {
      configId: true,
      name: true,
      skillsWeight: true,
      experienceWeight: true,
      educationWeight: true,
      minimumScoreThreshold: true,
    },
  },
  application: {
    select: {
      applicationId: true,
      status: true,
      candidateId: true,
      jobId: true,
      jobPosting: {
        select: { departmentId: true },
      },
    },
  },
} satisfies Prisma.CVScreeningInclude;

interface ScreeningResultForCandidate {
  screeningId: string;
  applicationId: string;
  status: ScreeningStatus;
  matchedSkills: Prisma.JsonValue | null;
  screenedAt: Date | null;
}

interface ScreeningStatsJobSummary {
  jobId: string;
  title: string;
  departmentId: string;
}

interface ScreeningStats {
  job: ScreeningStatsJobSummary;
  total: number;
  byStatus: Record<ScreeningStatus, number>;
  byRecommendation: Record<AiRecommendation, number>;
  averageScore: number | null;
}

/** Rounds to the one decimal the Decimal(5,1) score columns keep, half up (72.55 → 72.6). */
function roundScore(value: number): number {
  return new Prisma.Decimal(value)
    .toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
}

@Injectable()
export class CvScreeningsService {
  private readonly logger = new Logger(CvScreeningsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cv-screening')
    private readonly screeningQueue: Queue<
      ProcessCvScreeningJobData,
      void,
      string
    >,
    private readonly socketIoService: SocketIoService,
  ) {}

  private async assertCanAccessJob(
    caller: TenantCaller,
    resource: { organizationId: string; departmentId: string },
  ) {
    // Platform admin, and an org_admin inside the organization, stop here.
    if (assertOrganizationAccess(caller, resource.organizationId)) return;

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: caller.userId },
      select: { departmentId: true },
    });

    if (!recruiter || recruiter.departmentId !== resource.departmentId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập dữ liệu sàng lọc của khoa này',
      );
    }
  }

  async createScreeningRecord(
    applicationId: string,
    cvId: string,
    configId?: string,
    options: { notify?: boolean } = {},
  ): Promise<
    Prisma.CVScreeningGetPayload<{
      include: typeof cvScreeningIncludeOptions;
      omit: { cvId: true; applicationId: true };
    }>
  > {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
    });

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
    });

    if (!application) {
      throw new NotFoundException(
        `Không tìm thấy đơn ứng tuyển '${applicationId}'`,
      );
    }

    if (!cv) {
      throw new NotFoundException(`Không tìm thấy CV '${cvId}'`);
    }

    const config = await this.getActiveConfig(
      application.organizationId,
      configId,
    );

    const screening = await this.prisma.cVScreening.upsert({
      where: { applicationId },
      create: {
        // The screening belongs to the organization that owns the application.
        organizationId: application.organizationId,
        applicationId,
        cvId,
        configId: config.configId,
        status: ScreeningStatus.pending,
      },
      update: {
        configId: config.configId,
        status: ScreeningStatus.processing,
        retryCount: { increment: 1 },
        overallScore: null,
        aiRecommendation: null,
        aiReasoning: null,
        matchedSkills: null,
        missingSkills: null,
        errorLog: null,
        screenedAt: null,
        // A new screening replaces the scores a reviewer saw, so their review goes too (R10).
        reviewedById: null,
        reviewedAt: null,
        reviewedSkillsScore: null,
        reviewedExperienceScore: null,
        reviewedEducationScore: null,
        reviewedOverallScore: null,
        reviewNote: null,
      },
      include: {
        ...cvScreeningIncludeOptions,
      },
      omit: { cvId: true, applicationId: true },
    });

    await this.screeningQueue.add('process-cv-screening', {
      screeningId: screening.screeningId,
      cvId: cv.cvId,
      applicationId: application.applicationId,
      configId: config.configId,
      ...(options.notify === false ? { notify: false } : {}),
    });

    return screening;
  }
  async getScreeningResult(
    applicationId: string,
    caller: TenantCaller,
  ): Promise<
    Prisma.CVScreeningGetPayload<{
      include: typeof screeningResultIncludeOptions;
    }>
  > {
    const screening = await this.prisma.cVScreening.findUnique({
      where: { applicationId },
      include: screeningResultIncludeOptions,
    });

    if (!screening) {
      throw new NotFoundException(
        `Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`,
      );
    }

    await this.assertCanAccessJob(caller, {
      organizationId: screening.organizationId,
      departmentId: screening.application.jobPosting.departmentId,
    });

    return screening;
  }

  /**
   * A recruiter confirms or corrects the three AI sub-scores of a completed
   * screening. Only the last review is kept. The overall score is recomputed from
   * the reviewed (rounded) sub-scores with the screening's own AI config.
   * Never touches Application.status or aiRecommendation (ADR 0002).
   */
  async reviewScreening(
    caller: TenantCaller,
    applicationId: string,
    dto: ReviewScreeningDto,
  ) {
    const screening = await this.prisma.cVScreening.findUnique({
      where: { applicationId },
      include: screeningResultIncludeOptions,
    });

    if (!screening) {
      throw new NotFoundException(
        `Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`,
      );
    }

    await this.assertCanAccessJob(caller, {
      organizationId: screening.organizationId,
      departmentId: screening.application.jobPosting.departmentId,
    });

    if (screening.status !== ScreeningStatus.completed) {
      throw new BadRequestException(
        'Chỉ duyệt được kết quả sàng lọc đã hoàn tất',
      );
    }

    const skills = roundScore(dto.skillsScore);
    const experience = roundScore(dto.experienceScore);
    const education = roundScore(dto.educationScore);
    const note = dto.note?.trim() || null;

    const sameAsAi = (reviewed: number, ai: Prisma.Decimal | null) =>
      ai !== null && roundScore(Number(ai)) === reviewed;
    const changed = !(
      sameAsAi(skills, screening.skillsScore) &&
      sameAsAi(experience, screening.experienceScore) &&
      sameAsAi(education, screening.educationScore)
    );
    if (changed && !note) {
      throw new BadRequestException('Vui lòng nhập lý do khi sửa điểm');
    }

    const { aiConfig } = screening;
    const overall = roundScore(
      this.calculateOverallScore(skills, experience, education, {
        skillsWeight: Number(aiConfig.skillsWeight),
        experienceWeight: Number(aiConfig.experienceWeight),
        educationWeight: Number(aiConfig.educationWeight),
      }),
    );

    const reviewed = await this.prisma.cVScreening.update({
      where: { applicationId },
      data: {
        reviewedById: caller.userId,
        reviewedAt: new Date(),
        reviewedSkillsScore: skills,
        reviewedExperienceScore: experience,
        reviewedEducationScore: education,
        reviewedOverallScore: overall,
        reviewNote: note,
      },
      include: screeningResultIncludeOptions,
    });

    await this.emitReviewed(applicationId, screening.application.jobId);

    return reviewed;
  }

  // Same payload shape as cv-screening:completed so the Kanban reuses its handler.
  // A failed emit must not undo a review that is already saved.
  private async emitReviewed(applicationId: string, jobId: string) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { applicationId },
        include: applicationIncludeOptions,
      });
      if (!application) return;
      this.socketIoService.handleEmit(
        'cv-screening:reviewed',
        application,
        `job_${jobId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not emit cv-screening:reviewed for application ${applicationId}: ${error.message}`,
      );
    }
  }

  async getScreeningResultForCandidate(
    applicationId: string,
    userId: string,
  ): Promise<ScreeningResultForCandidate> {
    const screening = await this.prisma.cVScreening.findUnique({
      where: { applicationId },
      include: {
        application: {
          select: { candidateId: true },
        },
      },
    });

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });

    if (!candidate) {
      throw new NotFoundException(`Không tìm thấy ứng viên '${userId}'`);
    }

    if (!screening) {
      throw new NotFoundException(
        `Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`,
      );
    }

    if (screening.application.candidateId !== candidate.candidateId) {
      throw new NotFoundException(
        `Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`,
      );
    }

    return {
      screeningId: screening.screeningId,
      applicationId: screening.applicationId,
      status: screening.status,
      matchedSkills: screening.matchedSkills,
      screenedAt: screening.screenedAt,
    };
  }
  async getScreeningStats(
    jobId: string,
    caller: TenantCaller,
  ): Promise<ScreeningStats> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: {
        jobId: true,
        title: true,
        departmentId: true,
        organizationId: true,
      },
    });
    if (!job)
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng '${jobId}'`);

    await this.assertCanAccessJob(caller, job);

    const screenings = await this.prisma.cVScreening.findMany({
      where: { application: { jobId } },
      select: {
        screeningId: true,
        status: true,
        overallScore: true,
        aiRecommendation: true,
      },
    });

    const total = screenings.length;
    const byStatus = {
      [ScreeningStatus.pending]: 0,
      [ScreeningStatus.processing]: 0,
      [ScreeningStatus.completed]: 0,
      [ScreeningStatus.failed]: 0,
    };
    const byRecommendation = {
      [AiRecommendation.interview]: 0,
      [AiRecommendation.reject]: 0,
    };

    let scoreSum = 0;
    let scoreCount = 0;

    for (const s of screenings) {
      byStatus[s.status]++;
      if (s.aiRecommendation) {
        byRecommendation[s.aiRecommendation]++;
      }
      if (s.overallScore !== null) {
        scoreSum += Number(s.overallScore);
        scoreCount++;
      }
    }

    return {
      // Listed field by field: `job` was widened to carry organizationId for the
      // access check, and that column is an internal filter, never response data.
      job: {
        jobId: job.jobId,
        title: job.title,
        departmentId: job.departmentId,
      },
      total,
      byStatus,
      byRecommendation,
      averageScore:
        scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null,
    };
  }
  calculateOverallScore(
    skillsScore: number,
    experienceScore: number,
    educationScore: number,
    config: {
      skillsWeight: number;
      experienceWeight: number;
      educationWeight: number;
    },
  ): number {
    const wSkills = Number(config.skillsWeight);
    const wExp = Number(config.experienceWeight);
    const wEdu = Number(config.educationWeight);

    const raw =
      skillsScore * wSkills + experienceScore * wExp + educationScore * wEdu;
    return Math.round(raw * 100) / 100;
  }
  determineRecommendation(
    overallScore: number,
    threshold: number,
  ): AiRecommendation {
    const normalizedThreshold = this.normalizeMinimumScoreThreshold(threshold);

    if (overallScore >= normalizedThreshold) {
      return AiRecommendation.interview;
    }
    return AiRecommendation.reject;
  }

  private normalizeMinimumScoreThreshold(threshold: number): number {
    const value = Number(threshold);
    if (!Number.isFinite(value)) return 0;
    if (value > 0 && value < 1) return value * 100;
    return value;
  }
  /**
   * The screening config for an application in `organizationId`: the one named, or
   * that organization's default. Configs are per organization (module spec
   * criterion 5), so neither lookup may reach another organization's rows — a
   * config id from elsewhere is reported as not found, not used.
   */
  async getActiveConfig(
    organizationId: string,
    configId?: string,
  ): Promise<AiConfig> {
    if (configId) {
      const config = await this.prisma.aiConfig.findFirst({
        where: { configId, organizationId },
      });
      if (!config) {
        throw new NotFoundException(`Không tìm thấy cấu hình AI '${configId}'`);
      }
      return config;
    }

    const defaultConfig = await this.prisma.aiConfig.findFirst({
      where: { isDefault: true, organizationId },
    });
    if (!defaultConfig) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình AI mặc định. Vui lòng thiết lập cấu hình AI trước',
      );
    }
    return defaultConfig;
  }
}
