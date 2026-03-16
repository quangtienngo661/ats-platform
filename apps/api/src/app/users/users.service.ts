import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserStatus } from '@ats-platform/types';
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

  async update(userId: string, updateUserDto: UpdateUserDto) {
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
