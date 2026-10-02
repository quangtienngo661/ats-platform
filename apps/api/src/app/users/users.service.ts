import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@ats-platform/database';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateMeDto,
  UpdateUserDto,
} from './dtos/user.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@ats-platform/database';
import * as bcrypt from 'bcrypt';
import { SocketIoService } from '../../common/socket-io/socket-io.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private readonly sockets: SocketIoService) {}

  /**
   * An org_admin is bound to exactly one existing organization, and no other role
   * carries one. The database enforces the same pair with a CHECK constraint; this
   * turns a violation into a readable 400/404 instead of a raw constraint error.
   */
  private async resolveAdminOrganization(
    role: UserRole,
    organizationId?: string | null,
  ): Promise<string | null> {
    if (role !== UserRole.org_admin) {
      if (organizationId) {
        throw new BadRequestException(
          'Chỉ tài khoản quản trị tổ chức (org_admin) mới được gắn với một tổ chức',
        );
      }
      return null;
    }

    if (!organizationId) {
      throw new BadRequestException(
        'Tài khoản quản trị tổ chức phải được gắn với một tổ chức (organizationId)',
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { organizationId },
      select: { organizationId: true },
    });
    if (!organization) {
      throw new NotFoundException('Không tìm thấy tổ chức');
    }
    return organizationId;
  }

  async create(data: CreateUserDto) {
    const organizationId = await this.resolveAdminOrganization(
      data.role,
      data.organizationId,
    );
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
          phoneNumber: data.phoneNumber,
          status: data.status ?? UserStatus.active,
          role: data.role,
          organizationId,
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

  async updateMe(userId: string, updateMeDto: UpdateMeDto) {
    // Copy only the self-service fields. The body must never be forwarded to
    // update(): that is the administrator's path and it writes role and status.
    const data = {
      fullName: updateMeDto.fullName,
      phoneNumber: updateMeDto.phoneNumber,
    };

    if (data.fullName === undefined && data.phoneNumber === undefined) {
      throw new BadRequestException('Không có dữ liệu để cập nhật');
    }

    try {
      return await this.prisma.user.update({
        where: { userId },
        data,
        omit: { passwordHash: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      throw error;
    }
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
    const updated = await this.prisma.$transaction(async tx => {
      const result = await tx.user.update({
        where: { userId }, data: { passwordHash: newPasswordHash }, omit: { passwordHash: true },
      });
      await tx.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
      return result;
    });
    this.sockets.disconnectUser(userId);
    return updated;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const hasDataToUpdate =
      updateUserDto.email !== undefined ||
      updateUserDto.password !== undefined ||
      updateUserDto.fullName !== undefined ||
      updateUserDto.phoneNumber !== undefined ||
      updateUserDto.status !== undefined ||
      updateUserDto.role !== undefined ||
      updateUserDto.organizationId !== undefined;

    if (!hasDataToUpdate) {
      throw new BadRequestException('Không có dữ liệu để cập nhật');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        role: true,
        status: true,
        organizationId: true,
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

    // Role and organization change as a pair. Leaving org_admin drops the binding;
    // becoming one requires it; staying one keeps the current binding unless a new
    // one is given.
    let organizationId: string | null | undefined;
    if (
      updateUserDto.role !== undefined ||
      updateUserDto.organizationId !== undefined
    ) {
      const nextRole = updateUserDto.role ?? currentUser.role;
      const requested =
        updateUserDto.organizationId !== undefined
          ? updateUserDto.organizationId
          : nextRole === UserRole.org_admin
            ? currentUser.organizationId
            : null;
      organizationId = await this.resolveAdminOrganization(nextRole, requested);
    }

    const passwordHash = updateUserDto.password
      ? bcrypt.hashSync(updateUserDto.password, 10)
      : undefined;

    const accessChanged =
      (updateUserDto.role !== undefined && updateUserDto.role !== currentUser.role) ||
      (organizationId !== undefined && organizationId !== currentUser.organizationId) ||
      (updateUserDto.status !== undefined && updateUserDto.status !== currentUser.status) ||
      passwordHash !== undefined;

    try {
      const persist = (tx: Prisma.TransactionClient) => tx.user.update({
        where: { userId },
        data: {
          email: updateUserDto.email,
          passwordHash,
          fullName: updateUserDto.fullName,
          phoneNumber: updateUserDto.phoneNumber,
          status: updateUserDto.status,
          role: updateUserDto.role,
          organizationId,
        },
        omit: { passwordHash: true },
      });
      const updated = accessChanged
        ? await this.prisma.$transaction(async tx => {
            const user = await persist(tx);
            await tx.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
            return user;
          })
        : await persist(this.prisma);
      if (accessChanged) this.sockets.disconnectUser(userId);
      return updated;
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
      const deleted = await this.prisma.user.delete({
        where: { userId },
        omit: { passwordHash: true },
      });
      this.sockets.disconnectUser(userId);
      return deleted;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      throw error;
    }
  }
}
