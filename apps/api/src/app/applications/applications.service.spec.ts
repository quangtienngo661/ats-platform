import {
  ApplicationStatus,
  JobStatus,
  ParsingStatus,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { ApplicationsService } from './applications.service';
import { ForbiddenException } from '@nestjs/common';
import {
  callerOf,
  createPrismaMock,
  createPrismaTransactionMock,
  createSocketMock,
} from '../../test-utils/unit-test-helpers';

const platformAdmin = callerOf(UserRole.admin, { userId: 'admin-1' });

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let cvScreeningsService: { createScreeningRecord: jest.Mock };
  let socket: ReturnType<typeof createSocketMock>;
  let notificationsService: { create: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    cvScreeningsService = { createScreeningRecord: jest.fn() };
    socket = createSocketMock();
    notificationsService = { create: jest.fn() };
    service = new ApplicationsService(
      prisma as any,
      cvScreeningsService as any,
      socket as any,
      notificationsService as any,
    );
  });

  it('applies to an active job with a confirmed parsed CV and creates history', async () => {
    const tx = createPrismaTransactionMock();
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      status: JobStatus.active,
    });
    prisma.cV.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      candidateId: 'cand-1',
      parsingStatus: ParsingStatus.completed,
      parsedData: { isConfirmed: true },
    });
    prisma.application.findMany.mockResolvedValue([]);
    tx.application.create.mockResolvedValue({
      applicationId: 'app-1',
      jobId: 'job-1',
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(
      service.apply('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).resolves.toEqual({
      applicationId: 'app-1',
      jobId: 'job-1',
    });

    expect(socket.handleEmit).toHaveBeenCalledWith(
      'application:application_created',
      { applicationId: 'app-1', jobId: 'job-1' },
      'job_job-1',
    );
    expect(tx.applicationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toStatus: ApplicationStatus.applied,
          changedBy: 'user-1',
        }),
      }),
    );
  });

  // Criterion 3. Candidates are one pool shared by every organization; an
  // application belongs to the organization of the JOB it is for. The test above
  // stayed green with no organization at all — undefined is not asserted.
  it("stamps each application with its job's organization — one candidate, two organizations", async () => {
    const tx = createPrismaTransactionMock();
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.cV.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      candidateId: 'cand-1',
      parsingStatus: ParsingStatus.completed,
      parsedData: { isConfirmed: true },
    });
    prisma.application.findMany.mockResolvedValue([]);
    prisma.jobPosting.findUnique
      .mockResolvedValueOnce({
        jobId: 'job-a',
        status: JobStatus.active,
        organizationId: 'org-1',
      })
      .mockResolvedValueOnce({
        jobId: 'job-b',
        status: JobStatus.active,
        organizationId: 'org-2',
      });
    tx.application.create
      .mockResolvedValueOnce({
        applicationId: 'app-a',
        jobId: 'job-a',
        organizationId: 'org-1',
      })
      .mockResolvedValueOnce({
        applicationId: 'app-b',
        jobId: 'job-b',
        organizationId: 'org-2',
      });

    await service.apply('user-1', { jobId: 'job-a', cvId: 'cv-1' });
    await service.apply('user-1', { jobId: 'job-b', cvId: 'cv-1' });

    expect(tx.application.create.mock.calls.map(([arg]) => arg.data)).toEqual([
      expect.objectContaining({
        candidateId: 'cand-1',
        organizationId: 'org-1',
      }),
      expect.objectContaining({
        candidateId: 'cand-1',
        organizationId: 'org-2',
      }),
    ]);
    expect(
      tx.applicationHistory.create.mock.calls.map(
        ([arg]) => arg.data.organizationId,
      ),
    ).toEqual(['org-1', 'org-2']);
    // The candidate is looked up, never duplicated per organization.
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate active applications and unconfirmed CVs', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.jobPosting.findUnique.mockResolvedValue({
      jobId: 'job-1',
      status: JobStatus.active,
    });
    prisma.cV.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      candidateId: 'cand-1',
      parsingStatus: ParsingStatus.completed,
      parsedData: { isConfirmed: false },
    });

    await expect(
      service.apply('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow('x');

    prisma.cV.findUnique.mockResolvedValue({
      cvId: 'cv-1',
      candidateId: 'cand-1',
      parsingStatus: ParsingStatus.completed,
      parsedData: { isConfirmed: true },
    });
    prisma.application.findMany.mockResolvedValue([
      { status: ApplicationStatus.applied },
    ]);

    await expect(
      service.apply('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toThrow('r');
  });

  it('withdraws only the owner application in applied status', async () => {
    const tx = createPrismaTransactionMock();
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      candidateId: 'cand-1',
      status: ApplicationStatus.applied,
    });
    tx.application.update.mockResolvedValue({
      applicationId: 'app-1',
      jobId: 'job-1',
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(service.withdraw('app-1', 'user-1')).resolves.toEqual({
      message: expect.any(String),
    });

    expect(tx.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ApplicationStatus.cancelled }),
      }),
    );
  });

  it('builds a recruiter-scoped kanban board', async () => {
    prisma.recruiter.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    prisma.application.findMany.mockResolvedValue([
      { applicationId: 'a1', status: ApplicationStatus.applied },
      { applicationId: 'a2', status: ApplicationStatus.interview },
    ]);

    const board = await service.getAllKanbanBoard(callerOf(UserRole.recruiter));

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          jobPosting: { departmentId: 'dep-1' },
        }),
      }),
    );
    expect(board.applied).toHaveLength(1);
    expect(board.interview).toHaveLength(1);
  });

  // Criterion 6b: an org_admin sees every department of its own organization —
  // and nothing else. Before this, any role other than recruiter got no filter.
  it("scopes an org_admin's kanban board to its organization, across departments", async () => {
    prisma.application.findMany.mockResolvedValue([]);

    await service.getAllKanbanBoard(callerOf(UserRole.org_admin));

    const { where } = prisma.application.findMany.mock.calls[0][0];
    expect(where.organizationId).toBe('org-1');
    expect(where.jobPosting).toBeUndefined();
    expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
  });

  it('gives a platform admin the board of every organization (criterion 6a)', async () => {
    prisma.application.findMany.mockResolvedValue([]);

    await service.getAllKanbanBoard(platformAdmin);

    const { where } = prisma.application.findMany.mock.calls[0][0];
    expect(where.organizationId).toBeUndefined();
  });

  it('refuses the kanban board to a staff account with no organization (E2)', async () => {
    await expect(
      service.getAllKanbanBoard(
        callerOf(UserRole.org_admin, { organizationId: null }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });

  // Criterion 2: a resource by id in another organization is refused.
  it('refuses an org_admin an application of another organization', async () => {
    prisma.application.findUnique.mockResolvedValueOnce({
      applicationId: 'app-9',
      organizationId: 'org-2',
      candidate: { userId: 'cand-user' },
      jobPosting: { departmentId: 'dep-of-org-2' },
    });

    await expect(
      service.getApplicationById('app-9', callerOf(UserRole.org_admin)),
    ).rejects.toThrow('tổ chức khác');
  });

  it("lets an org_admin read any department's application in its organization", async () => {
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-8',
        organizationId: 'org-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'some-other-dep' },
      })
      .mockResolvedValueOnce({ applicationId: 'app-8' });

    await expect(
      service.getApplicationById('app-8', callerOf(UserRole.org_admin)),
    ).resolves.toEqual({ applicationId: 'app-8' });
    // No department lookup: the org_admin is not confined to one department.
    expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
  });

  it('refuses a recruiter an application of another organization even before the department check', async () => {
    prisma.application.findUnique.mockResolvedValueOnce({
      applicationId: 'app-7',
      organizationId: 'org-2',
      candidate: { userId: 'cand-user' },
      jobPosting: { departmentId: 'dep-1' },
    });

    await expect(
      service.getApplicationById('app-7', callerOf(UserRole.recruiter)),
    ).rejects.toThrow('tổ chức khác');
    expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
  });

  it('enforces valid status transitions and notifies candidates when needed', async () => {
    const tx = createPrismaTransactionMock();
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        status: ApplicationStatus.screening,
      });
    tx.application.update.mockResolvedValue({
      applicationId: 'app-1',
      status: ApplicationStatus.interview,
      candidate: { user: { userId: 'cand-user' } },
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.updateStatus('app-1', platformAdmin, {
      status: ApplicationStatus.interview,
    });

    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cand-user',
        relatedEntityId: 'app-1',
      }),
    );

    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-2',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-2',
        status: ApplicationStatus.applied,
      });

    await expect(
      service.updateStatus('app-2', platformAdmin, {
        status: ApplicationStatus.offer,
      }),
    ).rejects.toThrow('tr');
  });

  it('refuses a revert to a status the application never held', async () => {
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-5',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-5',
        status: ApplicationStatus.applied,
      });
    prisma.applicationHistory.findMany.mockResolvedValue([]);

    // `isReverted` used to be a skeleton key: it skipped VALID_TRANSITIONS entirely,
    // so applied → hired in a single call was accepted.
    await expect(
      service.updateStatus('app-5', platformAdmin, {
        status: ApplicationStatus.hired,
        isReverted: true,
      } as any),
    ).rejects.toThrow('chưa từng ở trạng thái này');
  });

  it('allows a genuine revert and still notifies the candidate', async () => {
    const tx = createPrismaTransactionMock();
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-6',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-6',
        status: ApplicationStatus.interview,
      });
    // The application went applied → screening → interview, so `screening` is a
    // status it genuinely held and may be reverted to.
    prisma.applicationHistory.findMany.mockResolvedValue([
      { fromStatus: ApplicationStatus.applied },
      { fromStatus: ApplicationStatus.screening },
    ]);
    tx.application.update.mockResolvedValue({
      applicationId: 'app-6',
      status: ApplicationStatus.rejected,
      candidate: { user: { userId: 'cand-user' } },
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.updateStatus('app-6', platformAdmin, {
      status: ApplicationStatus.screening,
      isReverted: true,
    } as any);

    expect(tx.applicationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: ApplicationStatus.interview,
          toStatus: ApplicationStatus.screening,
        }),
      }),
    );
    // The old revert branch returned from inside the transaction and never reached
    // notifyCandidateStatusChangeSafe — the candidate got no signal at all.
    expect(notificationsService.create).toHaveBeenCalled();
  });

  it('triggers screening only for eligible states and configs', async () => {
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        status: ApplicationStatus.screening,
        cvId: 'cv-1',
        screening: null,
      });
    cvScreeningsService.createScreeningRecord.mockResolvedValue({
      screeningId: 'screen-1',
    });

    await expect(
      service.triggerScreening('app-1', platformAdmin, 'cfg-1'),
    ).resolves.toEqual({ screeningId: 'screen-1' });

    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledWith(
      'app-1',
      'cv-1',
      'cfg-1',
    );

    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-2',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-2',
        status: ApplicationStatus.screening,
        cvId: 'cv-1',
        screening: {
          screeningId: 'screen-1',
          status: ScreeningStatus.processing,
        },
      });

    await expect(
      service.triggerScreening('app-2', platformAdmin),
    ).rejects.toThrow('x');
  });

  it('caps manual re-triggers of a failed screening at the retry limit', async () => {
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-3',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-3',
        status: ApplicationStatus.screening,
        cvId: 'cv-1',
        screening: {
          screeningId: 'screen-3',
          status: ScreeningStatus.failed,
          retryCount: 3,
        },
      });

    await expect(
      service.triggerScreening('app-3', platformAdmin),
    ).rejects.toThrow('thất bại');
    expect(cvScreeningsService.createScreeningRecord).not.toHaveBeenCalled();
  });

  it('still allows re-triggering a failed screening below the retry limit', async () => {
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-4',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-4',
        status: ApplicationStatus.screening,
        cvId: 'cv-1',
        screening: {
          screeningId: 'screen-4',
          status: ScreeningStatus.failed,
          retryCount: 1,
        },
      });
    cvScreeningsService.createScreeningRecord.mockResolvedValue({
      screeningId: 'screen-4',
    });

    await expect(
      service.triggerScreening('app-4', platformAdmin),
    ).resolves.toEqual({ screeningId: 'screen-4' });

    // No config is chosen here any more: the default is resolved inside the
    // application's own organization (CvScreeningsService.getActiveConfig).
    // This service used to pick `findFirst({ isDefault: true })` — any
    // organization's default.
    expect(prisma.aiConfig.findFirst).not.toHaveBeenCalled();
    expect(cvScreeningsService.createScreeningRecord).toHaveBeenCalledWith(
      'app-4',
      'cv-1',
      undefined,
    );
  });
});
