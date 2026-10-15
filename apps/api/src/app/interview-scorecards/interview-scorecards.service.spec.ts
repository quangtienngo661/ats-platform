import {
  ApplicationStatus,
  InterviewType,
  ScheduleStatus,
  ScorecardRecommendation,
  UserRole,
} from '@ats-platform/database';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import { UpsertScorecardDto } from './dto/upsert-scorecard.dto';
import {
  InterviewScorecardsService,
  type ScorecardListItem,
  type ScorecardView,
} from './interview-scorecards.service';

const interviewId = 'int-1';
const applicationId = 'app-1';
const interviewer = callerOf(UserRole.recruiter, { userId: 'interviewer-1' });
const dto: UpsertScorecardDto = {
  technicalSkills: 4,
  problemSolving: 5,
  communication: 3,
  cultureFit: 4,
  recommendation: ScorecardRecommendation.yes,
  comment: 'Giải thích rõ cách giải quyết vấn đề',
};
const application = {
  applicationId,
  organizationId: 'org-1',
  status: ApplicationStatus.interview,
  candidate: { userId: 'candidate-1' },
  jobPosting: { departmentId: 'dep-1' },
};
const schedule = {
  interviewId,
  organizationId: 'org-1',
  applicationId,
  scheduledBy: 'scheduler-1',
  interviewerId: interviewer.userId,
  status: ScheduleStatus.completed,
  startAt: new Date('2026-10-14T02:00:00.000Z'),
  interviewType: InterviewType.online,
  application,
};
const scorecard: ScorecardView = {
  id: 'scorecard-1',
  interviewId,
  ...dto,
  comment: dto.comment ?? null,
  submittedAt: new Date('2026-10-14T03:00:00.000Z'),
  updatedAt: new Date('2026-10-14T03:00:00.000Z'),
  author: { userId: interviewer.userId, fullName: 'Nguyễn An' },
};
const listItem: ScorecardListItem = {
  ...scorecard,
  interview: {
    interviewId,
    startAt: schedule.startAt,
    interviewType: schedule.interviewType,
    status: schedule.status,
  },
};

