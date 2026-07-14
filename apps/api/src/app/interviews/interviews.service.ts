import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInterviewScheduleDto } from './dto/create-interview.dto';
import { UpdateInterviewScheduleDto } from './dto/update-interview.dto';
import { GetInterviewSchedulesQueryDto } from './dto/get-interview-schedules-query.dto';
import { CreateInterviewTopicDto } from './dto/create-interview-topic.dto';
import { UpdateInterviewTopicDto } from './dto/update-interview-topic.dto';
import {
  ApplicationStatus,
  Prisma,
  ScheduleStatus,
  UserRole,
} from '@ats-platform/database';
import {
  interviewTopicCategorySelect,
  interviewTopicIncludeOptions,
  scheduleIncludeOptions,
} from '../../common/utils/include-options.util';

/**
 * Mirrors the `VALID_TRANSITIONS` map in `applications.service.ts`. Both `completed`
 * and `cancelled` are terminal — a finished interview must not be flipped back to
 * `scheduled`, which the API previously accepted without complaint.
 */
const VALID_SCHEDULE_TRANSITIONS: Partial<
  Record<ScheduleStatus, ScheduleStatus[]>
> = {
  [ScheduleStatus.scheduled]: [
    ScheduleStatus.completed,
    ScheduleStatus.cancelled,
  ],
  [ScheduleStatus.completed]: [],
  [ScheduleStatus.cancelled]: [],
};

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRecruiterDepartmentId(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      select: { departmentId: true },
    });

    if (!recruiter)
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
    return recruiter.departmentId;
  }

  private getEndOfDay(dateString: string) {
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private async assertTopicCategoryExists(categoryId?: string | null) {
    if (!categoryId) return;

    const category = await this.prisma.jobCategory.findUnique({
      where: { categoryId },
      select: { categoryId: true },
    });

    if (!category)
      throw new NotFoundException('Không tìm thấy danh mục công việc');
  }

  private async assertCanScheduleApplication(
    userId: string,
    role: string,
    applicationId: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: {
        applicationId: true,
        status: true,
        jobPosting: { select: { departmentId: true } },
      },
    });

    if (!application)
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    if (application.status !== ApplicationStatus.interview) {
      throw new BadRequestException(
        'Chỉ có thể đặt lịch phỏng vấn cho đơn đang ở trạng thái phỏng vấn',
      );
    }

    if (role === UserRole.admin) return application;
    if (role !== UserRole.recruiter) {
      throw new ForbiddenException(
        'Bạn không có quyền lên lịch phỏng vấn cho đơn ứng tuyển này',
      );
    }

    const recruiterDepartmentId = await this.getRecruiterDepartmentId(userId);
    if (recruiterDepartmentId !== application.jobPosting.departmentId) {
      throw new ForbiddenException(
        'Bạn không có quyền lên lịch phỏng vấn cho đơn ứng tuyển này',
      );
    }

    return application;
  }

  private async assertCanUseInterviewer(
    userId: string,
    role: string,
    interviewerId: string,
    departmentId: string,
  ) {
    const interviewer = await this.prisma.recruiter.findUnique({
      where: { userId: interviewerId },
      select: {
        recruiterId: true,
        departmentId: true,
        user: { select: { userId: true, role: true } },
      },
    });

    if (!interviewer) {
      throw new BadRequestException(
        'Người phỏng vấn phải là tài khoản nhà tuyển dụng',
      );
    }

    if (interviewer.user.role !== UserRole.recruiter) {
      throw new BadRequestException(
        'Người phỏng vấn phải là tài khoản nhà tuyển dụng',
      );
    }

    if (role === UserRole.admin) return;
    if (role !== UserRole.recruiter) {
      throw new ForbiddenException('Bạn không có quyền chọn người phỏng vấn');
    }

    const recruiterDepartmentId = await this.getRecruiterDepartmentId(userId);
    if (
      recruiterDepartmentId !== departmentId ||
      interviewer.departmentId !== departmentId
    ) {
      throw new ForbiddenException(
        'Người phỏng vấn phải thuộc cùng khoa với đơn ứng tuyển',
      );
    }
  }

  private async assertNoScheduleConflict(
    interviewerId: string,
    scheduledDate: Date,
    scheduledTime: Date,
    excludedInterviewId?: string,
  ) {
    const conflict = await this.prisma.interviewSchedule.findFirst({
      where: {
        interviewerId,
        scheduledDate,
        scheduledTime,
        status: ScheduleStatus.scheduled,
        ...(excludedInterviewId
          ? { NOT: { interviewId: excludedInterviewId } }
          : {}),
      },
      select: { interviewId: true },
    });

    if (conflict) {
      throw new BadRequestException(
        'Người phỏng vấn đã có lịch ở thời điểm này',
      );
    }
  }

  private async assertCanViewSchedule(
    userId: string,
    role: string,
    interviewId: string,
  ) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: {
        scheduledBy: true,
        interviewerId: true,
        application: {
          select: {
            candidate: { select: { userId: true } },
            jobPosting: { select: { departmentId: true } },
          },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    if (role === UserRole.admin) return;
    if (
      role === UserRole.candidate &&
      schedule.application.candidate.userId === userId
    )
      return;
    if (role === UserRole.recruiter) {
      if (schedule.scheduledBy === userId || schedule.interviewerId === userId)
        return;

      const recruiterDepartmentId = await this.getRecruiterDepartmentId(userId);
      if (
        recruiterDepartmentId === schedule.application.jobPosting.departmentId
      )
        return;
    }

    throw new ForbiddenException(
      'Bạn không có quyền truy cập lịch phỏng vấn này',
    );
  }

  private async assertCanMutateSchedule(
    userId: string,
    role: string,
    interviewId: string,
  ) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: {
        interviewId: true,
        scheduledBy: true,
        interviewerId: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        application: {
          select: { jobPosting: { select: { departmentId: true } } },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    if (role === UserRole.admin || schedule.scheduledBy === userId)
      return schedule;

    throw new ForbiddenException('Bạn không phải người tạo lịch phỏng vấn này');
  }

  async createSchedule(
    userId: string,
    role: string,
    dto: CreateInterviewScheduleDto,
  ) {
    const application = await this.assertCanScheduleApplication(
      userId,
      role,
      dto.applicationId,
    );
    await this.assertCanUseInterviewer(
      userId,
      role,
      dto.interviewerId,
      application.jobPosting.departmentId,
    );
    const scheduledDate = new Date(dto.scheduledDate);
    const scheduledTime = new Date(dto.scheduledTime);
    await this.assertNoScheduleConflict(
      dto.interviewerId,
      scheduledDate,
      scheduledTime,
    );

    return this.prisma.interviewSchedule.create({
      data: {
        applicationId: dto.applicationId,
        scheduledBy: userId,
        interviewerId: dto.interviewerId,
        interviewType: dto.interviewType,
        scheduledDate,
        scheduledTime,
        onlineMeetingLink: dto.onlineMeetingLink,
      },
      include: scheduleIncludeOptions,
    });
  }

  async getMySchedules(
    userId: string,
    role: string,
    query: GetInterviewSchedulesQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === UserRole.candidate) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
        select: { candidateId: true },
      });
      if (!candidate)
        throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

      where.application = { candidateId: candidate.candidateId };
    } else if (role === UserRole.recruiter) {
      where.OR = [{ interviewerId: userId }, { scheduledBy: userId }];
    }

    if (query.applicationId) {
      where.applicationId = query.applicationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.scheduledDate = {};
      if (query.fromDate) where.scheduledDate.gte = new Date(query.fromDate);
      if (query.toDate)
        where.scheduledDate.lte = this.getEndOfDay(query.toDate);
    }

    const [schedules, total] = await Promise.all([
      this.prisma.interviewSchedule.findMany({
        where,
        include: scheduleIncludeOptions,
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.interviewSchedule.count({ where }),
    ]);

    return {
      items: schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getScheduleById(interviewId: string, userId: string, role: string) {
    await this.assertCanViewSchedule(userId, role, interviewId);

    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      include: scheduleIncludeOptions,
    });

    if (!schedule) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    return schedule;
  }

  async updateSchedule(
    interviewId: string,
    userId: string,
    role: string,
    dto: UpdateInterviewScheduleDto,
  ) {
    const schedule = await this.assertCanMutateSchedule(
      userId,
      role,
      interviewId,
    );

    const updateData: any = {};
    if (dto.interviewerId) {
      await this.assertCanUseInterviewer(
        userId,
        role,
        dto.interviewerId,
        schedule.application.jobPosting.departmentId,
      );
      updateData.interviewerId = dto.interviewerId;
    }
    if (dto.interviewType) updateData.interviewType = dto.interviewType;
    if (dto.scheduledDate)
      updateData.scheduledDate = new Date(dto.scheduledDate);
    if (dto.scheduledTime)
      updateData.scheduledTime = new Date(dto.scheduledTime);
    if (dto.onlineMeetingLink !== undefined)
      updateData.onlineMeetingLink = dto.onlineMeetingLink;

    if (dto.status && dto.status !== schedule.status) {
      const allowedNext = VALID_SCHEDULE_TRANSITIONS[schedule.status] ?? [];
      if (!allowedNext.includes(dto.status)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái lịch phỏng vấn từ '${schedule.status}' sang '${dto.status}'. ` +
            `Các trạng thái hợp lệ: [${allowedNext.join(', ') || 'không có - đây là trạng thái cuối'}]`,
        );
      }
      updateData.status = dto.status;
    }

    const nextInterviewerId =
      updateData.interviewerId ?? schedule.interviewerId;
    const nextScheduledDate =
      updateData.scheduledDate ?? schedule.scheduledDate;
    const nextScheduledTime =
      updateData.scheduledTime ?? schedule.scheduledTime;
    if (
      dto.interviewerId !== undefined ||
      dto.scheduledDate !== undefined ||
      dto.scheduledTime !== undefined
    ) {
      await this.assertNoScheduleConflict(
        nextInterviewerId,
        nextScheduledDate,
        nextScheduledTime,
        interviewId,
      );
    }

    return this.prisma.interviewSchedule.update({
      where: { interviewId },
      data: updateData,
      include: scheduleIncludeOptions,
    });
  }

  async removeSchedule(interviewId: string, userId: string, role: string) {
    await this.assertCanMutateSchedule(userId, role, interviewId);

    return this.prisma.interviewSchedule.delete({
      where: { interviewId },
    });
  }

  async createTopic(dto: CreateInterviewTopicDto) {
    const categoryId = dto.categoryId?.trim() || null;
    await this.assertTopicCategoryExists(categoryId);

    const data: Prisma.InterviewTopicCreateInput = { name: dto.name };
    if (categoryId) {
      data.category = { connect: { categoryId } };
    }

    return this.prisma.interviewTopic.create({
      data,
      include: interviewTopicIncludeOptions,
    });
  }
  async findAllTopics() {
    return this.prisma.interviewTopic.findMany({
      orderBy: { name: 'asc' },
      include: interviewTopicIncludeOptions,
    });
  }
  async findTopicById(topicId: string) {
    const topic = await this.prisma.interviewTopic.findUnique({
      where: { topicId },
      include: interviewTopicIncludeOptions,
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề phỏng vấn');
    return topic;
  }
  async updateTopic(topicId: string, dto: UpdateInterviewTopicDto) {
    const topic = await this.prisma.interviewTopic.findUnique({
      where: { topicId },
      select: { topicId: true },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề phỏng vấn');

    const updateData: Prisma.InterviewTopicUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.categoryId !== undefined) {
      const categoryId = dto.categoryId?.trim() || null;
      await this.assertTopicCategoryExists(categoryId);
      updateData.category = categoryId
        ? { connect: { categoryId } }
        : { disconnect: true };
    }

    return this.prisma.interviewTopic.update({
      where: { topicId },
      data: updateData,
      include: interviewTopicIncludeOptions,
    });
  }
  async removeTopic(topicId: string) {
    const topic = await this.prisma.interviewTopic.findUnique({
      where: { topicId },
      include: { _count: { select: { sessions: true } } },
    });
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề phỏng vấn');

    if (topic._count.sessions > 0) {
      throw new BadRequestException(
        'Không thể xóa chủ đề đã có phiên phỏng vấn',
      );
    }

    return this.prisma.interviewTopic.delete({
      where: { topicId },
    });
  }

  async getSessionById(sessionId: string, userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

    const session = await this.prisma.interviewSession.findUnique({
      where: { sessionId },
      include: {
        topic: {
          select: {
            topicId: true,
            name: true,
            categoryId: true,
            category: { select: interviewTopicCategorySelect },
          },
        },
        qnas: { orderBy: { orderIndex: 'asc' } },
        result: true,
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên phỏng vấn');
    if (session.candidateId !== candidate.candidateId) {
      throw new NotFoundException('Không tìm thấy phiên phỏng vấn');
    }
    return session;
  }

  async getSessionResult(sessionId: string, userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

    const result = await this.prisma.interviewResult.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            topic: {
              include: {
                category: { select: interviewTopicCategorySelect },
              },
            },
            qnas: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
    if (!result)
      throw new NotFoundException('Không tìm thấy kết quả phỏng vấn');
    if (result.session.candidateId !== candidate.candidateId) {
      throw new NotFoundException('Không tìm thấy kết quả phỏng vấn');
    }
    return result;
  }
  async getMySessions(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

    const sessions = await this.prisma.interviewSession.findMany({
      where: { candidateId: candidate.candidateId },
      select: {
        sessionId: true,
        status: true,
        difficultyLevel: true,
        startedAt: true,
        topic: {
          select: {
            name: true,
            categoryId: true,
            category: { select: interviewTopicCategorySelect },
          },
        },
        result: {
          select: { overallScore: true },
        },
        qnas: { select: { orderIndex: true }, orderBy: { orderIndex: 'asc' } },
      },
    });

    return sessions;
  }
}
