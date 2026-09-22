import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dtos/departments.dto';
import { departmentIncludeOptions } from '../../common/utils/include-options.util';
import {
  isPlatformAdmin,
  organizationScope,
  resolveWriteOrganization,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Module spec criterion 7. A department belongs to the organization of whoever
   * creates it — an org_admin's or a recruiter's own, which the request may not
   * override. A platform admin belongs to no organization, so it must name one.
   */
  async create(createDepartmentDto: CreateDepartmentDto, caller: TenantCaller) {
    const organizationId = resolveWriteOrganization(
      caller,
      createDepartmentDto.organizationId,
    );

    if (isPlatformAdmin(caller.role)) {
      const organization = await this.prisma.organization.findUnique({
        where: { organizationId },
        select: { organizationId: true },
      });
      if (!organization) {
        throw new NotFoundException(
          `Không tìm thấy tổ chức với ID ${organizationId}`,
        );
      }
    }

    return await this.prisma.department.create({
      data: {
        organizationId,
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
        color: createDepartmentDto.color,
      },
    });
  }

  /**
   * Department CRUD had no scoping of any kind. Harmless while Department was the
   * top of the hierarchy; once an organization sits above it, one organization
   * could list and edit another's departments.
   */
  async findAll(caller: TenantCaller) {
    return await this.prisma.department.findMany({
      where: organizationScope(caller),
      include: departmentIncludeOptions,
    });
  }

  /** Another organization's department is reported exactly like a missing one. */
  private async findVisibleOrThrow(id: string, caller: TenantCaller) {
    const department = await this.prisma.department.findFirst({
      where: { departmentId: id, ...organizationScope(caller) },
      include: {
        _count: { select: { recruiters: true, jobPostings: true } },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${id}`);
    }

    return department;
  }

  async findOne(id: string, caller: TenantCaller) {
    const department = await this.prisma.department.findFirst({
      where: { departmentId: id, ...organizationScope(caller) },
      include: {
        recruiters: true,
        jobPostings: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${id}`);
    }

    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
    caller: TenantCaller,
  ) {
    await this.findVisibleOrThrow(id, caller);

    // The owning organization is deliberately not updatable: moving a department
    // would drag its recruiters and postings across the tenant boundary while
    // their own organizationId stayed behind. UpdateDepartmentDto omits the field.
    return await this.prisma.department.update({
      where: { departmentId: id },
      data: {
        name: updateDepartmentDto.name,
        description: updateDepartmentDto.description,
        color: updateDepartmentDto.color,
      },
      include: {
        recruiters: true,
        jobPostings: true,
      },
    });
  }

  async remove(id: string, caller: TenantCaller) {
    const department = await this.findVisibleOrThrow(id, caller);

    // `Recruiter.department` and `JobPosting.department` have no `onDelete: Cascade`,
    // so Postgres restricts the delete. Without this check the raw P2003 escapes as
    // an unhandled 500 instead of a message the recruiter can act on.
    if (department._count.recruiters > 0) {
      throw new BadRequestException(
        'Không thể xóa phòng ban vẫn còn nhà tuyển dụng',
      );
    }

    if (department._count.jobPostings > 0) {
      throw new BadRequestException(
        'Không thể xóa phòng ban vẫn còn tin tuyển dụng',
      );
    }

    return await this.prisma.department.delete({
      where: { departmentId: id },
    });
  }
}
