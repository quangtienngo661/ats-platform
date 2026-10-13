import {
  ApplicationStatus,
  InterviewType,
  Prisma,
  ScheduleStatus,
  ScorecardRecommendation,
} from '@ats-platform/database';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertInCallerOrganizationOr404,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { ApplicationsService } from '../applications/applications.service';
import { InterviewsService } from '../interviews/interviews.service';
import { UpsertScorecardDto } from './dto/upsert-scorecard.dto';

export type ScorecardView = {
  id: string;
  interviewId: string;
  technicalSkills: number;
  problemSolving: number;
  communication: number;
  cultureFit: number;
  recommendation: ScorecardRecommendation;
  comment: string | null;
  submittedAt: Date;
  updatedAt: Date;
  author: { userId: string; fullName: string };
};

export type ScorecardListItem = ScorecardView & {
  interview: {
    interviewId: string;
    startAt: Date;
    interviewType: InterviewType;
    status: ScheduleStatus;
  };
};

const scorecardSelect = {
  id: true,
  interviewId: true,
  technicalSkills: true,
  problemSolving: true,
  communication: true,
  cultureFit: true,
  recommendation: true,
  comment: true,
  submittedAt: true,
  updatedAt: true,
  author: { select: { userId: true, fullName: true } },
} satisfies Prisma.InterviewScorecardSelect;

@Injectable()
export class InterviewScorecardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewsService: InterviewsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async upsert(
    caller: TenantCaller,
    interviewId: string,
    dto: UpsertScorecardDto,
  ): Promise<ScorecardView> {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: {
        organizationId: true,
        interviewerId: true,
        status: true,
        application: { select: { status: true } },
      },
    });
    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    }
    assertInCallerOrganizationOr404(
      caller,
      schedule.organizationId,
      'Không tìm thấy lịch phỏng vấn',
    );

    if (schedule.interviewerId !== caller.userId) {
      throw new ForbiddenException(
        'Chỉ người phỏng vấn của lịch này được nộp đánh giá',
      );
    }
    if (schedule.status !== ScheduleStatus.completed) {
      throw new ConflictException(
        'Chỉ nộp đánh giá khi buổi phỏng vấn đã hoàn tất',
      );
    }
    if (
      schedule.application.status === ApplicationStatus.hired ||
      schedule.application.status === ApplicationStatus.rejected ||
      schedule.application.status === ApplicationStatus.cancelled
    ) {
      throw new ConflictException('Đơn đã chốt, không thể sửa đánh giá');
    }

    return this.prisma.interviewScorecard.upsert({
      where: { interviewId },
      create: {
        interviewId,
        organizationId: schedule.organizationId,
        authorId: caller.userId,
        technicalSkills: dto.technicalSkills,
        problemSolving: dto.problemSolving,
        communication: dto.communication,
        cultureFit: dto.cultureFit,
        recommendation: dto.recommendation,
        comment: dto.comment ?? null,
      },
      update: {
        technicalSkills: dto.technicalSkills,
        problemSolving: dto.problemSolving,
        communication: dto.communication,
        cultureFit: dto.cultureFit,
        recommendation: dto.recommendation,
        comment: dto.comment ?? null,
      },
      select: scorecardSelect,
    });
  }

  async getForSchedule(
    caller: TenantCaller,
    interviewId: string,
  ): Promise<ScorecardView> {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: { organizationId: true },
    });
    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    }
    assertInCallerOrganizationOr404(
      caller,
      schedule.organizationId,
      'Không tìm thấy lịch phỏng vấn',
    );
    await this.interviewsService.assertCanViewSchedule(caller, interviewId);

    const scorecard = await this.prisma.interviewScorecard.findUnique({
      where: { interviewId },
      select: scorecardSelect,
    });
    if (!scorecard) {
      throw new NotFoundException('Chưa có đánh giá cho buổi phỏng vấn này');
    }
    return scorecard;
  }

  async listForApplication(
    caller: TenantCaller,
    applicationId: string,
  ): Promise<ScorecardListItem[]> {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { organizationId: true },
    });
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }
    assertInCallerOrganizationOr404(
      caller,
      application.organizationId,
      'Không tìm thấy đơn ứng tuyển',
    );
    await this.applicationsService.assertCanAccessApplication(caller, applicationId);

    return this.prisma.interviewScorecard.findMany({
      where: { interview: { applicationId } },
      select: {
        ...scorecardSelect,
        interview: {
          select: {
            interviewId: true,
            startAt: true,
            interviewType: true,
            status: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
