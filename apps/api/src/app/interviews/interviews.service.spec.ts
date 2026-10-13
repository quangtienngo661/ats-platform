import {
  ApplicationStatus,
  InterviewStatus,
  InterviewType,
  ScheduleStatus,
  UserRole,
} from '@ats-platform/database';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import {
  candidateScheduleSelect,
  scheduleIncludeOptions,
} from '../../common/utils/include-options.util';

const platformAdmin = callerOf(UserRole.admin, { userId: 'admin-1' });
const orgAdmin = callerOf(UserRole.org_admin); // organization 'org-1'

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    // Default: interviewer has no existing schedules, so the overlap check clears.
    prisma.interviewSchedule.findMany.mockResolvedValue([]);
    service = new InterviewsService(prisma as any);
  });

  it('creates a schedule for an interview-stage application', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
      status: ApplicationStatus.interview,
      jobPosting: { departmentId: 'dep-1' },
    });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
      organizationId: 'org-1',
      user: { userId: 'interviewer-1', role: UserRole.recruiter },
    });
    prisma.interviewSchedule.create.mockResolvedValue({ interviewId: 'int-1' });

    await service.createSchedule(platformAdmin, {
      applicationId: 'app-1',
      interviewerId: 'interviewer-1',
      interviewType: InterviewType.online,
      startAt: '2026-06-01T09:00:00.000Z',
      durationMinutes: 60,
      onlineMeetingLink: 'https://meet.test',
    } as any);

    expect(prisma.interviewSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-1',
          scheduledBy: 'admin-1',
          interviewerId: 'interviewer-1',
        }),
      }),
    );
  });

  it('rejects scheduling when application is not in interview status', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      status: ApplicationStatus.screening,
      jobPosting: { departmentId: 'dep-1' },
    });

    await expect(
      service.createSchedule(platformAdmin, {
        applicationId: 'app-1',
      } as any),
    ).rejects.toThrow('tr');
  });

  it('rejects schedule conflicts for the same interviewer and time', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
      status: ApplicationStatus.interview,
      jobPosting: { departmentId: 'dep-1' },
    });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
      organizationId: 'org-1',
      user: { userId: 'interviewer-1', role: UserRole.recruiter },
    });
    prisma.interviewSchedule.findMany.mockResolvedValue([
      { startAt: new Date('2026-06-01T09:00:00.000Z'), durationMinutes: 60 },
    ]);

    await expect(
      service.createSchedule(platformAdmin, {
        applicationId: 'app-1',
        interviewerId: 'interviewer-1',
        interviewType: InterviewType.online,
        startAt: '2026-06-01T09:00:00.000Z',
        durationMinutes: 60,
      } as any),
    ).rejects.toThrow('trùng');
  });

  it('rejects an overlapping schedule even when start times differ (C-02)', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      organizationId: 'org-1',
      status: ApplicationStatus.interview,
      jobPosting: { departmentId: 'dep-1' },
    });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
      organizationId: 'org-1',
      user: { userId: 'interviewer-1', role: UserRole.recruiter },
    });
    // Interviewer already booked 09:00–10:00; the new slot is 09:30–10:30 — they overlap,
    // even though the start times differ (the exact-time check let this through).
    prisma.interviewSchedule.findMany.mockResolvedValue([
      { startAt: new Date('2026-06-01T09:00:00.000Z'), durationMinutes: 60 },
    ]);

    await expect(
      service.createSchedule(platformAdmin, {
        applicationId: 'app-1',
        interviewerId: 'interviewer-1',
        interviewType: InterviewType.online,
        startAt: '2026-06-01T09:30:00.000Z',
        durationMinutes: 60,
      } as any),
    ).rejects.toThrow('trùng');
  });

  it('filters my schedules for candidates with date range pagination', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSchedule.findMany.mockResolvedValue([
      { interviewId: 'int-1' },
    ]);
    prisma.interviewSchedule.count.mockResolvedValue(1);

    await expect(
      service.getMySchedules(callerOf(UserRole.candidate), {
        page: 2,
        limit: 5,
        fromDate: '2026-06-01',
        toDate: '2026-06-02',
      } as any),
    ).resolves.toEqual({
      items: [{ interviewId: 'int-1' }],
      pagination: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });

    expect(prisma.interviewSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          application: { candidateId: 'cand-1' },
          startAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
        skip: 5,
        take: 5,
      }),
    );
  });

  describe('schedules across organizations', () => {
    const interviewApplication = (organizationId: string) => ({
      applicationId: 'app-1',
      organizationId,
      status: ApplicationStatus.interview,
      jobPosting: { departmentId: 'dep-1' },
    });
    const interviewer = (organizationId: string) => ({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
      organizationId,
      user: { userId: 'interviewer-1', role: UserRole.recruiter },
    });
    const dto = {
      applicationId: 'app-1',
      interviewerId: 'interviewer-1',
      interviewType: InterviewType.online,
      startAt: '2026-06-01T09:00:00.000Z',
      durationMinutes: 60,
    } as any;

    // Holds for EVERY caller, platform admin included: the interviewer would be
    // handed another organization's candidate through the schedule.
    it('refuses an interviewer from another organization, even for a platform admin', async () => {
      prisma.application.findUnique.mockResolvedValue(
        interviewApplication('org-1'),
      );
      prisma.recruiter.findUnique.mockResolvedValue(interviewer('org-2'));

      await expect(service.createSchedule(platformAdmin, dto)).rejects.toThrow(
        'cùng tổ chức',
      );
      expect(prisma.interviewSchedule.create).not.toHaveBeenCalled();
    });

    it("refuses an org_admin scheduling another organization's application (criterion 2)", async () => {
      prisma.application.findUnique.mockResolvedValue(
        interviewApplication('org-2'),
      );

      await expect(service.createSchedule(orgAdmin, dto)).rejects.toThrow(
        'tổ chức khác',
      );
      expect(prisma.interviewSchedule.create).not.toHaveBeenCalled();
    });

    it('lets an org_admin schedule in its organization, across departments (6b)', async () => {
      prisma.application.findUnique.mockResolvedValue(
        interviewApplication('org-1'),
      );
      prisma.recruiter.findUnique.mockResolvedValue({
        ...interviewer('org-1'),
        departmentId: 'another-dep',
      });
      prisma.interviewSchedule.create.mockResolvedValue({
        interviewId: 'int-9',
      });

      await service.createSchedule(orgAdmin, dto);

      expect(
        prisma.interviewSchedule.create.mock.calls[0][0].data,
      ).toMatchObject({
        organizationId: 'org-1',
        scheduledBy: 'user-1',
      });
    });

    it('refuses an org_admin a schedule of another organization', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        organizationId: 'org-2',
        scheduledBy: 'someone',
        interviewerId: 'someone-else',
        application: {
          candidate: { userId: 'cand-user' },
          jobPosting: { departmentId: 'dep-of-org-2' },
        },
      });

      await expect(service.getScheduleById('int-2', orgAdmin)).rejects.toThrow(
        'tổ chức khác',
      );
    });

    // A recruiter moved to another organization keeps no access to the schedules
    // it created or runs in the old one.
    it('refuses the recruiter who created a schedule once it is in another organization', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        organizationId: 'org-2',
        scheduledBy: 'user-1',
        interviewerId: 'user-1',
        application: {
          candidate: { userId: 'cand-user' },
          jobPosting: { departmentId: 'dep-1' },
        },
      });

      await expect(
        service.getScheduleById('int-3', callerOf(UserRole.recruiter)),
      ).rejects.toThrow('tổ chức khác');
    });

    it("lists an org_admin's schedules for its whole organization", async () => {
      prisma.interviewSchedule.count.mockResolvedValue(0);

      await service.getMySchedules(orgAdmin, {} as any);

      const { where } = prisma.interviewSchedule.findMany.mock.calls[0][0];
      expect(where.organizationId).toBe('org-1');
      expect(where.OR).toBeUndefined();
    });

    it("lists a recruiter's own schedules, inside its organization", async () => {
      prisma.interviewSchedule.count.mockResolvedValue(0);

      await service.getMySchedules(callerOf(UserRole.recruiter), {} as any);

      const { where } = prisma.interviewSchedule.findMany.mock.calls[0][0];
      expect(where.organizationId).toBe('org-1');
      expect(where.OR).toEqual([
        { interviewerId: 'user-1' },
        { scheduledBy: 'user-1' },
      ]);
    });

    it("lists every organization's schedules for a platform admin (6a)", async () => {
      prisma.interviewSchedule.count.mockResolvedValue(0);

      await service.getMySchedules(platformAdmin, {});

      const { where } = prisma.interviewSchedule.findMany.mock.calls[0][0];
      expect(where.organizationId).toBeUndefined();
    });
  });

  it('creates, updates, and blocks deletion of interview topics with sessions', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.interviewTopic.create.mockResolvedValue({ topicId: 'topic-1' });

    await service.createTopic({ name: 'Backend', categoryId: 'cat-1' });
    expect(prisma.interviewTopic.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Backend',
          category: { connect: { categoryId: 'cat-1' } },
        },
      }),
    );

    prisma.interviewTopic.findUnique.mockResolvedValue({
      topicId: 'topic-1',
      _count: { sessions: 1 },
    });
    await expect(service.removeTopic('topic-1')).rejects.toThrow('x');
  });

  it('hides interview session results from non-owners', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewResult.findUnique.mockResolvedValue({
      resultId: 'result-1',
      session: { candidateId: 'other' },
    });

    await expect(
      service.getSessionResult('session-1', 'user-1'),
    ).rejects.toThrow('qu');
  });

  it('returns my session summaries for a candidate', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSession.findMany.mockResolvedValue([
      { sessionId: 'session-1', status: InterviewStatus.completed },
    ]);

    await expect(service.getMySessions('user-1')).resolves.toEqual([
      { sessionId: 'session-1', status: InterviewStatus.completed },
    ]);
  });

  describe('updateSchedule — status transitions', () => {
    const scheduleAt = (status: ScheduleStatus) => ({
      interviewId: 'int-1',
      organizationId: 'org-1',
      scheduledBy: 'user-1',
      interviewerId: 'user-2',
      startAt: new Date('2026-08-01T09:00:00Z'),
      durationMinutes: 60,
      status,
      application: { jobPosting: { departmentId: 'dep-1' } },
    });

    it('refuses to reopen a completed interview', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleAt(ScheduleStatus.completed),
      );

      await expect(
        service.updateSchedule('int-1', callerOf(UserRole.admin), {
          status: ScheduleStatus.scheduled,
        } as any),
      ).rejects.toThrow('Không thể chuyển trạng thái lịch phỏng vấn');
      expect(prisma.interviewSchedule.update).not.toHaveBeenCalled();
    });

    it('refuses to complete a cancelled interview', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleAt(ScheduleStatus.cancelled),
      );

      await expect(
        service.updateSchedule('int-1', callerOf(UserRole.admin), {
          status: ScheduleStatus.completed,
        } as any),
      ).rejects.toThrow('Không thể chuyển trạng thái lịch phỏng vấn');
    });

    it('allows scheduled → completed', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        scheduleAt(ScheduleStatus.scheduled),
      );
      prisma.interviewSchedule.update.mockResolvedValue({
        interviewId: 'int-1',
        status: ScheduleStatus.completed,
      });

      await service.updateSchedule('int-1', callerOf(UserRole.admin), {
        status: ScheduleStatus.completed,
      } as any);

      expect(prisma.interviewSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ScheduleStatus.completed }),
        }),
      );
    });
  });

  describe('removeSchedule', () => {
    const interviewId = 'int-1';

    beforeEach(() => {
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        interviewId,
        organizationId: 'org-1',
        scheduledBy: 'user-1',
        interviewerId: 'user-2',
        startAt: new Date('2026-08-01T09:00:00Z'),
        durationMinutes: 60,
        status: ScheduleStatus.completed,
        application: { jobPosting: { departmentId: 'dep-1' } },
      });
      prisma.interviewSchedule.delete.mockResolvedValue({ interviewId });
    });

    it('refuses to delete a schedule that has a scorecard', async () => {
      prisma.interviewScorecard.count.mockResolvedValue(1);

      const call = service.removeSchedule(interviewId, orgAdmin);

      await expect(call).rejects.toBeInstanceOf(ConflictException);
      await expect(call).rejects.toHaveProperty(
        'message',
        'Buổi phỏng vấn đã có đánh giá, không thể xoá',
      );
      expect(prisma.interviewSchedule.delete).not.toHaveBeenCalled();
      expect(prisma.interviewScorecard.count).toHaveBeenCalledWith({
        where: { interviewId },
      });
    });

    it('still deletes a schedule without one', async () => {
      prisma.interviewScorecard.count.mockResolvedValue(0);

      await service.removeSchedule(interviewId, orgAdmin);

      expect(prisma.interviewSchedule.delete).toHaveBeenCalledWith({
        where: { interviewId },
      });
    });

    it('still answers 404 for an unknown schedule', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.removeSchedule(interviewId, orgAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.interviewSchedule.delete).not.toHaveBeenCalled();
    });
  });

  describe('candidate payload (R1, C1, C2, C19)', () => {
    const candidate = callerOf(UserRole.candidate); // userId 'user-1'

    beforeEach(() => {
      prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
      prisma.interviewSchedule.findMany.mockResolvedValue([]);
      prisma.interviewSchedule.count.mockResolvedValue(0);
    });

    it('describes the candidate payload exactly', () => {
      // The whole contract of what leaves the API for a candidate: no staff
      // e-mail, phone, role or status, no scheduler, no candidate user row.
      expect(candidateScheduleSelect).toEqual({
        interviewId: true,
        startAt: true,
        durationMinutes: true,
        interviewType: true,
        onlineMeetingLink: true,
        location: true,
        status: true,
        interviewer: { select: { fullName: true } },
        application: {
          select: {
            applicationId: true,
            jobPosting: {
              select: {
                jobId: true,
                title: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
      });
    });

    it('returns only the candidate-safe fields of my schedules', async () => {
      await service.getMySchedules(candidate, {});

      const args = prisma.interviewSchedule.findMany.mock.calls[0][0];
      expect(args.select).toBe(candidateScheduleSelect);
      expect(args).not.toHaveProperty('include');
      // Candidates are shared across organizations: never narrowed to one.
      expect(args.where).toEqual({ application: { candidateId: 'cand-1' } });
    });

    it('keeps the full schedule payload for staff', async () => {
      await service.getMySchedules(platformAdmin, {});

      const args = prisma.interviewSchedule.findMany.mock.calls[0][0];
      expect(args.include).toBe(scheduleIncludeOptions);
      expect(args).not.toHaveProperty('select');
    });

    it('sorts my schedules descending when order is desc', async () => {
      await service.getMySchedules(candidate, { order: 'desc' });
      await service.getMySchedules(candidate, {});

      expect(prisma.interviewSchedule.findMany.mock.calls[0][0].orderBy).toEqual({ startAt: 'desc' });
      expect(prisma.interviewSchedule.findMany.mock.calls[1][0].orderBy).toEqual({ startAt: 'asc' });
    });

    it('gives a candidate the minimal payload of its own schedule', async () => {
      prisma.interviewSchedule.findUnique
        .mockResolvedValueOnce({
          organizationId: 'org-1',
          scheduledBy: 'user-9',
          interviewerId: 'user-8',
          application: {
            candidate: { userId: 'user-1' },
            jobPosting: { departmentId: 'dep-1' },
          },
        })
        .mockResolvedValueOnce({ interviewId: 'int-1' });

      await service.getScheduleById('int-1', candidate);

      const args = prisma.interviewSchedule.findUnique.mock.calls[1][0];
      expect(args.select).toBe(candidateScheduleSelect);
      expect(args).not.toHaveProperty('include');
    });

    it('refuses a candidate the schedule of another candidate', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValueOnce({
        organizationId: 'org-1',
        scheduledBy: 'user-9',
        interviewerId: 'user-8',
        application: {
          candidate: { userId: 'someone-else' },
          jobPosting: { departmentId: 'dep-1' },
        },
      });

      await expect(service.getScheduleById('int-1', candidate)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.interviewSchedule.findUnique).toHaveBeenCalledTimes(1);
    });

    it('still answers 404 for a candidate account without a profile', async () => {
      prisma.candidate.findUnique.mockResolvedValue(null);

      const call = service.getMySchedules(candidate, {});
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toThrow('Không tìm thấy hồ sơ ứng viên');
    });
  });

  describe('interview type and location (R3, R9)', () => {
    const existingSchedule = (overrides: Record<string, unknown>) => ({
      interviewId: 'int-1',
      organizationId: 'org-1',
      scheduledBy: 'user-1',
      interviewerId: 'user-2',
      startAt: new Date('2026-10-05T02:00:00Z'),
      durationMinutes: 60,
      status: ScheduleStatus.scheduled,
      interviewType: InterviewType.onsite,
      location: null,
      onlineMeetingLink: null,
      application: { jobPosting: { departmentId: 'dep-1' } },
      ...overrides,
    });
    const updateData = () => prisma.interviewSchedule.update.mock.calls[0][0].data;

    beforeEach(() => {
      prisma.interviewSchedule.update.mockResolvedValue({ interviewId: 'int-1' });
    });

    it('clears the meeting link when switching to onsite', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        existingSchedule({ interviewType: InterviewType.online, onlineMeetingLink: 'https://meet.example.com/old' }),
      );

      await service.updateSchedule('int-1', platformAdmin, {
        interviewType: InterviewType.onsite,
        location: 'Tầng 5',
      } as any);

      expect(updateData()).toEqual(
        expect.objectContaining({ interviewType: 'onsite', location: 'Tầng 5', onlineMeetingLink: null }),
      );
    });

    it('clears the location when switching to online', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(existingSchedule({ location: 'Tầng 5' }));

      await service.updateSchedule('int-1', platformAdmin, {
        interviewType: InterviewType.online,
        onlineMeetingLink: 'https://meet.example.com/x',
      } as any);

      expect(updateData()).toEqual(
        expect.objectContaining({
          interviewType: 'online',
          onlineMeetingLink: 'https://meet.example.com/x',
          location: null,
        }),
      );
    });

    it('refuses switching to onsite without a location', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(
        existingSchedule({ interviewType: InterviewType.online, onlineMeetingLink: 'https://meet.example.com/old' }),
      );

      await expect(
        service.updateSchedule('int-1', platformAdmin, { interviewType: InterviewType.onsite } as any),
      ).rejects.toThrow('Phỏng vấn trực tiếp cần địa điểm');
      expect(prisma.interviewSchedule.update).not.toHaveBeenCalled();
    });

    it('refuses switching to online without a meeting link', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(existingSchedule({ location: 'Tầng 5' }));

      await expect(
        service.updateSchedule('int-1', platformAdmin, { interviewType: InterviewType.online } as any),
      ).rejects.toThrow('Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ');
      expect(prisma.interviewSchedule.update).not.toHaveBeenCalled();
    });

    it('lets a legacy onsite schedule without location change only its duration', async () => {
      prisma.interviewSchedule.findUnique.mockResolvedValue(existingSchedule({}));

      await service.updateSchedule('int-1', platformAdmin, { durationMinutes: 90 } as any);

      expect(prisma.interviewSchedule.update).toHaveBeenCalled();
      expect(updateData()).not.toHaveProperty('location');
      expect(updateData()).not.toHaveProperty('onlineMeetingLink');
    });

    describe('when creating', () => {
      beforeEach(() => {
        prisma.application.findUnique.mockResolvedValue({
          applicationId: 'app-1',
          organizationId: 'org-1',
          status: ApplicationStatus.interview,
          jobPosting: { departmentId: 'dep-1' },
        });
        prisma.recruiter.findUnique.mockResolvedValue({
          recruiterId: 'rec-1',
          departmentId: 'dep-1',
          organizationId: 'org-1',
          user: { userId: 'interviewer-1', role: UserRole.recruiter },
        });
        prisma.interviewSchedule.create.mockResolvedValue({ interviewId: 'int-1' });
      });

      const createData = () => prisma.interviewSchedule.create.mock.calls[0][0].data;
      const base = {
        applicationId: 'app-1',
        interviewerId: 'interviewer-1',
        startAt: '2026-10-05T02:00:00.000Z',
        durationMinutes: 60,
      };

      it('stores the trimmed location of a new onsite schedule', async () => {
        await service.createSchedule(platformAdmin, {
          ...base,
          interviewType: InterviewType.onsite,
          location: '  Tầng 5, 123 Lê Lợi, Q.1  ',
        } as any);

        expect(createData()).toEqual(
          expect.objectContaining({ location: 'Tầng 5, 123 Lê Lợi, Q.1', onlineMeetingLink: null }),
        );
      });

      it('stores the trimmed meeting link of a new online schedule', async () => {
        await service.createSchedule(platformAdmin, {
          ...base,
          interviewType: InterviewType.online,
          onlineMeetingLink: '  HTTPS://meet.example.com/abc  ',
        } as any);

        expect(createData()).toEqual(
          expect.objectContaining({ onlineMeetingLink: 'HTTPS://meet.example.com/abc', location: null }),
        );
      });
    });
  });
});
