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

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const department = await this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
        description: createDepartmentDto.description,
        color: createDepartmentDto.color,
      },
    });
    return department;
  }

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: departmentIncludeOptions,
    });
    return departments;
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { departmentId: id },
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

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { departmentId: id },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${id}`);
    }

    const updatedDepartment = await this.prisma.department.update({
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

    return updatedDepartment;
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { departmentId: id },
      include: {
        _count: { select: { recruiters: true, jobPostings: true } },
      },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban với ID ${id}`);
    }

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

    const deletedDepartment = await this.prisma.department.delete({
      where: { departmentId: id },
    });

    return deletedDepartment;
  }
}
