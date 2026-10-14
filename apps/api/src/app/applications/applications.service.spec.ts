import {
  ApplicationStatus,
  JobStatus,
  ParsingStatus,
  ScheduleStatus,
  ScreeningStatus,
  UserRole,
} from '@ats-platform/database';
import { ApplicationsService } from './applications.service';
import { candidateHistorySelect } from '../../common/utils/include-options.util';
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
  let candidateNotifications: {
    applicationReceived: jest.Mock;
    applicationStatusChanged: jest.Mock;
    scheduleCreated: jest.Mock;
    scheduleChanged: jest.Mock;
    scheduleRemoved: jest.Mock;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    cvScreeningsService = { createScreeningRecord: jest.fn() };
    socket = createSocketMock();
    candidateNotifications = {
      applicationReceived: jest.fn().mockResolvedValue(undefined),
      applicationStatusChanged: jest.fn().mockResolvedValue(undefined),
      scheduleCreated: jest.fn().mockResolvedValue(undefined),
      scheduleChanged: jest.fn().mockResolvedValue(undefined),
      scheduleRemoved: jest.fn().mockResolvedValue(undefined),
    };
    service = new ApplicationsService(
      prisma as any,
      cvScreeningsService as any,
      socket as any,
      candidateNotifications as any,
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

  it('notifies once the application is created, after the transaction', async () => {
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
    ).resolves.toEqual({ applicationId: 'app-1', jobId: 'job-1' });

    expect(candidateNotifications.applicationReceived).toHaveBeenCalledTimes(1);
    expect(candidateNotifications.applicationReceived).toHaveBeenCalledWith('app-1');
    expect(
      candidateNotifications.applicationReceived.mock.invocationCallOrder[0],
    ).toBeGreaterThan(prisma.$transaction.mock.invocationCallOrder[0]);
  });

  describe('status transitions — all 49 pairs', () => {
    // This is the business contract, kept independent of the implementation map.
    const permitted: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
      applied: [ApplicationStatus.screening, ApplicationStatus.rejected],
      screening: [ApplicationStatus.interview, ApplicationStatus.rejected],
      interview: [ApplicationStatus.offer, ApplicationStatus.rejected],
      offer: [ApplicationStatus.hired, ApplicationStatus.rejected],
    };
    const pairs = Object.values(ApplicationStatus).flatMap((from) =>
      Object.values(ApplicationStatus).map((to) => ({ from, to })),
    );

    it.each(pairs)('$from → $to', async ({ from, to }) => {
      const tx = createPrismaTransactionMock();
      tx.interviewSchedule.updateManyAndReturn.mockResolvedValue([]);
      prisma.application.findUnique.mockResolvedValue({
        applicationId: 'app-1',
        organizationId: 'org-1',
        status: from,
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      });
      tx.application.update.mockResolvedValue({
        applicationId: 'app-1',
        organizationId: 'org-1',
        status: to,
        candidate: { user: { userId: 'cand-user' } },
      });
      prisma.$transaction.mockImplementation((callback: any) => callback(tx));

      const result = service.updateStatus('app-1', platformAdmin, {
        status: to,
      });
      if ((permitted[from] ?? []).includes(to)) {
        await expect(result).resolves.toMatchObject({ status: to });
        expect(tx.applicationHistory.create).toHaveBeenCalledWith({
          data: {
            organizationId: 'org-1',
            applicationId: 'app-1',
            fromStatus: from,
            toStatus: to,
            changedBy: 'admin-1',
            notes: undefined,
            rejectionReason: undefined,
          },
        });
        expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledTimes(1);
        expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledWith('app-1', to, []);
      } else {
        await expect(result).rejects.toThrow(
          `Không thể chuyển trạng thái từ '${from}' sang '${to}'`,
        );
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(candidateNotifications.applicationStatusChanged).not.toHaveBeenCalled();
      }
    });
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

  it('does not notify when the application is refused', async () => {
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
    prisma.application.findMany.mockResolvedValue([
      { status: ApplicationStatus.applied },
    ]);

    await expect(
      service.apply('user-1', { jobId: 'job-1', cvId: 'cv-1' }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Bạn đã ứng tuyển công việc này rồi',
    });

    expect(candidateNotifications.applicationReceived).not.toHaveBeenCalled();
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

  it('withdrawing notifies nobody', async () => {
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
    tx.interviewSchedule.updateManyAndReturn.mockResolvedValue([]);
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.withdraw('app-1', 'user-1');

    expect(candidateNotifications.applicationReceived).not.toHaveBeenCalled();
    expect(candidateNotifications.applicationStatusChanged).not.toHaveBeenCalled();
    expect(candidateNotifications.scheduleCreated).not.toHaveBeenCalled();
    expect(candidateNotifications.scheduleChanged).not.toHaveBeenCalled();
    expect(candidateNotifications.scheduleRemoved).not.toHaveBeenCalled();
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

    expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledWith(
      'app-1', ApplicationStatus.interview, [],
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
    expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledWith(
      'app-6', ApplicationStatus.screening, [],
    );
  });

  it('a revert to interview notifies with the target status', async () => {
    const tx = createPrismaTransactionMock();
    prisma.application.findUnique
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      })
      .mockResolvedValueOnce({
        applicationId: 'app-1',
        status: ApplicationStatus.rejected,
      });
    prisma.applicationHistory.findMany.mockResolvedValue([
      { fromStatus: ApplicationStatus.applied },
      { fromStatus: ApplicationStatus.screening },
      { fromStatus: ApplicationStatus.interview },
    ]);
    tx.application.update.mockResolvedValue({
      applicationId: 'app-1',
      status: ApplicationStatus.interview,
      candidate: { user: { userId: 'cand-user' } },
    });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.updateStatus('app-1', platformAdmin, {
      status: ApplicationStatus.interview,
      isReverted: true,
    });

    expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledTimes(1);
    expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledWith(
      'app-1', ApplicationStatus.interview, [],
    );
  });

  describe('closing an application cancels its upcoming interviews (R7)', () => {
    const now = new Date('2026-10-05T03:00:00.000Z');
    let tx: ReturnType<typeof createPrismaTransactionMock>;

    beforeEach(() => {
      jest.useFakeTimers({ now, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      tx = createPrismaTransactionMock();
      tx.interviewSchedule.updateManyAndReturn.mockResolvedValue([]);
      tx.application.update.mockImplementation(async ({ data }: { data: { status: ApplicationStatus } }) => ({
        applicationId: 'app-1',
        organizationId: 'org-1',
        jobId: 'job-1',
        status: data.status,
        candidate: { user: { userId: 'cand-user' } },
      }));
      prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const upcomingCancellation = {
      where: {
        applicationId: 'app-1',
        status: ScheduleStatus.scheduled,
        startAt: { gt: now },
      },
      data: { status: ScheduleStatus.cancelled },
      select: {
        interviewId: true,
        startAt: true,
        durationMinutes: true,
        interviewType: true,
      },
    };

    function applicationIn(status: ApplicationStatus) {
      prisma.application.findUnique
        .mockResolvedValueOnce({
          applicationId: 'app-1',
          organizationId: 'org-1',
          candidate: { userId: 'cand-user' },
          jobPosting: { departmentId: 'dep-1' },
        })
        .mockResolvedValueOnce({ applicationId: 'app-1', status });
    }

    it('cancels the upcoming interviews when an application is rejected', async () => {
      applicationIn(ApplicationStatus.interview);

      await service.updateStatus('app-1', platformAdmin, { status: ApplicationStatus.rejected });

      expect(tx.interviewSchedule.updateManyAndReturn).toHaveBeenCalledWith(upcomingCancellation);
      // Inside the status change's transaction, never as a separate write.
      expect(prisma.interviewSchedule.updateManyAndReturn).not.toHaveBeenCalled();
    });

    it('passes the schedules cancelled by a rejection to the notification', async () => {
      applicationIn(ApplicationStatus.interview);
      const cancelled = [
        {
          interviewId: 'interview-1',
          startAt: new Date('2026-10-20T02:30:00.000Z'),
          durationMinutes: 60,
          interviewType: 'online',
        },
        {
          interviewId: 'interview-2',
          startAt: new Date('2026-10-21T03:00:00.000Z'),
          durationMinutes: 45,
          interviewType: 'onsite',
        },
      ];
      tx.interviewSchedule.updateManyAndReturn.mockResolvedValue(cancelled);

      await service.updateStatus('app-1', platformAdmin, { status: ApplicationStatus.rejected });

      expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledTimes(1);
      expect(candidateNotifications.applicationStatusChanged).toHaveBeenCalledWith(
        'app-1', ApplicationStatus.rejected, cancelled,
      );
    });

    it('leaves interviews alone when an application moves to offer', async () => {
      applicationIn(ApplicationStatus.interview);

      await service.updateStatus('app-1', platformAdmin, { status: ApplicationStatus.offer });

      expect(tx.interviewSchedule.updateManyAndReturn).not.toHaveBeenCalled();
    });

    it('cancels the upcoming interviews when the candidate withdraws', async () => {
      prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
      prisma.application.findUnique.mockResolvedValue({
        applicationId: 'app-1',
        candidateId: 'cand-1',
        status: ApplicationStatus.applied,
      });

      await service.withdraw('app-1', 'cand-user');

      expect(tx.interviewSchedule.updateManyAndReturn).toHaveBeenCalledWith(upcomingCancellation);
      expect(prisma.interviewSchedule.updateManyAndReturn).not.toHaveBeenCalled();
    });

    it('does not reopen interviews when a rejection is reverted', async () => {
      applicationIn(ApplicationStatus.rejected);
      prisma.applicationHistory.findMany.mockResolvedValue([
        { fromStatus: ApplicationStatus.applied },
        { fromStatus: ApplicationStatus.screening },
        { fromStatus: ApplicationStatus.interview },
      ]);

      await service.updateStatus('app-1', platformAdmin, {
        status: ApplicationStatus.interview,
        isReverted: true,
      });

      expect(tx.interviewSchedule.updateManyAndReturn).not.toHaveBeenCalled();
      expect(tx.interviewSchedule.update).not.toHaveBeenCalled();
      expect(prisma.interviewSchedule.update).not.toHaveBeenCalled();
    });
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

  it('does not queue paid AI screening for a cancelled application', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
      status: ApplicationStatus.cancelled,
      cvId: 'cv-1',
      screening: null,
      candidate: { userId: 'cand-user' },
      jobPosting: { departmentId: 'dep-1' },
    });
    cvScreeningsService.createScreeningRecord.mockResolvedValue({
      screeningId: 'scr-1',
    });

    await expect(
      service.triggerScreening('app-1', platformAdmin),
    ).rejects.toThrow('cancelled');

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

  describe('application history for a candidate (R1, C7, D8)', () => {
    const candidate = callerOf(UserRole.candidate, { userId: 'cand-user' });
    const recruiter = callerOf(UserRole.recruiter);
    const rejectedAt = new Date('2026-10-04T03:30:00.000Z');
    const storedRows = [
      { id: 'h1', fromStatus: null, toStatus: ApplicationStatus.applied, changedAt: new Date('2026-10-01T02:12:00.000Z'), rejectionReason: null },
      { id: 'h2', fromStatus: ApplicationStatus.applied, toStatus: ApplicationStatus.rejected, changedAt: rejectedAt, rejectionReason: '  Thiếu NestJS  ' },
    ];
    const minimalRows = [
      { id: 'h1', fromStatus: null, toStatus: ApplicationStatus.applied, changedAt: storedRows[0].changedAt },
      { id: 'h2', fromStatus: ApplicationStatus.applied, toStatus: ApplicationStatus.rejected, changedAt: rejectedAt, rejectionReason: 'Thiếu NestJS' },
    ];

    function ownedBy(userId: string) {
      prisma.application.findUnique.mockResolvedValueOnce({
        applicationId: 'app-1',
        organizationId: 'org-1',
        candidate: { userId },
        jobPosting: { departmentId: 'dep-1' },
      });
    }

    it('gives the candidate the minimal history, oldest first', async () => {
      ownedBy('cand-user');
      prisma.application.findUnique.mockResolvedValueOnce({ applicationId: 'app-1', status: ApplicationStatus.rejected });
      prisma.applicationHistory.findMany.mockResolvedValueOnce(storedRows);

      await expect(service.getApplicationHistory('app-1', candidate)).resolves.toEqual(minimalRows);

      const args = prisma.applicationHistory.findMany.mock.calls[0][0];
      expect(args.select).toBe(candidateHistorySelect);
      expect(args).not.toHaveProperty('include');
      expect(args.orderBy).toEqual({ changedAt: 'asc' });
    });

    it('keeps the staff history as it was', async () => {
      prisma.application.findUnique.mockResolvedValueOnce({
        applicationId: 'app-1',
        organizationId: 'org-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      });
      prisma.recruiter.findUnique.mockResolvedValueOnce({ userId: 'user-1', departmentId: 'dep-1', organizationId: 'org-1' });
      prisma.application.findUnique.mockResolvedValueOnce({ applicationId: 'app-1', status: ApplicationStatus.rejected });
      prisma.applicationHistory.findMany.mockResolvedValueOnce(storedRows);

      await expect(service.getApplicationHistory('app-1', recruiter)).resolves.toBe(storedRows);
      expect(prisma.applicationHistory.findMany).toHaveBeenCalledWith({
        where: { applicationId: 'app-1' },
        include: { user: { select: { userId: true, fullName: true, role: true } } },
        orderBy: { changedAt: 'desc' },
      });
    });

    it("refuses a candidate another candidate's history (R2)", async () => {
      ownedBy('someone-else');

      await expect(service.getApplicationHistory('app-1', candidate)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.applicationHistory.findMany).not.toHaveBeenCalled();
    });

    it('maps the history inside the application a candidate opens', async () => {
      ownedBy('cand-user');
      prisma.application.findUnique.mockResolvedValueOnce({
        applicationId: 'app-1',
        status: ApplicationStatus.rejected,
        history: storedRows,
      });

      const application = await service.getApplicationById('app-1', candidate);

      expect(application.history).toEqual(minimalRows);
      const args = prisma.application.findUnique.mock.calls[1][0];
      expect(args.include.history).toEqual({ select: candidateHistorySelect, orderBy: { changedAt: 'asc' } });
    });

    it('keeps the history inside the application a recruiter opens as it was', async () => {
      prisma.application.findUnique.mockResolvedValueOnce({
        applicationId: 'app-1',
        organizationId: 'org-1',
        candidate: { userId: 'cand-user' },
        jobPosting: { departmentId: 'dep-1' },
      });
      prisma.recruiter.findUnique.mockResolvedValueOnce({ userId: 'user-1', departmentId: 'dep-1', organizationId: 'org-1' });
      prisma.application.findUnique.mockResolvedValueOnce({ applicationId: 'app-1', status: ApplicationStatus.rejected, history: storedRows });

      const application = await service.getApplicationById('app-1', recruiter);

      expect(application.history).toBe(storedRows);
      const args = prisma.application.findUnique.mock.calls[1][0];
      expect(args.include.history).toEqual({
        include: { user: { select: { userId: true, fullName: true, role: true } } },
        orderBy: { changedAt: 'desc' },
      });
    });

    it('sends no history with the candidate application list', async () => {
      prisma.candidate.findUnique.mockResolvedValueOnce({ candidateId: 'cand-1' });
      prisma.application.findMany.mockResolvedValueOnce([]);

      await service.getMyApplications('cand-user');

      expect(prisma.application.findMany.mock.calls[0][0].include.history).toBe(false);
    });
  });
});
