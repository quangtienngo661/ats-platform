import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvScreeningsService } from '../cv-screenings.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../../common/external-apis/gemini/gemini.service';
import { Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, RelatedEntityType, ScreeningStatus } from '@ats-platform/database';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { applicationIncludeOptions } from '../../../common/utils/include-options.util';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('cv-screening', { concurrency: 5 })
export class CvScreeningProcessor extends WorkerHost {
  constructor(
    private readonly cvScreeningsService: CvScreeningsService,
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly socketIoService: SocketIoService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-cv-screening') {
      const { screeningId, cvId, applicationId, configId } = job.data;
      try {
        const {
          cvParsedData,
          parsedRequirements,
          aiConfig,
          application,
        } = await this.fetchScreeningContext(applicationId, cvId, configId);
        const jobRoom = `job_${application.jobId}`;

        const screening = await this.prisma.cVScreening.update({
          where: { screeningId },
          data: {
            status: 'processing',
          }
        });

        if (!screening) throw new NotFoundException(`Không tìm thấy lượt sàng lọc ${screeningId}`);
        if (!cvParsedData) throw new NotFoundException(`Không tìm thấy dữ liệu CV đã phân tích ${cvId}`);

        const rawJson = this.getRawJson(cvParsedData, parsedRequirements);
        const geminiResult = await this.geminiService.screeningCV(screeningId, rawJson);

        const updatedApplication = await this.handleScreeningResult(screeningId, geminiResult, aiConfig);

        // 4. Emit Job kết quả
        this.socketIoService.handleEmit("cv-screening:completed", updatedApplication, jobRoom);
        await this.createNotificationSafe(
          application.jobPosting.recruiter.userId,
          'Sàng lọc AI hoàn tất',
          `AI đã hoàn tất sàng lọc CV cho ${updatedApplication.candidate?.user?.fullName ?? 'một ứng viên'}.`,
          applicationId,
        );
      } catch (error) {
        await this.emitScreeningCompletedFailure(applicationId);
        await this.handleScreeningFailed(screeningId, error);
      }
    }
  }
  private async fetchScreeningContext(applicationId: string, cvId: string, configId: string): Promise<any> {
    const [cvParsedData, application, aiConfig] = await Promise.all([
      this.prisma.cVParsedData.findUnique({
        where: { cvId },
      }),
      this.prisma.application.findUnique({
        where: { applicationId },
        include: {
          jobPosting: {
            include: {
              recruiter: {
                select: { userId: true },
              },
              jobPostingSkills: {
                include: { skill: true }
              }
            }
          }
        }
      }),
      this.prisma.aiConfig.findUnique({
        where: { configId },
      }) || null,
    ]);

    if (!application) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển ${applicationId}`);
    }

    return {
      cvParsedData,
      parsedRequirements: application.jobPosting?.parsedRequirements,
      aiConfig,
      application,
    };
  }

  private getRawJson(cvData: any, jobData: any): string {
    const rawCvJson = JSON.stringify(cvData ?? null);
    const rawJobJson = JSON.stringify(jobData ?? null);

    return `<cv_data>
${rawCvJson}
</cv_data>

<jd_data>
${rawJobJson}
</jd_data>`;
  }
  private async handleScreeningResult(screeningId: string, geminiResult, config: any): Promise<any> {
    if (!config) config = await this.prisma.aiConfig.findFirst({ where: { isDefault: true } });
    if (!config) throw new NotFoundException('Không tìm thấy cấu hình AI mặc định');
    // Lưu ý: geminiResult trả về thường là string JSON, bạn cần parse nó trước
    const {
      skills_score,
      experience_score,
      education_score,
      ai_reasoning,
      matched_skills,
      missing_skills,
      matched_nice_to_haves
    } = geminiResult;

    // 1. Dùng Service để tính điểm tổng hợp
    const overallScore = this.cvScreeningsService.calculateOverallScore(
      skills_score,
      experience_score,
      education_score,
      config
    );
    // 2. Dùng Service để quyết định Recommendation
    const threshold = Number(config.minimumScoreThreshold);
    const recommendation = this.cvScreeningsService.determineRecommendation(overallScore, threshold);
    // 3. Update DB (Có thể viết thêm 1 hàm 'updateScreeningResult' ở Service hoặc update thẳng tại đây bằng Prisma)
    const screeningResult = await this.prisma.cVScreening.update({
      where: { screeningId },
      data: {
        skillsScore: skills_score,
        experienceScore: experience_score,
        educationScore: education_score,
        status: ScreeningStatus.completed,
        overallScore: overallScore,
        aiRecommendation: recommendation,
        aiReasoning: ai_reasoning,
        matchedSkills: { hardSkills: matched_skills, niceToHaveSkills: matched_nice_to_haves },
        missingSkills: missing_skills,
        screenedAt: new Date(),
      }
    });

    const updatedApplication = await this.prisma.application.findUnique({
      where: { applicationId: screeningResult.applicationId },
      include: applicationIncludeOptions
    });

    if (!updatedApplication) {
      throw new NotFoundException(`Không tìm thấy đơn ứng tuyển ${screeningResult.applicationId}`);
    }

    return updatedApplication


  }
  private async handleScreeningFailed(screeningId: string, error: any): Promise<any> {
    await this.prisma.cVScreening.update({
      where: { screeningId },
      data: {
        status: 'failed',
        aiReasoning: null,
        screenedAt: new Date(),
        errorLog: error.message,
      }
    });
  }

  private async emitScreeningCompletedFailure(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { jobId: true },
    });

    if (application?.jobId) {
      this.socketIoService.handleEmit("cv-screening:completed", null, `job_${application.jobId}`);
      return;
    }

    Logger.warn(
      `Could not emit cv-screening failure for application ${applicationId}: application not found`,
      'CvScreeningProcessor',
    );
  }

  private async createNotificationSafe(userId: string, title: string, message: string, applicationId: string) {
    try {
      await this.notificationsService.create({
        userId,
        type: NotificationType.application,
        title,
        message,
        relatedEntityId: applicationId,
        relatedEntityType: RelatedEntityType.application,
      });
    } catch (error) {
      Logger.warn(
        `Failed to create CV screening notification for user ${userId}: ${error.message}`,
        'CvScreeningProcessor',
      );
    }
  }
}
