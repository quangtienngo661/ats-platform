import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateJobPostingDto, UpdateJobPostingDto, FindJobPostingsQueryDto } from './dto/job-posting.dto';
import { jobPostingIncludeOptions } from '../../common/utils/include-options.util';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { randomUUID } from 'crypto';

@Injectable()
export class JobPostingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobPostingSkillsService: JobPostingSkillsService,
    private readonly geminiService: GeminiService
  ) { }

  async parseJdPreview(description: string) {
    const normalizedDescription = description?.trim();

    if (!normalizedDescription) {
      throw new BadRequestException(
        'Vui lòng nhập mô tả công việc để AI phân tích',
      );
    }

    const result = await this.geminiService.parseJD(
      `jd-preview-${randomUUID()}`,
      normalizedDescription,
    );

    return result;
  }

  async create(userId: string, createJobPostingDto: CreateJobPostingDto) {
    if (createJobPostingDto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { categoryId: createJobPostingDto.categoryId },
        select: { categoryId: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Không tìm thấy danh mục công việc với ID ${createJobPostingDto.categoryId}`,
        );
      }
    }

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: userId },
      select: { recruiterId: true, departmentId: true },
    });

    if (!recruiter) {
      throw new NotFoundException(
        `Không tìm thấy nhà tuyển dụng`,
      );
    }

    if (!recruiter.departmentId) {
      throw new BadRequestException(
        'Tài khoản nhà tuyển dụng chưa được gán phòng ban',
      );
    }

    const department = await this.prisma.department.findUnique({
      where: { departmentId: recruiter.departmentId },
      select: { departmentId: true },
    });

    if (!department) {
      throw new NotFoundException(
        `Không tìm thấy phòng ban với ID ${recruiter.departmentId}`,
      );
    }

    if (
      createJobPostingDto.salaryMin !== undefined &&
      createJobPostingDto.salaryMax !== undefined &&
      createJobPostingDto.salaryMin > createJobPostingDto.salaryMax
    ) {
      throw new BadRequestException(
        'Mức lương tối thiểu không thể lớn hơn mức lương tối đa',
      );
    }

    const parsedRequirements = this.parseParsedRequirements(
      createJobPostingDto.parsedRequirements,
    );


    return await this.prisma.$transaction(async (tx) => {
      const newJobPosting = await tx.jobPosting.create({
        data: {
          title: createJobPostingDto.title,
          locationType: createJobPostingDto.locationType,
          salaryMin: createJobPostingDto.salaryMin,
          salaryMax: createJobPostingDto.salaryMax,
          description: createJobPostingDto.description,
          parsedRequirements,
          status: createJobPostingDto.status,
          publishedAt: createJobPostingDto.status === JobStatus.active
            ? new Date()
            : undefined,
          department: {
            connect: { departmentId: recruiter.departmentId },
          },
          category: createJobPostingDto.categoryId
            ? {
              connect: { categoryId: createJobPostingDto.categoryId },
            }
            : undefined,
          recruiter: {
            connect: { recruiterId: recruiter.recruiterId },
          },
        },
      });

      if (createJobPostingDto.skills && createJobPostingDto.skills.length > 0) {
        await this.jobPostingSkillsService.create(newJobPosting.jobId, createJobPostingDto.skills, tx);
      }

      return await tx.jobPosting.findUnique({
        where: { jobId: newJobPosting.jobId },
        include: jobPostingIncludeOptions,
        omit: {
          createdBy: true, departmentId: true, categoryId: true
        }
      });
    })
  }

  async findAll(query: FindJobPostingsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.JobPostingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' as Prisma.QueryMode } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where,
        include: jobPostingIncludeOptions,
        omit: { createdBy: true, departmentId: true, categoryId: true },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: id },
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });

    if (!jobPosting) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID ${id}`);
    }

    return jobPosting;
  }

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    const existingJobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: id },
      select: {
        jobId: true,
        salaryMin: true,
        salaryMax: true,
      },
    });

    if (!existingJobPosting) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID ${id}`);
    }

    await this.ensureRelationsExist(updateJobPostingDto);
    this.validateSalaryRange(existingJobPosting, updateJobPostingDto);

    const parsedRequirements = updateJobPostingDto.parsedRequirements !== undefined
      ? this.parseParsedRequirements(updateJobPostingDto.parsedRequirements)
      : undefined;

    return await this.prisma.$transaction(async (tx) => {
      const updatedJobPosting = await tx.jobPosting.update({
        where: { jobId: id },
        data: {
          title: updateJobPostingDto.title,
          locationType: updateJobPostingDto.locationType,
          salaryMin: updateJobPostingDto.salaryMin,
          salaryMax: updateJobPostingDto.salaryMax,
          description: updateJobPostingDto.description,
          parsedRequirements,
          status: updateJobPostingDto.status,
          publishedAt: updateJobPostingDto.status === JobStatus.active
            ? new Date()
            : undefined,
          category: updateJobPostingDto.categoryId
            ? {
              connect: { categoryId: updateJobPostingDto.categoryId },
            }
            : undefined,
          recruiter: updateJobPostingDto.createdBy
            ? {
              connect: { recruiterId: updateJobPostingDto.createdBy },
            }
            : undefined,
        }
      });

      if (updateJobPostingDto.skills !== undefined) {
        await this.jobPostingSkillsService.deleteByJobId(id, tx);
        if (updateJobPostingDto.skills.length > 0) {
          await this.jobPostingSkillsService.create(id, updateJobPostingDto.skills, tx);
        }
      }
      return await tx.jobPosting.findUnique({
        where: { jobId: updatedJobPosting.jobId },
        include: jobPostingIncludeOptions,
        omit: {
          createdBy: true, departmentId: true, categoryId: true
        }
      });
    })
  }

  async remove(id: string) {
    const existingJobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: id },
      select: { jobId: true },
    });

    if (!existingJobPosting) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID ${id}`);
    }

    return await this.prisma.jobPosting.delete({
      where: { jobId: id },
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });
  }

  private async ensureRelationsExist(updateJobPostingDto: UpdateJobPostingDto) {
    if (updateJobPostingDto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { categoryId: updateJobPostingDto.categoryId },
        select: { categoryId: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Không tìm thấy danh mục công việc với ID ${updateJobPostingDto.categoryId}`,
        );
      }
    }

    if (updateJobPostingDto.createdBy) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { recruiterId: updateJobPostingDto.createdBy },
        select: { recruiterId: true },
      });

      if (!recruiter) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID ${updateJobPostingDto.createdBy}`,
        );
      }
    }
  }

  private validateSalaryRange(
    existingJobPosting: {
      salaryMin: Prisma.Decimal | null;
      salaryMax: Prisma.Decimal | null;
    },
    updateJobPostingDto: UpdateJobPostingDto,
  ) {
    const salaryMin =
      updateJobPostingDto.salaryMin ??
      (existingJobPosting.salaryMin !== null
        ? Number(existingJobPosting.salaryMin)
        : undefined);

    const salaryMax =
      updateJobPostingDto.salaryMax ??
      (existingJobPosting.salaryMax !== null
        ? Number(existingJobPosting.salaryMax)
        : undefined);

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      throw new BadRequestException(
        'Mức lương tối thiểu không thể lớn hơn mức lương tối đa',
      );
    }
  }

  private parseParsedRequirements(value: unknown): Prisma.InputJsonValue {
    if (value === undefined || value === null || value === '') {
      return {};
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return this.ensureJsonObject(parsed);
      } catch {
        throw new BadRequestException(
          'Dữ liệu phân tích JD không đúng định dạng JSON',
        );
      }
    }

    return this.ensureJsonObject(value);
  }

  private ensureJsonObject(value: unknown): Prisma.InputJsonValue {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(
        'Dữ liệu phân tích JD phải là một JSON object',
      );
    }

    return value as Prisma.InputJsonValue;
  }
}
