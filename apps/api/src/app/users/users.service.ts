import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@ats-platform/types';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@ats-platform/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    userId: true,
    email: true,
    fullName: true,
    role: true,
    status: true,
    createdAt: true,
  } satisfies Prisma.UserSelect;

  async create(data: CreateUserDto) {
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        status: data.status ?? UserStatus.ACTIVE,
        role: data.role,
      },
      select: this.userSelect,
    });

    return newUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, updateMeDto: UpdateUserDto) {
    return this.update(userId, {
      email: updateMeDto.email,
      password: updateMeDto.password,
      fullName: updateMeDto.fullName,
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
        select: this.userSelect,
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
        select: this.userSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
