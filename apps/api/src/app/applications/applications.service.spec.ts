import {
  ApplicationStatus,
  JobStatus,
  ParsingStatus,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { ApplicationsService } from './applications.service';
import {
  createPrismaMock,
  createPrismaTransactionMock,
  createSocketMock,
} from '../../test-utils/unit-test-helpers';

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

    const board = await service.getAllKanbanBoard('user-1', UserRole.recruiter);

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          jobPosting: { departmentId: 'dep-1' },
        }),
      }),
    );
    expect(board.applied).toHaveLength(1);
    expect(board.interview).toHaveLength(1);
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

    await service.updateStatus('app-1', 'admin-1', UserRole.admin, {
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
      service.updateStatus('app-2', 'admin-1', UserRole.admin, {
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
      service.updateStatus('app-5', 'admin-1', UserRole.admin, {
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

    await service.updateStatus('app-6', 'admin-1', UserRole.admin, {
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
    prisma.aiConfig.findUnique.mockResolvedValue({ configId: 'cfg-1' });
    cvScreeningsService.createScreeningRecord.mockResolvedValue({
      screeningId: 'screen-1',
    });

    await expect(
      service.triggerScreening('app-1', 'admin-1', UserRole.admin, 'cfg-1'),
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
      service.triggerScreening('app-2', 'admin-1', UserRole.admin),
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
      service.triggerScreening('app-3', 'admin-1', UserRole.admin),
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
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-default' });
    cvScreeningsService.createScreeningRecord.mockResolvedValue({
      screeningId: 'screen-4',
    });

    await expect(
      service.triggerScreening('app-4', 'admin-1', UserRole.admin),
    ).resolves.toEqual({ screeningId: 'screen-4' });
  });
});
