import { ApplicationStatus, Prisma, UserRole } from '@ats-platform/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  FindCandidatesQueryDto,
  UpdateCandidateProfileDto,
} from './dtos/candidates.dto';
import { candidateIncludeOptions } from '../../common/utils/include-options.util';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: { ...candidateIncludeOptions },
      omit: {
        userId: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    return {
      candidateId: candidate.candidateId,
      user: candidate.user,
      currentTitle: candidate.currentTitle,
      yearsOfExperience: candidate.yearsOfExperience,
      profileData: candidate.profileData,
      cvCount: candidate._count.cvs,
      applicationCount: candidate._count.applications,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateCandidateProfileDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: {
        profileData: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    const currentProfileData = this.asObject(candidate.profileData);
    const incomingProfileData = updateDto.profileData ?? {};
    const userInfo = updateDto.userInfo ?? {};
    const hasUserInfo = Object.values(userInfo).some(
      (value) => value !== undefined,
    );

    await this.prisma.candidate.update({
      where: { userId },
      data: {
        currentTitle: updateDto.currentTitle,
        yearsOfExperience: updateDto.yearsOfExperience,
        profileData: {
          ...currentProfileData,
          ...incomingProfileData,
        } as Prisma.InputJsonObject,
        ...(hasUserInfo
          ? {
              user: {
                update: {
                  fullName: userInfo.fullName,
                  phoneNumber: userInfo.phoneNumber,
                },
              },
            }
          : {}),
      },
    });

    return this.getProfile(userId);
  }

  async updateProfileData(
    candidateId: string,
    profileData: Record<string, unknown>,
  ) {
    await this.prisma.candidate.update({
      where: { candidateId },
      data: {
        profileData: profileData as Prisma.InputJsonObject,
      },
    });
  }

  private async getRecruiterDepartmentId(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      select: { departmentId: true },
    });

    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
    }

    return recruiter.departmentId;
  }

  private getRecruiterCandidateScope(
    departmentId: string,
  ): Prisma.CandidateWhereInput {
    return {
      applications: {
        some: {
          status: { not: ApplicationStatus.cancelled },
          jobPosting: { departmentId },
        },
      },
    };
  }

  private async assertCanViewCandidate(
    candidateId: string,
    userId: string,
    role: UserRole,
  ) {
    if (role === UserRole.admin) return;
    if (role !== UserRole.recruiter) {
      throw new ForbiddenException('Bạn không có quyền truy cập ứng viên này');
    }

    const departmentId = await this.getRecruiterDepartmentId(userId);
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        candidateId,
        ...this.getRecruiterCandidateScope(departmentId),
      },
      select: { candidateId: true },
    });

    if (!candidate) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập ứng viên ngoài phạm vi khoa',
      );
    }
  }

  async findOne(candidateId: string, userId: string, role: UserRole) {
    await this.assertCanViewCandidate(candidateId, userId, role);

    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            status: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            cvs: true,
            applications: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy ứng viên');
    }

    return {
      candidateId: candidate.candidateId,
      user: candidate.user,
      currentTitle: candidate.currentTitle,
      yearsOfExperience: candidate.yearsOfExperience,
      profileData: candidate.profileData,
      cvCount: candidate._count.cvs,
      applicationCount: candidate._count.applications,
    };
  }

  async findAll(query: FindCandidatesQueryDto, userId: string, role: UserRole) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const baseWhere: Prisma.CandidateWhereInput = {
      ...(query.search
        ? {
            OR: [
              { currentTitle: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  fullName: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                user: {
                  email: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                user: {
                  phoneNumber: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(query.status
        ? {
            user: {
              status: query.status,
            },
          }
        : {}),
    };
    let where = baseWhere;

    if (role === UserRole.recruiter) {
      const departmentId = await this.getRecruiterDepartmentId(userId);
      where = {
        AND: [baseWhere, this.getRecruiterCandidateScope(departmentId)],
      };
    } else if (role !== UserRole.admin) {
      throw new ForbiddenException('Bạn không có quyền tìm kiếm ứng viên');
    }

    const [candidates, total] = await this.prisma.$transaction([
      this.prisma.candidate.findMany({
        where,
        include: {
          user: {
            select: {
              userId: true,
              email: true,
              fullName: true,
              phoneNumber: true,
              status: true,
              emailVerified: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              cvs: true,
              applications: true,
            },
          },
        },
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      items: candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        user: candidate.user,
        currentTitle: candidate.currentTitle,
        yearsOfExperience: candidate.yearsOfExperience,
        profileData: candidate.profileData,
        cvCount: candidate._count.cvs,
        applicationCount: candidate._count.applications,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private asObject(value: Prisma.JsonValue | null): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
