import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvScreeningsService } from '../cv-screenings.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LlmService } from '../../../common/external-apis/llm/llm.service';
import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CandidateSkillSource,
  NotificationType,
  RelatedEntityType,
  ScreeningStatus,
} from '@ats-platform/database';
import type { RagMode } from '@ats-platform/types';
import { EmbeddingService } from '../../../common/external-apis/embedding/embedding.service';
import { VectorSearchService } from '../../../common/vector/vector-search.service';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { applicationIncludeOptions } from '../../../common/utils/include-options.util';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  DEFAULT_SKILL_MATCH_THRESHOLD,
  matchSkills,
  SkillMatch,
  SkillMatchResult,
} from '../skill-matcher';

export interface ProcessCvScreeningJobData {
  screeningId: string;
  cvId: string;
  applicationId: string;
  configId: string;
  notify?: boolean;
  /** Forces a screening mode (the consistency measurement does); normal jobs leave it out. */
  ragMode?: RagMode;
}

/** The outcome of matching the CV's skills to the posting's, and the mode that produced it. */
interface SkillMatchOutcome {
  ragMode: RagMode;
  /** Null when the match did not run (forced off, or the embeddings failed). */
  match: SkillMatchResult | null;
  /** False for a posting that lists no skills: there is nothing for the matcher to decide. */
  postingHasSkills: boolean;
}

const toPromptMatch = ({ name, cvSkill, similarity }: SkillMatch) => ({
  skill: name,
  cv_skill: cvSkill,
  similarity: Math.round(similarity * 100) / 100,
});

/** The distinct, non-blank technical skills of a parsed CV. */
function technicalSkills(cvParsedData: { skills?: unknown } | null): string[] {
  const skills = cvParsedData?.skills;
  const technical =
    skills && typeof skills === 'object' && !Array.isArray(skills)
      ? (skills as Record<string, unknown>).technical
      : undefined;
  const items = Array.isArray(technical)
    ? technical
    : typeof technical === 'string'
      ? technical.split(/[,;\n]/)
      : [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    const text = item.trim();
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      result.push(text);
    }
  }
  return result;
}

@Processor('cv-screening', { concurrency: 5 })
export class CvScreeningProcessor extends WorkerHost {
  private readonly logger = new Logger(CvScreeningProcessor.name);

