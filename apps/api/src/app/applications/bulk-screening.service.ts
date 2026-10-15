import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, ScreeningStatus } from '@ats-platform/database';
import { IBulkScreeningResult, ScreeningSkipReason } from '@ats-platform/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { CvScreeningsService } from '../cv-screenings/cv-screenings.service';
import { ApplicationsService } from './applications.service';
import { BulkScreeningDto } from './dtos/bulk-screening.dto';
import {
  checkScreeningEligibility,
  MAX_SCREENING_RETRIES,
} from './screening-eligibility';

export const BULK_SCREENING_LIMIT = 50;

const applicationSelect = {
  applicationId: true,
  status: true,
  cvId: true,
  appliedAt: true,
  screening: { select: { status: true, retryCount: true } },
} as const;

@Injectable()
export class BulkScreeningService {
  private readonly logger = new Logger(BulkScreeningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
    private readonly cvScreeningsService: CvScreeningsService,
  ) {}

  async bulkScreen(
    caller: TenantCaller,
    jobId: string,
    dto: BulkScreeningDto,
  ): Promise<IBulkScreeningResult> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { jobId: true, departmentId: true, organizationId: true },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    await this.applicationsService.assertCanAccessDepartment(caller, job);
    const config = await this.cvScreeningsService.getActiveConfig(
      job.organizationId,
      dto.configId,
    );

    const allowApplied = dto.moveAppliedToScreening ?? false;
    const applications = dto.applicationIds
      ? await this.prisma.application.findMany({
          where: { applicationId: { in: dto.applicationIds }, jobId },
          select: applicationSelect,
        })
      : await this.prisma.application.findMany({
          where: {
            jobId,
            status: {
              in: allowApplied
                ? [
                    ApplicationStatus.applied,
                    ApplicationStatus.screening,
                    ApplicationStatus.interview,
                    ApplicationStatus.offer,
                  ]
                : [
                    ApplicationStatus.screening,
                    ApplicationStatus.interview,
                    ApplicationStatus.offer,
                  ],
            },
            OR: [
              { screening: { is: null } },
              {
                screening: {
                  is: {
                    status: ScreeningStatus.failed,
                    retryCount: { lt: MAX_SCREENING_RETRIES },
                  },
                },
              },
            ],
          },
          select: applicationSelect,
          orderBy: { appliedAt: 'asc' },
        });

    const result: IBulkScreeningResult = {
      queued: [],
      skipped: [],
      remaining: 0,
    };
    let applicationIds = dto.applicationIds;
    if (!applicationIds) {
      const eligible = applications.filter(
        (application) =>
          checkScreeningEligibility(application, { allowApplied }).eligible,
      );
      result.remaining = Math.max(0, eligible.length - BULK_SCREENING_LIMIT);
      applicationIds = eligible
        .slice(0, BULK_SCREENING_LIMIT)
        .map((application) => application.applicationId);
    }

    const applicationsById = new Map(
      applications.map((application) => [application.applicationId, application]),
    );
    for (const applicationId of applicationIds) {
      const application = applicationsById.get(applicationId);
      if (!application) {
        result.skipped.push({
          applicationId,
          reason: ScreeningSkipReason.NOT_IN_JOB,
          movedToScreening: false,
        });
        continue;
      }

      const verdict = checkScreeningEligibility(application, { allowApplied });
      if (verdict.eligible === false) {
        result.skipped.push({
          applicationId,
          reason: verdict.reason,
          movedToScreening: false,
        });
        continue;
      }

      let movedToScreening = false;
      if (verdict.needsMove) {
        try {
          await this.applicationsService.updateStatus(applicationId, caller, {
            status: ApplicationStatus.screening,
          });
          movedToScreening = true;
        } catch {
          result.skipped.push({
            applicationId,
            reason: ScreeningSkipReason.STATUS_CHANGED,
            movedToScreening: false,
          });
          continue;
        }
      }

      try {
        await this.cvScreeningsService.createScreeningRecord(
          applicationId,
          application.cvId,
          config.configId,
          { notify: false },
        );
        result.queued.push({ applicationId, movedToScreening });
      } catch (error) {
        result.skipped.push({
          applicationId,
          reason: ScreeningSkipReason.ENQUEUE_FAILED,
          movedToScreening,
        });
        this.logger.warn(
          `Failed to enqueue screening for application ${applicationId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return result;
  }
}
