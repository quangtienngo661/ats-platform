import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@ats-platform/database';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from './dtos/user.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@ats-platform/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          status: data.status ?? UserStatus.active,
          role: data.role,
          emailVerified: true,
        },
        omit: { passwordHash: true },
      });
      return user;
    });

    return newUser;
  }

  async findAll() {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      omit: { passwordHash: true },
      include: {
        recruiter: true,
      },
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      omit: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async updateMe(userId: string, updateMeDto: UpdateUserDto) {
    return this.update(userId, {
      ...updateMeDto,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isCurrentPasswordValid = bcrypt.compareSync(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const newPasswordHash = bcrypt.hashSync(dto.newPassword, 10);
    return await this.prisma.user.update({
      where: { userId },
      data: { passwordHash: newPasswordHash },
      omit: { passwordHash: true },
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const hasDataToUpdate =
      updateUserDto.email !== undefined ||
      updateUserDto.password !== undefined ||
      updateUserDto.fullName !== undefined ||
      updateUserDto.status !== undefined ||
      updateUserDto.role !== undefined;

    if (!hasDataToUpdate) {
      throw new BadRequestException('Không có dữ liệu để cập nhật');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (updateUserDto.email && updateUserDto.email !== currentUser.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
        select: { userId: true },
      });

      if (existingUser && existingUser.userId !== userId) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }

    const passwordHash = updateUserDto.password
      ? bcrypt.hashSync(updateUserDto.password, 10)
      : undefined;

    try {
      return await this.prisma.user.update({
        where: { userId },
        data: {
          email: updateUserDto.email,
          passwordHash,
          fullName: updateUserDto.fullName,
          status: updateUserDto.status,
          role: updateUserDto.role,
        },
        omit: { passwordHash: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email đã tồn tại');
      }
      throw error;
    }
  }

  async remove(userId: string) {
    // Only RefreshToken, Notification, Candidate and Recruiter cascade from User.
    // EVERY other relation pointing at User (or at the cascaded Candidate/Recruiter)
    // is Restrict, so the cascade dies mid-transaction with a raw P2003 — only P2025
    // was ever caught, so it surfaced as an unhandled 500. Check all of them:
    //   Application.candidate, InterviewSession.candidate   (via Candidate)
    //   JobPosting.recruiter                                (via Recruiter)
    //   ApplicationHistory.changedBy                        (directly on User)
    //   InterviewSchedule.scheduledBy / .interviewerId      (directly on User)
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        _count: {
          select: {
            applicationHistory: true,
            scheduledBy: true,
            interviewSchedules: true,
          },
        },
        candidate: {
          select: {
            _count: { select: { applications: true, interviewSessions: true } },
          },
        },
        recruiter: { select: { _count: { select: { jobPostings: true } } } },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.candidate?._count.applications) {
      throw new BadRequestException(
        'Không thể xóa ứng viên đã có đơn ứng tuyển',
      );
    }

    if (user.candidate?._count.interviewSessions) {
      throw new BadRequestException(
        'Không thể xóa ứng viên đã có phiên phỏng vấn',
      );
    }

    if (user.recruiter?._count.jobPostings) {
      throw new BadRequestException(
        'Không thể xóa nhà tuyển dụng đã tạo tin tuyển dụng',
      );
    }

    if (user._count.applicationHistory) {
      throw new BadRequestException(
        'Không thể xóa người dùng đã từng thay đổi trạng thái đơn ứng tuyển',
      );
    }

    if (user._count.scheduledBy || user._count.interviewSchedules) {
      throw new BadRequestException(
        'Không thể xóa người dùng đang gắn với lịch phỏng vấn',
      );
    }

    try {
      return await this.prisma.user.delete({
        where: { userId },
        omit: { passwordHash: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      throw error;
    }
  }
}
