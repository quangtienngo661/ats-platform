import {
  ApplicationStatus,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { ScreeningSkipReason } from '@ats-platform/types';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import {
  BULK_SCREENING_LIMIT,
  BulkScreeningService,
} from './bulk-screening.service';
import type { BulkScreeningDto } from './dtos/bulk-screening.dto';
import { MAX_SCREENING_RETRIES } from './screening-eligibility';
import type { ScreeningSubject } from './screening-eligibility';

type SelectedApplication = ScreeningSubject & {
  applicationId: string;
  cvId: string;
  appliedAt: Date;
};

const applicationOf = (
  applicationId: string,
  overrides: Partial<SelectedApplication> = {},
): SelectedApplication => ({
  applicationId,
  status: ApplicationStatus.screening,
  cvId: `cv-${applicationId}`,
  appliedAt: new Date('2026-10-01T00:00:00Z'),
  screening: null,
  ...overrides,
});

const applicationSelect = {
  applicationId: true,
  status: true,
  cvId: true,
  appliedAt: true,
  screening: { select: { status: true, retryCount: true } },
};

const caller = callerOf(UserRole.recruiter);
const job = { jobId: 'job-1', departmentId: 'dep-1', organizationId: 'org-1' };

describe('BulkScreeningService', () => {
  let service: BulkScreeningService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let applicationsService: {
    assertCanAccessDepartment: jest.Mock;
    updateStatus: jest.Mock;
  };
  let cvScreeningsService: {
    getActiveConfig: jest.Mock;
    createScreeningRecord: jest.Mock;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.jobPosting.findUnique.mockResolvedValue(job);
    prisma.application.findMany.mockResolvedValue([]);
    applicationsService = {
      assertCanAccessDepartment: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ status: ApplicationStatus.screening }),
    };
    cvScreeningsService = {
      getActiveConfig: jest.fn().mockResolvedValue({ configId: 'cfg-1' }),
      createScreeningRecord: jest
        .fn()
        .mockResolvedValue({ screeningId: 'scr-1' }),
    };
    service = new BulkScreeningService(
      prisma as any,
      applicationsService as any,
      cvScreeningsService as any,
    );
  });

  it('queues three eligible applications in the order given', async () => {
    const applications = [
      applicationOf('app-3'),
      applicationOf('app-1', { status: ApplicationStatus.interview }),
      applicationOf('app-2', {
        status: ApplicationStatus.offer,
        screening: {
          status: ScreeningStatus.failed,
          retryCount: MAX_SCREENING_RETRIES - 1,
        },
      }),
    ];
    const ids = applications.map(({ applicationId }) => applicationId);
    // Prisma need not return list-mode rows in the requested order.
    prisma.application.findMany.mockResolvedValue([
      applications[2],
      applications[0],
      applications[1],
    ]);
    let enqueueInProgress = false;
    cvScreeningsService.createScreeningRecord.mockImplementation(async () => {
      expect(enqueueInProgress).toBe(false);
      enqueueInProgress = true;
      await Promise.resolve();
      enqueueInProgress = false;
      return { screeningId: 'scr-1' };
    });
    const dto: BulkScreeningDto = { applicationIds: ids, configId: 'cfg-1' };

    const result = await service.bulkScreen(caller, job.jobId, dto);

    expect(result).toEqual({
      queued: ids.map((applicationId) => ({
        applicationId,
        movedToScreening: false,
      })),
      skipped: [],
      remaining: 0,
    });
    expect(prisma.jobPosting.findUnique).toHaveBeenCalledWith({
      where: { jobId: job.jobId },
      select: { jobId: true, departmentId: true, organizationId: true },
    });
    expect(applicationsService.assertCanAccessDepartment).toHaveBeenCalledWith(
      caller,
      job,
    );
    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledTimes(1);
    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledWith(
      job.organizationId,
      'cfg-1',
    );
    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { applicationId: { in: ids }, jobId: job.jobId },
      select: applicationSelect,
    });
    expect(
      prisma.jobPosting.findUnique.mock.invocationCallOrder[0],
    ).toBeLessThan(
      applicationsService.assertCanAccessDepartment.mock.invocationCallOrder[0],
    );
    expect(
      applicationsService.assertCanAccessDepartment.mock.invocationCallOrder[0],
    ).toBeLessThan(
      cvScreeningsService.getActiveConfig.mock.invocationCallOrder[0],
    );
    expect(
      cvScreeningsService.getActiveConfig.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.application.findMany.mock.invocationCallOrder[0]);
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledTimes(3);
    applications.forEach(({ applicationId, cvId }, index) => {
      expect(cvScreeningsService.createScreeningRecord).toHaveBeenNthCalledWith(
        index + 1,
        applicationId,
        cvId,
        'cfg-1',
        { notify: false },
      );
    });
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
  });

  it('reports an id of another job or organization exactly like an unknown id', async () => {
    const ids = ['app-other-job-or-org', 'app-unknown'];

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ids,
    });

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { applicationId: { in: ids }, jobId: job.jobId },
      }),
    );
    expect(result).toEqual({
      queued: [],
      skipped: ids.map((applicationId) => ({
        applicationId,
        reason: ScreeningSkipReason.NOT_IN_JOB,
        movedToScreening: false,
      })),
      remaining: 0,
    });
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('skips an applied application while the flag is off', async () => {
    prisma.application.findMany.mockResolvedValue([
      applicationOf('app-1', { status: ApplicationStatus.applied }),
    ]);

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ['app-1'],
    });

    expect(result).toEqual({
      queued: [],
      skipped: [
        {
          applicationId: 'app-1',
          reason: ScreeningSkipReason.APPLIED_NOT_MOVED,
          movedToScreening: false,
        },
      ],
      remaining: 0,
    });
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('moves it with updateStatus, then queues it, when the flag is on', async () => {
    const application = applicationOf('app-1', {
      status: ApplicationStatus.applied,
    });
    prisma.application.findMany.mockResolvedValue([application]);

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ['app-1'],
      moveAppliedToScreening: true,
    });

    expect(applicationsService.updateStatus).toHaveBeenCalledTimes(1);
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(
      'app-1',
      caller,
      { status: ApplicationStatus.screening },
    );
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledTimes(1);
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledWith(
      'app-1',
      application.cvId,
      'cfg-1',
      { notify: false },
    );
    expect(
      applicationsService.updateStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(
      cvScreeningsService.createScreeningRecord.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({
      queued: [{ applicationId: 'app-1', movedToScreening: true }],
      skipped: [],
      remaining: 0,
    });
  });

  it.each<{
    reason: ScreeningSkipReason;
    name: string;
    subject: ScreeningSubject;
  }>([
    {
      reason: ScreeningSkipReason.FINAL_STATUS,
      name: 'hired',
      subject: { status: ApplicationStatus.hired, screening: null },
    },
    {
      reason: ScreeningSkipReason.FINAL_STATUS,
      name: 'rejected',
      subject: { status: ApplicationStatus.rejected, screening: null },
    },
    {
      reason: ScreeningSkipReason.FINAL_STATUS,
      name: 'cancelled',
      subject: { status: ApplicationStatus.cancelled, screening: null },
    },
    {
      reason: ScreeningSkipReason.IN_QUEUE,
      name: 'pending',
      subject: {
        status: ApplicationStatus.screening,
        screening: { status: ScreeningStatus.pending, retryCount: 0 },
      },
    },
    {
      reason: ScreeningSkipReason.IN_QUEUE,
      name: 'processing',
      subject: {
        status: ApplicationStatus.screening,
        screening: { status: ScreeningStatus.processing, retryCount: 0 },
      },
    },
    {
      reason: ScreeningSkipReason.ALREADY_SCREENED,
      name: 'completed',
      subject: {
        status: ApplicationStatus.interview,
        screening: { status: ScreeningStatus.completed, retryCount: 0 },
      },
    },
    {
      reason: ScreeningSkipReason.RETRY_LIMIT,
      name: 'failed at the retry limit',
      subject: {
        status: ApplicationStatus.offer,
        screening: {
          status: ScreeningStatus.failed,
          retryCount: MAX_SCREENING_RETRIES,
        },
      },
    },
  ])('skips $reason for $name', async ({ reason, subject }) => {
    prisma.application.findMany.mockResolvedValue([
      applicationOf('app-1', subject),
    ]);

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ['app-1'],
    });

    expect(result).toEqual({
      queued: [],
      skipped: [{ applicationId: 'app-1', reason, movedToScreening: false }],
      remaining: 0,
    });
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('reports STATUS_CHANGED when the move is refused and queues nothing for it', async () => {
    prisma.application.findMany.mockResolvedValue([
      applicationOf('app-1', { status: ApplicationStatus.applied }),
    ]);
    applicationsService.updateStatus.mockRejectedValue(
      new BadRequestException('Trạng thái đơn đã thay đổi'),
    );

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ['app-1'],
      moveAppliedToScreening: true,
    });

    expect(result).toEqual({
      queued: [],
      skipped: [
        {
          applicationId: 'app-1',
          reason: ScreeningSkipReason.STATUS_CHANGED,
          movedToScreening: false,
        },
      ],
      remaining: 0,
    });
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(
      'app-1',
      caller,
      { status: ApplicationStatus.screening },
    );
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('reports ENQUEUE_FAILED with movedToScreening true when queueing fails after the move', async () => {
    const application = applicationOf('app-1', {
      status: ApplicationStatus.applied,
    });
    prisma.application.findMany.mockResolvedValue([application]);
    cvScreeningsService.createScreeningRecord.mockRejectedValue(
      new Error('Queue unavailable'),
    );

    const result = await service.bulkScreen(caller, job.jobId, {
      applicationIds: ['app-1'],
      moveAppliedToScreening: true,
    });

    expect(result).toEqual({
      queued: [],
      skipped: [
        {
          applicationId: 'app-1',
          reason: ScreeningSkipReason.ENQUEUE_FAILED,
          movedToScreening: true,
        },
      ],
      remaining: 0,
    });
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(
      'app-1',
      caller,
      { status: ApplicationStatus.screening },
    );
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledWith(
      'app-1',
      application.cvId,
      'cfg-1',
      { notify: false },
    );
    expect(
      applicationsService.updateStatus.mock.invocationCallOrder[0],
    ).toBeLessThan(
      cvScreeningsService.createScreeningRecord.mock.invocationCallOrder[0],
    );
  });

  it('stops with the 404 of the missing AI config before reading or changing any application', async () => {
    const error = new NotFoundException(
      "Không tìm thấy cấu hình AI 'cfg-missing'",
    );
    cvScreeningsService.getActiveConfig.mockRejectedValue(error);

    await expect(
      service.bulkScreen(caller, job.jobId, {
        applicationIds: ['app-1'],
        moveAppliedToScreening: true,
        configId: 'cfg-missing',
      }),
    ).rejects.toBe(error);

    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledTimes(1);
    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledWith(
      job.organizationId,
      'cfg-missing',
    );
    expect(applicationsService.assertCanAccessDepartment).toHaveBeenCalledWith(
      caller,
      job,
    );
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown job and lets the 403 of the access check through', async () => {
    prisma.jobPosting.findUnique.mockResolvedValueOnce(null);

    const missingJob = service.bulkScreen(caller, 'job-unknown', {});
    await expect(missingJob).rejects.toBeInstanceOf(NotFoundException);
    await expect(missingJob).rejects.toThrow('Không tìm thấy tin tuyển dụng');
    expect(
      applicationsService.assertCanAccessDepartment,
    ).not.toHaveBeenCalled();
    expect(cvScreeningsService.getActiveConfig).not.toHaveBeenCalled();
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();

    const forbidden = new ForbiddenException(
      'Không có quyền truy cập phòng ban này',
    );
    applicationsService.assertCanAccessDepartment.mockRejectedValue(forbidden);

    await expect(service.bulkScreen(caller, job.jobId, {})).rejects.toBe(
      forbidden,
    );

    expect(applicationsService.assertCanAccessDepartment).toHaveBeenCalledWith(
      caller,
      job,
    );
    expect(cvScreeningsService.getActiveConfig).not.toHaveBeenCalled();
    expect(prisma.application.findMany).not.toHaveBeenCalled();
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('auto mode takes the 50 oldest eligible and counts the rest as remaining', async () => {
    const applications = Array.from({ length: 60 }, (_, index) =>
      applicationOf(`app-${index + 1}`, {
        appliedAt: new Date(Date.UTC(2026, 9, 1, 0, index)),
      }),
    );
    // Ineligible rows must be filtered before the limit and remaining count.
    prisma.application.findMany.mockResolvedValue([
      applicationOf('app-completed', {
        appliedAt: new Date('2026-09-30T23:58:00Z'),
        screening: { status: ScreeningStatus.completed, retryCount: 0 },
      }),
      applicationOf('app-retry-limit', {
        appliedAt: new Date('2026-09-30T23:59:00Z'),
        screening: {
          status: ScreeningStatus.failed,
          retryCount: MAX_SCREENING_RETRIES,
        },
      }),
      ...applications,
    ]);

    const result = await service.bulkScreen(caller, job.jobId, {});

    expect(BULK_SCREENING_LIMIT).toBe(50);
    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: {
        jobId: job.jobId,
        status: {
          in: [
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
    const firstFifty = applications.slice(0, 50);
    expect(result).toEqual({
      queued: firstFifty.map(({ applicationId }) => ({
        applicationId,
        movedToScreening: false,
      })),
      skipped: [],
      remaining: 10,
    });
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledTimes(50);
    firstFifty.forEach(({ applicationId, cvId }, index) => {
      expect(cvScreeningsService.createScreeningRecord).toHaveBeenNthCalledWith(
        index + 1,
        applicationId,
        cvId,
        'cfg-1',
        { notify: false },
      );
    });
    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledTimes(1);
    expect(cvScreeningsService.getActiveConfig).toHaveBeenCalledWith(
      job.organizationId,
      undefined,
    );
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
  });

  it('auto mode only considers applied applications when the flag is on', async () => {
    prisma.application.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        applicationOf('app-1', { status: ApplicationStatus.applied }),
      ]);

    await service.bulkScreen(caller, job.jobId, {});

    expect(prisma.application.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          jobId: job.jobId,
          status: {
            in: [
              ApplicationStatus.screening,
              ApplicationStatus.interview,
              ApplicationStatus.offer,
            ],
          },
        }),
      }),
    );
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();

    const result = await service.bulkScreen(caller, job.jobId, {
      moveAppliedToScreening: true,
    });

    expect(prisma.application.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          jobId: job.jobId,
          status: {
            in: [
              ApplicationStatus.applied,
              ApplicationStatus.screening,
              ApplicationStatus.interview,
              ApplicationStatus.offer,
            ],
          },
        }),
      }),
    );
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(
      'app-1',
      caller,
      { status: ApplicationStatus.screening },
    );
    expect(result).toEqual({
      queued: [{ applicationId: 'app-1', movedToScreening: true }],
      skipped: [],
      remaining: 0,
    });
  });

  it('auto mode with nothing eligible returns empty lists', async () => {
    prisma.application.findMany.mockResolvedValue([
      applicationOf('app-applied', { status: ApplicationStatus.applied }),
      applicationOf('app-completed', {
        screening: { status: ScreeningStatus.completed, retryCount: 0 },
      }),
      applicationOf('app-retry-limit', {
        screening: {
          status: ScreeningStatus.failed,
          retryCount: MAX_SCREENING_RETRIES,
        },
      }),
    ]);

    const result = await service.bulkScreen(caller, job.jobId, {});

    expect(result).toEqual({ queued: [], skipped: [], remaining: 0 });
    expect(applicationsService.updateStatus).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });
});
