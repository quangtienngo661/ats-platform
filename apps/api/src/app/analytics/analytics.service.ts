import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  isPlatformAdmin,
  organizationScope,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { ApplicationsService } from '../applications/applications.service';
import {
  averageDaysToHire,
  dailyTrend,
  funnel,
  outcomes,
  timeInStage,
} from './recruitment-metrics';
import { AiCostQueryDto, RecruitmentAnalyticsQueryDto } from './dto/recruitment-analytics-query.dto';
import { ModelPriceDto } from './dto/model-price.dto';
import { summarizeCost, UsageGroupRow } from '../ai-usage-logs/ai-cost';

const DAY = 86_400_000;

interface RawUsageRow {
  month: string;
  action_type: string;
  model_name: string;
  calls: bigint;
  failed_calls: bigint;
  prompt_tokens: bigint;
  completion_tokens: bigint;
}
export const DEFAULT_RANGE_DAYS = 30;
export const MAX_RANGE_DAYS = 366;
export const RECENT_LIMIT = 6;
export const OTHER_ORGANIZATION_MESSAGE = 'Bạn không có quyền xem thống kê của tổ chức khác';

/** The reporting period: `to` defaults to now, `from` to 30 days before it (R17). */
export function resolveRange(query: { from?: string; to?: string }, now: Date) {
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Khoảng thời gian không hợp lệ');
  }
  if (from.getTime() > to.getTime()) {
    throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY) {
    throw new BadRequestException(`Khoảng thống kê tối đa ${MAX_RANGE_DAYS} ngày`);
  }
  return { from, to };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
  ) {}

  /**
   * Which applications the caller may count. Same boundaries as the Kanban:
   * platform admin everything (or one organization on request), org_admin its
   * organization, recruiter its department.
   */
  async scopeFor(
    caller: TenantCaller,
    query: { organizationId?: string; jobId?: string },
  ): Promise<Prisma.ApplicationWhereInput> {
    const where: Prisma.ApplicationWhereInput = { ...organizationScope(caller) };

    if (query.organizationId) {
      if (isPlatformAdmin(caller.role)) {
        where.organizationId = query.organizationId;
      } else if (query.organizationId !== caller.organizationId) {
        throw new ForbiddenException(OTHER_ORGANIZATION_MESSAGE);
      }
    }

    if (caller.role === UserRole.recruiter) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId: caller.userId },
        select: { departmentId: true },
      });
      if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
      where.jobPosting = { departmentId: recruiter.departmentId };
    }

    if (query.jobId) {
      const job = await this.prisma.jobPosting.findUnique({
        where: { jobId: query.jobId },
        select: { organizationId: true, departmentId: true },
      });
      if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
      await this.applications.assertCanAccessDepartment(caller, job);
      where.jobId = query.jobId;
    }
    return where;
  }

  async recruitment(caller: TenantCaller, query: RecruitmentAnalyticsQueryDto, now: Date = new Date()) {
    const { from, to } = resolveRange(query, now);
    const scope = await this.scopeFor(caller, query);

    const [cohort, recent, openJobs] = await Promise.all([
      this.prisma.application.findMany({
        where: { ...scope, appliedAt: { gte: from, lte: to } },
        select: {
          applicationId: true,
          status: true,
          appliedAt: true,
          history: {
            select: { fromStatus: true, toStatus: true, changedAt: true },
            orderBy: { changedAt: 'asc' },
          },
        },
      }),
      // A-04: the newest applications come from the database, not from slicing a whole board.
      this.prisma.application.findMany({
        where: scope,
        orderBy: { appliedAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          applicationId: true,
          jobId: true,
          status: true,
          appliedAt: true,
          candidate: { select: { user: { select: { fullName: true } } } },
          jobPosting: { select: { title: true } },
        },
      }),
      this.prisma.jobPosting.count({ where: this.jobScope(scope) }),
    ]);

    const steps = funnel(cohort);
    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        applications: cohort.length,
        openJobs,
        hired: steps[steps.length - 1].reached,
        averageDaysToHire: averageDaysToHire(cohort),
      },
      funnel: steps,
      outcomes: outcomes(cohort),
      timeInStage: timeInStage(cohort),
      trend: dailyTrend(cohort, from, to),
      recent: recent.map((r) => ({
        applicationId: r.applicationId,
        jobId: r.jobId,
        jobTitle: r.jobPosting.title,
        candidateName: r.candidate.user.fullName,
        status: r.status,
        appliedAt: r.appliedAt.toISOString(),
      })),
    };
  }

  /**
   * R22: AI usage of a period by Vietnam-time month × action × model, priced. A platform admin
   * reads every organization (or one); an org_admin only its own.
   */
  async aiCost(caller: TenantCaller, query: AiCostQueryDto, now: Date = new Date()) {
    const { from, to } = resolveRange(query, now);
    let organizationId: string | null = null;
    if (isPlatformAdmin(caller.role)) {
      organizationId = query.organizationId ?? null;
    } else {
      organizationId = organizationScope(caller).organizationId ?? null;
      if (query.organizationId && query.organizationId !== organizationId) {
        throw new ForbiddenException(OTHER_ORGANIZATION_MESSAGE);
      }
    }

    const byOrganization = organizationId
      ? Prisma.sql`AND organization_id = ${organizationId}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<RawUsageRow[]>(Prisma.sql`
      SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') AS month,
             action_type::text AS action_type,
             model_name,
             count(*) AS calls,
             count(*) FILTER (WHERE status = 'failed') AS failed_calls,
             coalesce(sum(prompt_tokens), 0) AS prompt_tokens,
             coalesce(sum(completion_tokens), 0) AS completion_tokens
        FROM ai_usage_logs
       WHERE created_at >= ${from} AND created_at <= ${to}
       ${byOrganization}
       GROUP BY 1, 2, 3`);
    const prices = await this.prisma.aiModelPrice.findMany();

    const usage: UsageGroupRow[] = rows.map((row) => ({
      month: row.month,
      actionType: row.action_type,
      modelName: row.model_name,
      calls: Number(row.calls),
      failedCalls: Number(row.failed_calls),
      promptTokens: Number(row.prompt_tokens),
      completionTokens: Number(row.completion_tokens),
    }));
    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      organizationId,
      ...summarizeCost(
        usage,
        prices.map((p) => ({
          modelName: p.modelName,
          inputUsdPerMillion: Number(p.inputUsdPerMillion),
          outputUsdPerMillion: Number(p.outputUsdPerMillion),
        })),
      ),
    };
  }

  /** R21: every model the logs have seen, with the price an admin set or none. */
  async modelPrices() {
    const [seen, prices] = await Promise.all([
      this.prisma.aiUsageLog.findMany({
        distinct: ['modelName'],
        select: { modelName: true },
        orderBy: { modelName: 'asc' },
      }),
      this.prisma.aiModelPrice.findMany(),
    ]);
    const priceOf = new Map(prices.map((p) => [p.modelName, p]));
    const names = [...new Set([...seen.map((s) => s.modelName), ...prices.map((p) => p.modelName)])].sort();
    return names.map((modelName) => {
      const price = priceOf.get(modelName);
      return {
        modelName,
        inputUsdPerMillion: price ? Number(price.inputUsdPerMillion) : null,
        outputUsdPerMillion: price ? Number(price.outputUsdPerMillion) : null,
        updatedAt: price ? price.updatedAt.toISOString() : null,
      };
    });
  }

  async setModelPrice(caller: TenantCaller, modelName: string, dto: ModelPriceDto) {
    const values = {
      inputUsdPerMillion: dto.inputUsdPerMillion,
      outputUsdPerMillion: dto.outputUsdPerMillion,
      updatedById: caller.userId,
    };
    const saved = await this.prisma.aiModelPrice.upsert({
      where: { modelName },
      create: { modelName, ...values },
      update: values,
    });
    return {
      modelName: saved.modelName,
      inputUsdPerMillion: Number(saved.inputUsdPerMillion),
      outputUsdPerMillion: Number(saved.outputUsdPerMillion),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  /** The open jobs inside the same scope as the applications. */
  private jobScope(scope: Prisma.ApplicationWhereInput): Prisma.JobPostingWhereInput {
    return {
      status: JobStatus.active,
      ...(scope.organizationId ? { organizationId: scope.organizationId as string } : {}),
      ...(scope.jobPosting ? (scope.jobPosting as Prisma.JobPostingWhereInput) : {}),
      ...(scope.jobId ? { jobId: scope.jobId as string } : {}),
    };
  }
}
