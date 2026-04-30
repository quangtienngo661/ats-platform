import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvScreeningsService } from '../cv-screenings.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../../common/external-apis/gemini/gemini.service';
import { NotFoundException } from '@nestjs/common';
import { ScreeningStatus } from '@ats-platform/database';

@Processor('cv-screening')
export class CvScreeningProcessor extends WorkerHost {
  constructor(
    private readonly cvScreeningsService: CvScreeningsService,
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService
  ) {
    super();
  }

  /**
   * Entry point của BullMQ worker. Nhận job từ queue,
   * điều phối toàn bộ luồng screening từ fetch data đến lưu kết quả.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-cv-screening') {
      const { screeningId, cvId, applicationId, configId } = job.data;
      try {
        const {
          cvParsedData,
          parsedRequirements,
          aiConfig,
        } = await this.fetchScreeningContext(applicationId, cvId, configId);

        const screening = await this.prisma.cVScreening.update({
          where: { screeningId },
          data: {
            status: 'processing',
          }
        });

        if (!screening) throw new NotFoundException(`Screening ${screeningId} not found`);
        if (!cvParsedData) throw new NotFoundException(`CV Parsed Data ${cvId} not found`);

        const rawJson = this.getRawJson(cvParsedData, parsedRequirements);
        const geminiResult = await this.geminiService.screeningCV(screeningId, rawJson);

        await this.handleScreeningResult(screeningId, geminiResult, aiConfig);
      } catch (error) {
        await this.handleScreeningFailed(screeningId, error);
      }
    }
  }

  /**
   * Query một lần để lấy tất cả dữ liệu cần thiết
   */
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
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    return {
      cvParsedData,
      parsedRequirements: application.jobPosting?.parsedRequirements,
      aiConfig,
    };
  }

  private getRawJson(cvData: any, jobData: any): string {
    const rawCvJson = (JSON.stringify(cvData)).replace(/\s+/g, ' ');
    const rawJobJson = (JSON.stringify(jobData)).replace(/\s+/g, ' ');
    return `{
      "cvData": ${rawCvJson},
      "jobData": ${rawJobJson}
    }`;
  }

  /**
   * Nhận raw result từ Gemini, tính overallScore và recommendation, update CV_Screening record
   */
  private async handleScreeningResult(screeningId: string, geminiResult, config: any): Promise<any> {
    if (!config) config = await this.prisma.aiConfig.findFirst({ where: { isDefault: true } });
    if (!config) throw new NotFoundException('No default AI Config found');
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
    await this.prisma.cVScreening.update({
      where: { screeningId },
      data: {
        status: ScreeningStatus.completed, // enum ScreeningStatus.success
        overallScore: overallScore,
        aiRecommendation: recommendation,
        aiReasoning: ai_reasoning,
        matchedSkills: { hardSkills: matched_skills, niceToHaveSkills: matched_nice_to_haves },
        missingSkills: missing_skills,
        screenedAt: new Date(),
      }
    });
  }

  /**
   * Được gọi khi job fail sau 3 lần retry. Update CV_Screening trạng thái failed
   */
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
}