  constructor(
    private readonly cvScreeningsService: CvScreeningsService,
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly socketIoService: SocketIoService,
    private readonly notificationsService: NotificationsService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearch: VectorSearchService,
    private readonly configService: ConfigService,
  ) {
    super();
  }
  async process(
    job: Job<ProcessCvScreeningJobData, void, string>,
  ): Promise<void> {
    if (job.name === 'process-cv-screening') {
      const { screeningId, cvId, applicationId, configId } = job.data;
      try {
        const { cvParsedData, parsedRequirements, aiConfig, application } =
          await this.fetchScreeningContext(applicationId, cvId, configId);
        const jobRoom = `job_${application.jobId}`;

        const screening = await this.prisma.cVScreening.update({
          where: { screeningId },
          data: {
            status: 'processing',
          },
        });

        if (!screening)
          throw new NotFoundException(
            `Không tìm thấy lượt sàng lọc ${screeningId}`,
          );
        if (!cvParsedData)
          throw new NotFoundException(
            `Không tìm thấy dữ liệu CV đã phân tích ${cvId}`,
          );

        const outcome = await this.matchSkillsForScreening(
          job.data,
          cvParsedData,
          application,
        );
        const rawJson = this.getRawJson(
          cvParsedData,
          parsedRequirements,
          outcome.match,
        );
        const llmResult = await this.llmService.screeningCV(
          screeningId,
          rawJson,
        );

        const updatedApplication = await this.handleScreeningResult(
          screeningId,
          llmResult,
          aiConfig,
          outcome,
        );
        await this.linkMatchedSkills(application.candidateId, outcome.match);

        // 4. Emit Job kết quả
        this.socketIoService.handleEmit(
          'cv-screening:completed',
          updatedApplication,
          jobRoom,
        );
        if (job.data.notify !== false) {
          await this.createNotificationSafe(
            application.jobPosting.recruiter.userId,
            'Sàng lọc AI hoàn tất',
            `AI đã hoàn tất sàng lọc CV cho ${updatedApplication.candidate?.user?.fullName ?? 'một ứng viên'}.`,
            applicationId,
          );
        }
      } catch (error) {
        const maxAttempts = job.opts.attempts ?? 1;
        const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

        this.logger.error(
          `CV screening ${screeningId} failed (attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`,
          error.stack,
        );

        if (!isFinalAttempt) {
          // Còn lượt retry — rethrow để BullMQ tự retry. Chưa ghi `failed` vào DB
          // và chưa báo hỏng cho recruiter, vì lần thử sau có thể thành công.
          throw error;
        }

        await this.emitScreeningCompletedFailure(applicationId);
        await this.handleScreeningFailed(screeningId, error);

        // Rethrow ngay cả ở lần cuối: nếu nuốt lỗi, BullMQ ghi nhận job là
        // `completed` dù nó đã thất bại, và hàng đợi mất dấu vết mọi thất bại.
        throw error;
      }
    }
  }
  private async fetchScreeningContext(
    applicationId: string,
    cvId: string,
    configId: string,
  ): Promise<any> {
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
                include: { skill: true },
              },
            },
          },
        },
      }),
      this.prisma.aiConfig.findUnique({
        where: { configId },
      }) || null,
    ]);

    if (!application) {
      throw new NotFoundException(
        `Không tìm thấy đơn ứng tuyển ${applicationId}`,
      );
    }

    return {
      cvParsedData,
      parsedRequirements: application.jobPosting?.parsedRequirements,
      aiConfig,
      application,
    };
  }

  /**
   * Which of the posting's skills the CV covers, by embedding similarity. Any failure to get
   * the embeddings (no OpenAI key, the API down, the database) degrades to the old behaviour —
   * the model matches skills itself — instead of failing the screening (R16).
   */
  private async matchSkillsForScreening(
    data: ProcessCvScreeningJobData,
    cvParsedData: { skills?: unknown } | null,
    application: any,
  ): Promise<SkillMatchOutcome> {
    const jobPostingSkills: {
      isRequired: boolean;
      skill: { skillId: string; name: string };
    }[] = application.jobPosting?.jobPostingSkills ?? [];
    const postingHasSkills = jobPostingSkills.length > 0;

    if (data.ragMode === 'none') {
      return { ragMode: 'none', match: null, postingHasSkills };
    }

    try {
      const cvTexts = technicalSkills(cvParsedData);
      let cvVectors: number[][] = [];
      let jobVectors = new Map<string, number[]>();
      // With nothing to compare there is nothing to embed or read.
      if (postingHasSkills && cvTexts.length > 0) {
        cvVectors = await this.embeddingService.embed(data.screeningId, cvTexts);
        jobVectors = await this.vectorSearch.readEmbeddings(
          'skill',
          jobPostingSkills.map(({ skill }) => skill.skillId),
        );
      }

      const match = matchSkills(
        cvTexts.map((text, index) => ({ text, vector: cvVectors[index] ?? [] })),
        jobPostingSkills.map(({ isRequired, skill }) => ({
          skillId: skill.skillId,
          name: skill.name,
          isRequired,
          vector: jobVectors.get(skill.skillId) ?? null,
        })),
        this.skillMatchThreshold(),
      );
      return { ragMode: 'skills', match, postingHasSkills };
    } catch (error) {
      this.logger.warn(
        `Skill match unavailable for screening ${data.screeningId}, screening without it: ${error.message}`,
      );
      return { ragMode: 'none', match: null, postingHasSkills };
    }
  }

  private skillMatchThreshold(): number {
    const configured = Number(this.configService.get('SKILL_MATCH_THRESHOLD'));
    return this.configService.get('SKILL_MATCH_THRESHOLD') === undefined ||
      !Number.isFinite(configured)
      ? DEFAULT_SKILL_MATCH_THRESHOLD
      : configured;
  }

  /** The candidate now demonstrably has these catalogue skills. A manual entry is never overwritten. */
  private async linkMatchedSkills(
    candidateId: string,
    match: SkillMatchResult | null,
  ): Promise<void> {
    if (!match) return;
    for (const { skillId } of [...match.matchedRequired, ...match.matchedOptional]) {
      try {
        await this.prisma.candidateSkill.upsert({
          where: { candidateId_skillId: { candidateId, skillId } },
          create: { candidateId, skillId, source: CandidateSkillSource.cv_parsed },
          update: {},
        });
      } catch (error) {
        this.logger.warn(
          `Could not link skill ${skillId} to candidate ${candidateId}: ${error.message}`,
        );
      }
    }
  }

  private getRawJson(
    cvData: any,
    jobData: any,
    skillMatch: SkillMatchResult | null = null,
  ): string {
    const rawCvJson = JSON.stringify(cvData ?? null);
    const rawJobJson = JSON.stringify(jobData ?? null);
    const skillMatchBlock = skillMatch
      ? `

<skill_match>
${JSON.stringify({
  matched_required: skillMatch.matchedRequired.map(toPromptMatch),
  matched_optional: skillMatch.matchedOptional.map(toPromptMatch),
  missing_required: skillMatch.missingRequired.map(({ name }) => name),
})}
</skill_match>`
      : '';

    return `<cv_data>
${rawCvJson}
</cv_data>

<jd_data>
${rawJobJson}
</jd_data>${skillMatchBlock}`;
  }
  private async handleScreeningResult(
    screeningId: string,
    llmResult,
    config: any,
    outcome: SkillMatchOutcome,
  ): Promise<any> {
    // Fallback only: createScreeningRecord always stores a config. When it is
    // missing, use the default of the SCREENING'S organization — never whichever
    // organization's default happens to come back first.
    if (!config) {
      const screening = await this.prisma.cVScreening.findUnique({
        where: { screeningId },
        select: { organizationId: true },
      });
      config = screening
        ? await this.prisma.aiConfig.findFirst({
            where: {
              isDefault: true,
              organizationId: screening.organizationId,
            },
          })
        : null;
    }
    if (!config)
      throw new NotFoundException('Không tìm thấy cấu hình AI mặc định');
    // Lưu ý: llmResult trả về thường là string JSON, bạn cần parse nó trước
    const {
      skills_score,
      experience_score,
      education_score,
      ai_reasoning,
      matched_skills,
      missing_skills,
      matched_nice_to_haves,
    } = llmResult;

    // 1. Dùng Service để tính điểm tổng hợp
    const overallScore = this.cvScreeningsService.calculateOverallScore(
      skills_score,
      experience_score,
      education_score,
      config,
    );
    // 2. Dùng Service để quyết định Recommendation
    const threshold = Number(config.minimumScoreThreshold);
    const recommendation = this.cvScreeningsService.determineRecommendation(
      overallScore,
      threshold,
    );
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
        ...this.skillLists(outcome, {
          matched_skills,
          matched_nice_to_haves,
          missing_skills,
        }),
        ragMode: outcome.ragMode,
        screenedAt: new Date(),
      },
    });

    const updatedApplication = await this.prisma.application.findUnique({
      where: { applicationId: screeningResult.applicationId },
      include: applicationIncludeOptions,
    });

    if (!updatedApplication) {
      throw new NotFoundException(
        `Không tìm thấy đơn ứng tuyển ${screeningResult.applicationId}`,
      );
    }

    return updatedApplication;
  }
  /**
   * The matched / missing lists to store (R7). The matcher's, whenever it ran on a posting that
   * lists skills; the model's own otherwise (match unavailable, or a posting with no skills to
   * match), which is what was stored before this feature.
   */
  private skillLists(
    outcome: SkillMatchOutcome,
    fromModel: {
      matched_skills: string[];
      matched_nice_to_haves: string[];
      missing_skills: string[];
    },
  ) {
    if (outcome.match && outcome.postingHasSkills) {
      return {
        matchedSkills: {
          hardSkills: outcome.match.matchedRequired.map(({ name }) => name),
          niceToHaveSkills: outcome.match.matchedOptional.map(({ name }) => name),
        },
        missingSkills: outcome.match.missingRequired.map(({ name }) => name),
      };
    }
    return {
      matchedSkills: {
        hardSkills: fromModel.matched_skills,
        niceToHaveSkills: fromModel.matched_nice_to_haves,
      },
      missingSkills: fromModel.missing_skills,
    };
  }

  private async handleScreeningFailed(
    screeningId: string,
    error: any,
  ): Promise<any> {
    await this.prisma.cVScreening.update({
      where: { screeningId },
      data: {
        status: 'failed',
        aiReasoning: null,
        screenedAt: new Date(),
        errorLog: error.message,
      },
    });
  }

  private async emitScreeningCompletedFailure(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { jobId: true },
    });

    if (application?.jobId) {
      this.socketIoService.handleEmit(
        'cv-screening:completed',
        null,
        `job_${application.jobId}`,
      );
      return;
    }

    Logger.warn(
      `Could not emit cv-screening failure for application ${applicationId}: application not found`,
      'CvScreeningProcessor',
    );
  }

  private async createNotificationSafe(
    userId: string,
    title: string,
    message: string,
    applicationId: string,
  ) {
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
