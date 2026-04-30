import { Injectable, NotFoundException } from '@nestjs/common';
import { AiRecommendation, ScreeningStatus } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { cvScreeningIncludeOptions } from '../../common/utils/include-options.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CvScreeningsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cv-screening') private readonly screeningQueue: Queue
  ) { }

  /**
   * Tạo CV_Screening record với status pending ngay khi Application được tạo.
   * Nếu không truyền configId thì tự động lấy default AI_Config.
   * Sau đó push job vào BullMQ queue.
   */
  async createScreeningRecord(applicationId: string, cvId: string, configId?: string): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
    });

    const cv = await this.prisma.cV.findUnique({
      where: { cvId }
    })

    if (!application) {
      throw new NotFoundException(`Application '${applicationId}' not found`);
    }

    if (!cv) {
      throw new NotFoundException(`CV '${cvId}' not found`);
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
        status: ScreeningStatus.pending,
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

  /**
   * HR gọi để xem kết quả screening của một application cụ thể.
   * Trả về đầy đủ thông tin bao gồm score, recommendation, matched/missing skills.
   */
  async getScreeningResult(applicationId: string): Promise<any> {
    const screening = await this.prisma.cVScreening.findUnique({
      where: { applicationId },
      include: {
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
          },
        },
      },
    });

    if (!screening) {
      throw new NotFoundException(`Screening result for application '${applicationId}' not found`);
    }

    return screening;
  }

  /**
   * Giống getScreeningResult nhưng filter output — chỉ trả về matchedSkills và trạng thái chung.
   * Ẩn overallScore, missingSkills, aiRecommendation.
   */
  async getScreeningResultForCandidate(applicationId: string, userId: string): Promise<any> {
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
      throw new NotFoundException(`Candidate '${userId}' not found`);
    }

    if (!screening) {
      throw new NotFoundException(`Screening result for application '${applicationId}' not found`);
    }

    if (screening.application.candidateId !== candidate.candidateId) {
      throw new NotFoundException(`Screening result for application '${applicationId}' not found`);
    }

    return {
      screeningId: screening.screeningId,
      applicationId: screening.applicationId,
      status: screening.status,
      matchedSkills: screening.matchedSkills,
      screenedAt: screening.screenedAt,
    };
  }

  /**
   * HR xem tổng quan chất lượng pool candidate của một job
   */
  async getScreeningStats(jobId: string): Promise<any> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { jobId: true, title: true },
    });
    if (!job) throw new NotFoundException(`Job posting '${jobId}' not found`);

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

  /**
   * Tính điểm tổng theo công thức từ AI_Config
   */
  calculateOverallScore(
    skillsScore: number,
    experienceScore: number,
    educationScore: number,
    config: { skillsWeight: any; experienceWeight: any; educationWeight: any },
  ): number {
    const wSkills = Number(config.skillsWeight);
    const wExp = Number(config.experienceWeight);
    const wEdu = Number(config.educationWeight);

    const raw = skillsScore * wSkills + experienceScore * wExp + educationScore * wEdu;
    // Round to 2 decimal places
    return Math.round(raw * 100) / 100;
  }

  /**
   * So sánh overallScore với minimum_score_threshold để ra recommendation
   * >= threshold + 20  → hire
   * >= threshold       → interview
   * < threshold        → reject
   */
  determineRecommendation(overallScore: number, threshold: number): AiRecommendation {
    if (overallScore >= threshold + 20) {
      return AiRecommendation.hire;
    }
    if (overallScore >= threshold) {
      return AiRecommendation.interview;
    }
    return AiRecommendation.reject;
  }

  /**
   * Lấy AI_Config để dùng cho screening.
   * Nếu có configId thì lấy config đó, không thì lấy config có is_default = true.
   */
  async getActiveConfig(configId?: string): Promise<any> {
    if (configId) {
      const config = await this.prisma.aiConfig.findUnique({ where: { configId } });
      if (!config) {
        throw new NotFoundException(`AI config '${configId}' not found`);
      }
      return config;
    }

    const defaultConfig = await this.prisma.aiConfig.findFirst({ where: { isDefault: true } });
    if (!defaultConfig) {
      throw new NotFoundException(
        'No default AI configuration found. Please set up an AI configuration first',
      );
    }
    return defaultConfig;
  }
}
