import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CopilotDecisionType, Prisma } from '@ats-platform/database';
import { effectiveScreeningScores } from '@ats-platform/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LlmService } from '../../common/external-apis/llm/llm.service';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { ApplicationsService } from '../applications/applications.service';
import { applicationIncludeOptions } from '../../common/utils/include-options.util';
import { CopilotFacts, CopilotSuggestion, suggestNextStep } from './copilot-rules';

export const SUGGESTION_CHANGED_MESSAGE = 'Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.';
export const NOT_APPLICABLE_MESSAGE = 'Gợi ý này không áp dụng tự động được; hãy mở hồ sơ để xử lý.';
export const EXPLAIN_UNAVAILABLE_MESSAGE =
  'Chưa tạo được giải thích, hãy dùng các lý do bên dưới.';

const factsSelect = {
  applicationId: true,
  organizationId: true,
  status: true,
  currentStageSince: true,
  screening: {
    select: {
      status: true,
      overallScore: true,
      skillsScore: true,
      experienceScore: true,
      educationScore: true,
      reviewedAt: true,
      reviewedOverallScore: true,
      reviewedSkillsScore: true,
      reviewedExperienceScore: true,
      reviewedEducationScore: true,
      aiConfig: { select: { minimumScoreThreshold: true } },
    },
  },
  schedules: {
    select: {
      status: true,
      startAt: true,
      durationMinutes: true,
      scorecard: { select: { recommendation: true } },
    },
  },
} satisfies Prisma.ApplicationSelect;

type FactsRow = Prisma.ApplicationGetPayload<{ select: typeof factsSelect }>;

export function toCopilotFacts(row: FactsRow): CopilotFacts {
  const screening = row.screening;
  return {
    status: row.status,
    currentStageSince: row.currentStageSince,
    screening: screening
      ? (() => {
          const effective = effectiveScreeningScores(screening);
          const threshold = Number(screening.aiConfig.minimumScoreThreshold);
          return {
            status: screening.status,
            overall: effective.overall,
            isReviewed: effective.isReviewed,
            threshold: Number.isFinite(threshold) ? threshold : null,
          };
        })()
      : null,
    schedules: row.schedules.map((s) => ({
      status: s.status,
      startAt: s.startAt,
      durationMinutes: s.durationMinutes,
      scorecardRecommendation: s.scorecard?.recommendation ?? null,
    })),
  };
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly llm: LlmService,
  ) {}

  /** R11: one suggestion per application of the job the caller may see, minus the dismissed ones. */
  async suggestionsForJob(
    caller: TenantCaller,
    jobId: string,
    now: Date = new Date(),
  ): Promise<Record<string, CopilotSuggestion>> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { organizationId: true, departmentId: true },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    await this.applications.assertCanAccessDepartment(caller, job);

    const rows = await this.prisma.application.findMany({
      where: { jobId },
      select: factsSelect,
    });
    const dismissed = await this.dismissedKeys(rows.map((r) => r.applicationId));

    const result: Record<string, CopilotSuggestion> = {};
    for (const row of rows) {
      const suggestion = suggestNextStep(toCopilotFacts(row), now);
      if (suggestion && !dismissed.has(`${row.applicationId}|${suggestion.key}`)) {
        result[row.applicationId] = suggestion;
      }
    }
    return result;
  }

  /** R12: re-decide, refuse a stale key, then act through the existing services. */
  async apply(caller: TenantCaller, applicationId: string, key: string, now: Date = new Date()) {
    const { row, suggestion } = await this.current(caller, applicationId, key, now);

    if (suggestion.action.type === 'move_status') {
      await this.applications.updateStatus(applicationId, caller, {
        status: suggestion.action.to,
        notes: `Áp dụng gợi ý co-pilot: ${suggestion.title}`,
      });
    } else if (suggestion.action.type === 'run_screening') {
      await this.applications.triggerScreening(applicationId, caller);
    } else {
      throw new BadRequestException(NOT_APPLICABLE_MESSAGE);
    }

    await this.record(caller, row, suggestion, CopilotDecisionType.accepted);
    // The Kanban replaces the card with this, as it does after a drag.
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: applicationIncludeOptions,
    });
    return { applied: suggestion.ruleId, application };
  }

  /** R13: hide this suggestion until the application moves on. */
  async dismiss(caller: TenantCaller, applicationId: string, key: string, now: Date = new Date()) {
    const { row, suggestion } = await this.current(caller, applicationId, key, now);
    await this.record(caller, row, suggestion, CopilotDecisionType.dismissed);
    return { dismissed: suggestion.ruleId };
  }

  /** R14: a short explanation written by the LLM from facts already decided by the rules. */
  async explain(caller: TenantCaller, applicationId: string, now: Date = new Date()) {
    await this.applications.assertCanAccessApplication(caller, applicationId);
    const row = await this.loadFacts(applicationId);
    const facts = toCopilotFacts(row);
    const suggestion = suggestNextStep(facts, now);
    if (!suggestion) throw new BadRequestException('Hồ sơ này hiện không có gợi ý');

    try {
      const result = await this.llm.explainSuggestion(
        applicationId,
        JSON.stringify({ suggestion: { title: suggestion.title, reasons: suggestion.reasons }, status: facts.status }),
        row.organizationId,
      );
      const explanation = typeof result?.explanation === 'string' ? result.explanation.trim() : '';
      if (!explanation) throw new Error('empty explanation');
      return { explanation };
    } catch (error) {
      this.logger.warn(`Copilot explanation failed for ${applicationId}: ${(error as Error).message}`);
      throw new ServiceUnavailableException(EXPLAIN_UNAVAILABLE_MESSAGE);
    }
  }

  private async current(caller: TenantCaller, applicationId: string, key: string, now: Date) {
    await this.applications.assertCanAccessApplication(caller, applicationId);
    const row = await this.loadFacts(applicationId);
    const suggestion = suggestNextStep(toCopilotFacts(row), now);
    if (!suggestion || suggestion.key !== key) {
      throw new ConflictException(SUGGESTION_CHANGED_MESSAGE);
    }
    return { row, suggestion };
  }

  private async loadFacts(applicationId: string): Promise<FactsRow> {
    const row = await this.prisma.application.findUnique({
      where: { applicationId },
      select: factsSelect,
    });
    if (!row) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    return row;
  }

  private async dismissedKeys(applicationIds: string[]): Promise<Set<string>> {
    if (applicationIds.length === 0) return new Set();
    const rows = await this.prisma.copilotDecision.findMany({
      where: { applicationId: { in: applicationIds }, decision: CopilotDecisionType.dismissed },
      select: { applicationId: true, suggestionKey: true },
    });
    return new Set(rows.map((r) => `${r.applicationId}|${r.suggestionKey}`));
  }

  private async record(
    caller: TenantCaller,
    row: FactsRow,
    suggestion: CopilotSuggestion,
    decision: CopilotDecisionType,
  ) {
    await this.prisma.copilotDecision.create({
      data: {
        organizationId: row.organizationId,
        applicationId: row.applicationId,
        ruleId: suggestion.ruleId,
        suggestionKey: suggestion.key,
        decision,
        decidedById: caller.userId,
      },
    });
  }
}
