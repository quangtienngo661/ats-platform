import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiConfig, AiRecommendation, Prisma, ScreeningStatus, UserRole } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { cvScreeningIncludeOptions } from '../../common/utils/include-options.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProcessCvScreeningJobData } from './processors/cv-screenings.processor';

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

@Injectable()
export class CvScreeningsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cv-screening') private readonly screeningQueue: Queue<ProcessCvScreeningJobData, void, string>
  ) { }

  private async assertCanAccessJob(userId: string, role: UserRole, departmentId: string) {
    if (role === UserRole.admin) return;
    if (role !== UserRole.recruiter) {
      throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu sàng lọc này');
    }

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      select: { departmentId: true },
    });

    if (!recruiter || recruiter.departmentId !== departmentId) {
      throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu sàng lọc của khoa này');
    }
  }

  async createScreeningRecord(
    applicationId: string,
    cvId: string,
    configId?: string,
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
      where: { cvId }
    })

    if (!application) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển '${applicationId}'`);
    }

    if (!cv) {
      throw new NotFoundException(`Không tìm thấy CV '${cvId}'`);
    }

    const config = await this.getActiveConfig(configId);

    const screening = await this.prisma.cVScreening.upsert({
      where: { applicationId },
      create: {
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
      },
      include: {
        ...cvScreeningIncludeOptions,
      },
      omit: { cvId: true, applicationId: true }
    });

    await this.screeningQueue.add('process-cv-screening', {
      screeningId: screening.screeningId,
      cvId: cv.cvId,
      applicationId: application.applicationId,
      configId: config.configId,
    });

    return screening;
  }
  async getScreeningResult(
    applicationId: string,
    userId: string,
    role: UserRole,
  ): Promise<Prisma.CVScreeningGetPayload<{ include: typeof screeningResultIncludeOptions }>> {
    const screening = await this.prisma.cVScreening.findUnique({
      where: { applicationId },
      include: screeningResultIncludeOptions,
    });

    if (!screening) {
      throw new NotFoundException(`Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`);
    }

    await this.assertCanAccessJob(userId, role, screening.application.jobPosting.departmentId);

    return screening;
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
      throw new NotFoundException(`Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`);
    }

    if (screening.application.candidateId !== candidate.candidateId) {
      throw new NotFoundException(`Không tìm thấy kết quả sàng lọc cho đơn ứng tuyển '${applicationId}'`);
    }

    return {
      screeningId: screening.screeningId,
      applicationId: screening.applicationId,
      status: screening.status,
      matchedSkills: screening.matchedSkills,
      screenedAt: screening.screenedAt,
    };
  }
  async getScreeningStats(jobId: string, userId: string, role: UserRole): Promise<ScreeningStats> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { jobId: true, title: true, departmentId: true },
    });
    if (!job) throw new NotFoundException(`Không tìm thấy tin tuyển dụng '${jobId}'`);

    await this.assertCanAccessJob(userId, role, job.departmentId);

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
      [AiRecommendation.hire]: 0,
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
      job,
      total,
      byStatus,
      byRecommendation,
      averageScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null,
    };
  }
  calculateOverallScore(
    skillsScore: number,
    experienceScore: number,
    educationScore: number,
    config: { skillsWeight: number; experienceWeight: number; educationWeight: number },
  ): number {
    const wSkills = Number(config.skillsWeight);
    const wExp = Number(config.experienceWeight);
    const wEdu = Number(config.educationWeight);

    const raw = skillsScore * wSkills + experienceScore * wExp + educationScore * wEdu;
    return Math.round(raw * 100) / 100;
  }
  determineRecommendation(overallScore: number, threshold: number): AiRecommendation {
    const normalizedThreshold = this.normalizeMinimumScoreThreshold(threshold);

    if (overallScore >= normalizedThreshold + 20) {
      return AiRecommendation.hire;
    }
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
  async getActiveConfig(configId?: string): Promise<AiConfig> {
    if (configId) {
      const config = await this.prisma.aiConfig.findUnique({ where: { configId } });
      if (!config) {
        throw new NotFoundException(`Không tìm thấy cấu hình AI '${configId}'`);
      }
      return config;
    }

    const defaultConfig = await this.prisma.aiConfig.findFirst({ where: { isDefault: true } });
    if (!defaultConfig) {
      throw new NotFoundException(
        'Không tìm thấy cấu hình AI mặc định. Vui lòng thiết lập cấu hình AI trước',
      );
    }
    return defaultConfig;
  }
}