describe('InterviewScorecardsService', () => {
  let service: InterviewScorecardsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let interviewsService: { assertCanViewSchedule: jest.Mock };
  let applicationsService: { assertCanAccessApplication: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    interviewsService = { assertCanViewSchedule: jest.fn().mockResolvedValue(undefined) };
    applicationsService = { assertCanAccessApplication: jest.fn().mockResolvedValue(undefined) };
    prisma.interviewSchedule.findUnique.mockResolvedValue(schedule);
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.interviewScorecard.upsert.mockResolvedValue(scorecard);
    prisma.interviewScorecard.findUnique.mockResolvedValue(scorecard);
    prisma.interviewScorecard.findMany.mockResolvedValue([listItem]);
    service = new InterviewScorecardsService(
      prisma as any,
      interviewsService as any,
      applicationsService as any,
    );
  });

  it('creates a scorecard for the interviewer of a completed schedule', async () => {
    const payload = { ...dto, organizationId: 'org-from-client' };

    await expect(service.upsert(interviewer, interviewId, payload)).resolves.toEqual(scorecard);

    expect(prisma.interviewScorecard.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.interviewScorecard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interviewId },
        create: expect.objectContaining({
          ...dto,
          interviewId,
          organizationId: schedule.organizationId,
          authorId: interviewer.userId,
        }),
      }),
    );
    const args = prisma.interviewScorecard.upsert.mock.calls[0][0];
    expect(args.create.organizationId).not.toBe(payload.organizationId);
    expect(prisma.interviewScorecard.create).not.toHaveBeenCalled();
    expect(interviewsService.assertCanViewSchedule).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
  });

  it('updates the same row on a second submit', async () => {
    const revisedDto = { ...dto, technicalSkills: 5, comment: 'Bổ sung nhận xét' };
    const revisedScorecard = { ...scorecard, ...revisedDto };
    prisma.interviewScorecard.upsert
      .mockResolvedValueOnce(scorecard)
      .mockResolvedValueOnce(revisedScorecard);

    const first = await service.upsert(interviewer, interviewId, dto);
    const second = await service.upsert(interviewer, interviewId, revisedDto);

    expect(first.id).toBe(scorecard.id);
    expect(second).toEqual(revisedScorecard);
    expect(second.id).toBe(first.id);
    expect(prisma.interviewScorecard.upsert).toHaveBeenCalledTimes(2);
    for (const [args] of prisma.interviewScorecard.upsert.mock.calls) {
      expect(args.where).toEqual({ interviewId });
    }
    expect(prisma.interviewScorecard.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ update: expect.objectContaining(revisedDto) }),
    );
    expect(prisma.interviewScorecard.create).not.toHaveBeenCalled();
  });

  it('refuses the scheduler who is not the interviewer', async () => {
    // R1 must win over both an unfinished schedule and a closed application.
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      ...schedule,
      status: ScheduleStatus.scheduled,
      application: { ...application, status: ApplicationStatus.hired },
    });
    for (const role of [UserRole.recruiter, UserRole.org_admin]) {
      const scheduler = callerOf(role, { userId: schedule.scheduledBy });
      const call = service.upsert(scheduler, interviewId, dto);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Chỉ người phỏng vấn của lịch này được nộp đánh giá',
      });
    }
    expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
  });

  it('refuses a platform admin who is not the interviewer', async () => {
    const platformAdmin = callerOf(UserRole.admin, { userId: 'admin-1' });
    const call = service.upsert(platformAdmin, interviewId, dto);

    await expect(call).rejects.toBeInstanceOf(ForbiddenException);
    await expect(call).rejects.toMatchObject({
      status: 403,
      message: 'Chỉ người phỏng vấn của lịch này được nộp đánh giá',
    });
    expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
  });

  it('accepts an org_admin who is the interviewer', async () => {
    const orgAdmin = callerOf(UserRole.org_admin, { userId: schedule.interviewerId });

    await expect(service.upsert(orgAdmin, interviewId, dto)).resolves.toEqual(scorecard);

    expect(prisma.interviewScorecard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interviewId },
        create: expect.objectContaining({ authorId: orgAdmin.userId }),
      }),
    );
  });

  it.each([ScheduleStatus.scheduled, ScheduleStatus.cancelled])(
    'refuses a scheduled or cancelled schedule',
    async (status) => {
      // R2 must run before the closed-application check (R3).
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        ...schedule,
        status,
        application: { ...application, status: ApplicationStatus.hired },
      });
      const call = service.upsert(interviewer, interviewId, dto);

      await expect(call).rejects.toBeInstanceOf(ConflictException);
      await expect(call).rejects.toMatchObject({
        status: 409,
        message: 'Chỉ nộp đánh giá khi buổi phỏng vấn đã hoàn tất',
      });
      expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
    },
  );

  it.each([ApplicationStatus.hired, ApplicationStatus.rejected, ApplicationStatus.cancelled])(
    'refuses an application that is hired, rejected or cancelled',
    async (status) => {
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        ...schedule,
        application: { ...application, status },
      });
      const call = service.upsert(interviewer, interviewId, dto);

      await expect(call).rejects.toBeInstanceOf(ConflictException);
      await expect(call).rejects.toMatchObject({
        status: 409,
        message: 'Đơn đã chốt, không thể sửa đánh giá',
      });
      expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for a schedule of another organization', async () => {
    const otherApplication = {
      ...application,
      organizationId: 'org-2',
      status: ApplicationStatus.hired,
    };
    // The organization boundary must run before R1, R2, R3 and delegated access.
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      ...schedule,
      organizationId: 'org-2',
      interviewerId: 'someone-else',
      status: ScheduleStatus.scheduled,
      application: otherApplication,
    });
    prisma.application.findUnique.mockResolvedValue(otherApplication);

    for (const request of [
      () => service.upsert(interviewer, interviewId, dto),
      () => service.getForSchedule(interviewer, interviewId),
      () => service.listForApplication(interviewer, applicationId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({ status: 404 });
    }
    expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findUnique).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(interviewsService.assertCanViewSchedule).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown schedule', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue(null);

    for (const request of [
      () => service.upsert(interviewer, interviewId, dto),
      () => service.getForSchedule(interviewer, interviewId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy lịch phỏng vấn',
      });
    }
    expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findUnique).not.toHaveBeenCalled();
    expect(interviewsService.assertCanViewSchedule).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
  });

  it('refuses a recruiter of another department for reads', async () => {
    const otherDepartmentRecruiter = callerOf(UserRole.recruiter, {
      userId: 'recruiter-dep-2',
    });
    interviewsService.assertCanViewSchedule.mockRejectedValue(
      new ForbiddenException('Bạn không có quyền truy cập lịch phỏng vấn này'),
    );
    applicationsService.assertCanAccessApplication.mockRejectedValue(
      new ForbiddenException('Bạn không có quyền truy cập phòng ban này'),
    );

    const scheduleRead = service.getForSchedule(otherDepartmentRecruiter, interviewId);
    await expect(scheduleRead).rejects.toBeInstanceOf(ForbiddenException);
    await expect(scheduleRead).rejects.toMatchObject({ status: 403 });
    const applicationRead = service.listForApplication(otherDepartmentRecruiter, applicationId);
    await expect(applicationRead).rejects.toBeInstanceOf(ForbiddenException);
    await expect(applicationRead).rejects.toMatchObject({ status: 403 });

    expect(interviewsService.assertCanViewSchedule).toHaveBeenCalledWith(
      otherDepartmentRecruiter,
      interviewId,
    );
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(
      otherDepartmentRecruiter,
      applicationId,
    );
    expect(prisma.interviewScorecard.findUnique).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
  });

  it('reads still work once the application is closed', async () => {
    const closedApplication = { ...application, status: ApplicationStatus.hired };
    prisma.application.findUnique.mockResolvedValue(closedApplication);
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      ...schedule,
      application: closedApplication,
    });

    await expect(service.getForSchedule(interviewer, interviewId)).resolves.toEqual(scorecard);
    await expect(service.listForApplication(interviewer, applicationId)).resolves.toEqual([listItem]);

    expect(interviewsService.assertCanViewSchedule).toHaveBeenCalledWith(interviewer, interviewId);
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(interviewer, applicationId);
  });

  it('answers 404 when the schedule has no scorecard yet', async () => {
    prisma.interviewScorecard.findUnique.mockResolvedValue(null);
    const call = service.getForSchedule(interviewer, interviewId);

    await expect(call).rejects.toBeInstanceOf(NotFoundException);
    await expect(call).rejects.toMatchObject({
      status: 404,
      message: 'Chưa có đánh giá cho buổi phỏng vấn này',
    });
    expect(interviewsService.assertCanViewSchedule).toHaveBeenCalledWith(interviewer, interviewId);
  });

  it('refuses a candidate', async () => {
    const candidate = callerOf(UserRole.candidate, { userId: 'candidate-1' });
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      ...schedule,
      status: ScheduleStatus.scheduled,
      application: { ...application, status: ApplicationStatus.hired },
    });

    for (const request of [
      () => service.upsert(candidate, interviewId, dto),
      () => service.getForSchedule(candidate, interviewId),
      () => service.listForApplication(candidate, applicationId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Bạn không có quyền truy cập tài nguyên này',
      });
    }
    expect(prisma.interviewScorecard.upsert).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findUnique).not.toHaveBeenCalled();
    expect(prisma.interviewScorecard.findMany).not.toHaveBeenCalled();
    expect(interviewsService.assertCanViewSchedule).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
  });
});
