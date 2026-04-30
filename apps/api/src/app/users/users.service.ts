import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@ats-platform/database';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@ats-platform/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateUserDto) {
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Dùng Transaction để đảm bảo cả 2 hoặc không có gì được tạo
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          status: data.status ?? UserStatus.active,
          role: data.role,
        },
        omit: { passwordHash: true },
      });
      // Tự động tạo profile tương ứng theo role
      // if (data.role === UserRole.recruiter) {
      //   await tx.recruiter.create({
      //     data: { user: { connect: { userId: user.userId } } },
      //   });
      // } else if (data.role === UserRole.candidate) {
      //   await tx.candidate.create({
      //     data: { user: { connect: { userId: user.userId } } },
      //   });
      // }
      return user;
    });


    return newUser;
  }

  async findAll() {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      omit: { passwordHash: true },
      include: {
        recruiter: true
      }
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      omit: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = bcrypt.compareSync(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
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
      throw new BadRequestException('No data provided for update');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== currentUser.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
        select: { userId: true },
      });

      if (existingUser && existingUser.userId !== userId) {
        throw new BadRequestException('Email already exists');
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
        throw new NotFoundException('User not found');
      }
      if (error?.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async remove(userId: string) {
    try {
      return await this.prisma.user.delete({
        where: { userId },
        omit: { passwordHash: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
