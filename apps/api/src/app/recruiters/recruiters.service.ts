import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateRecruiterDto,
  UpdateMyRecruiterDto,
  UpdateRecruiterDto,
} from './dtos/recruiters.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { recruiterIncludeOptions } from '../../common/utils/include-options.util';
import {
  organizationScope,
  resolveWriteOrganization,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';

const RECRUITER_NOT_FOUND = 'Không tìm thấy nhà tuyển dụng';

@Injectable()
export class RecruitersService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
  }

  /**
   * The organization a recruiter placed in `departmentId` belongs to: always that
   * department's own, never one the request names. A platform admin may place a
   * recruiter in any department; an org_admin only in its own organization's.
   */
  private async resolveDepartmentOrganization(
    caller: TenantCaller,
    departmentId: string,
  ): Promise<string> {
    const department = await this.prisma.department.findUnique({
      where: { departmentId },
      select: { organizationId: true },
    });

    if (!department) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }

    return resolveWriteOrganization(caller, department.organizationId);
  }

  /** A recruiter the caller may see — anyone else's is reported as not found. */
  private async findVisibleOrThrow(id: string, caller: TenantCaller) {
    const recruiter = await this.prisma.recruiter.findFirst({
      where: { recruiterId: id, ...organizationScope(caller) },
      include: { _count: { select: { jobPostings: true } } },
    });

    if (!recruiter) {
      throw new NotFoundException(RECRUITER_NOT_FOUND);
    }

    return recruiter;
  }

  async create(createRecruiterDto: CreateRecruiterDto, caller: TenantCaller) {
    await this.ensureUserExists(createRecruiterDto.userId);
    const organizationId = await this.resolveDepartmentOrganization(
      caller,
      createRecruiterDto.departmentId,
    );

    const existingRecruiter = await this.prisma.recruiter.findUnique({
      where: {
        userId: createRecruiterDto.userId,
      },
    });

    if (existingRecruiter) {
      throw new NotFoundException(
        'Hồ sơ nhà tuyển dụng đã tồn tại cho người dùng này',
      );
    }

    return await this.prisma.recruiter.create({
      data: {
        userId: createRecruiterDto.userId,
        // A recruiter belongs to the organization that owns its department.
        organizationId,
        departmentId: createRecruiterDto.departmentId,
        position: createRecruiterDto.position,
      },
      include: { ...recruiterIncludeOptions },
      omit: {
        userId: true,
        departmentId: true,
      },
    });
  }

  async getMe(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { ...recruiterIncludeOptions },
      omit: { userId: true, departmentId: true },
    });

    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    return recruiter;
  }

  async updateMe(userId: string, updateDto: UpdateMyRecruiterDto) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    return await this.prisma.recruiter.update({
      where: { recruiterId: recruiter.recruiterId },
      data: { position: updateDto.position },
      include: { ...recruiterIncludeOptions },
      omit: { userId: true, departmentId: true },
    });
  }

  /**
   * The recruiters directory. It used to list every recruiter of every department
   * to any recruiter — once organizations exist that is a cross-organization leak.
   */
  async findAll(caller: TenantCaller) {
    return await this.prisma.recruiter.findMany({
      where: organizationScope(caller),
      include: { ...recruiterIncludeOptions },
      omit: {
        userId: true,
        departmentId: true,
      },
    });
  }

  async findOne(id: string, caller: TenantCaller) {
    const recruiter = await this.prisma.recruiter.findFirst({
      where: { recruiterId: id, ...organizationScope(caller) },
      omit: {
        userId: true,
        departmentId: true,
      },
      include: { ...recruiterIncludeOptions },
    });

    if (!recruiter) {
      throw new NotFoundException(RECRUITER_NOT_FOUND);
    }

    return recruiter;
  }

  async update(
    id: string,
    updateRecruiterDto: UpdateRecruiterDto,
    caller: TenantCaller,
  ) {
    await this.findVisibleOrThrow(id, caller);

    // `create()` validates these FKs; `update()` used to pass the DTO straight
    // through, so a bad departmentId/userId surfaced as a raw Prisma FK error.
    if (updateRecruiterDto.userId) {
      await this.ensureUserExists(updateRecruiterDto.userId);
    }

    // Moving a recruiter to another department moves its organization with it.
    // The DTO used to be written verbatim, which left the denormalised
    // organizationId pointing at the old organization after a move.
    const organizationId = updateRecruiterDto.departmentId
      ? await this.resolveDepartmentOrganization(
          caller,
          updateRecruiterDto.departmentId,
        )
      : undefined;

    return await this.prisma.recruiter.update({
      where: {
        recruiterId: id,
      },
      include: { ...recruiterIncludeOptions },
      data: {
        userId: updateRecruiterDto.userId,
        departmentId: updateRecruiterDto.departmentId,
        position: updateRecruiterDto.position,
        organizationId,
      },
      omit: {
        userId: true,
        departmentId: true,
      },
    });
  }

  async remove(id: string, caller: TenantCaller) {
    const recruiter = await this.findVisibleOrThrow(id, caller);

    // `JobPosting.recruiter` is Restrict — deleting an owner with live postings
    // threw a raw P2003 (unhandled 500) instead of an actionable message.
    if (recruiter._count.jobPostings > 0) {
      throw new BadRequestException(
        'Không thể xóa nhà tuyển dụng đã tạo tin tuyển dụng',
      );
    }

    return await this.prisma.recruiter.delete({
      where: {
        recruiterId: id,
      },
      omit: {
        userId: true,
        departmentId: true,
      },
      include: { ...recruiterIncludeOptions },
    });
  }
}
