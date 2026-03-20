import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobPostingDto, UpdateJobPostingDto } from './dto/job-posting.dto';
import { jobPostingIncludeOptions } from '../../common/utils/include-options';

@Injectable()
export class JobPostingsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, createJobPostingDto: CreateJobPostingDto) {
    // Validate that department exists
    const department = await this.prisma.department.findUnique({
      where: { departmentId: createJobPostingDto.departmentId },
      select: { departmentId: true },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${createJobPostingDto.departmentId} not found`,
      );
    }

    // Validate that category exists if provided
    if (createJobPostingDto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { categoryId: createJobPostingDto.categoryId },
        select: { categoryId: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Job category with ID ${createJobPostingDto.categoryId} not found`,
        );
      }
    }

    // Validate that recruiter exists
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: userId },
      select: { recruiterId: true },
    });

    if (!recruiter) {
      throw new NotFoundException(
        `Recruiter not found`,
      );
    }

    // Validate salary range
    if (
      createJobPostingDto.salaryMin !== undefined &&
      createJobPostingDto.salaryMax !== undefined &&
      createJobPostingDto.salaryMin > createJobPostingDto.salaryMax
    ) {
      throw new BadRequestException(
        'salaryMin cannot be greater than salaryMax',
      );
    }

    // Create job posting
    // TODO: let Gemini API analyze the job description and requirements to extract structured data for better matching and search capabilities, then store the parsed requirements in the database for future use
    return this.prisma.jobPosting.create({
      data: {
        title: createJobPostingDto.title,
        locationType: createJobPostingDto.locationType,
        salaryMin: createJobPostingDto.salaryMin,
        salaryMax: createJobPostingDto.salaryMax,
        description: createJobPostingDto.description,
        parsedRequirements: "Parsed requirements will be implemented in the future",
        status: createJobPostingDto.status,
        publishedAt: createJobPostingDto.publishedAt // posting will be published when the status turns active
          ? new Date(createJobPostingDto.publishedAt)
          : undefined,
        department: {
          connect: { departmentId: createJobPostingDto.departmentId },
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
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });
  }

  async findAll() {
    return this.prisma.jobPosting.findMany({
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });
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
      throw new NotFoundException(`Job posting with ID ${id} not found`);
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
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    await this.ensureRelationsExist(updateJobPostingDto);
    this.validateSalaryRange(existingJobPosting, updateJobPostingDto);

    return this.prisma.jobPosting.update({
      where: { jobId: id },
      data: {
        title: updateJobPostingDto.title,
        locationType: updateJobPostingDto.locationType,
        salaryMin: updateJobPostingDto.salaryMin,
        salaryMax: updateJobPostingDto.salaryMax,
        description: updateJobPostingDto.description,
        parsedRequirements: "Parsed requirements will be implemented in the future",
        status: updateJobPostingDto.status,
        publishedAt: updateJobPostingDto.publishedAt
          ? new Date(updateJobPostingDto.publishedAt)
          : undefined,
        department: updateJobPostingDto.departmentId
          ? {
            connect: { departmentId: updateJobPostingDto.departmentId },
          }
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
      },
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });
  }

  async remove(id: string) {
    const existingJobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: id },
      select: { jobId: true },
    });

    if (!existingJobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    return this.prisma.jobPosting.delete({
      where: { jobId: id },
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true, departmentId: true, categoryId: true
      }
    });
  }

  private async ensureRelationsExist(updateJobPostingDto: UpdateJobPostingDto) {
    if (updateJobPostingDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { departmentId: updateJobPostingDto.departmentId },
        select: { departmentId: true },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${updateJobPostingDto.departmentId} not found`,
        );
      }
    }

    if (updateJobPostingDto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { categoryId: updateJobPostingDto.categoryId },
        select: { categoryId: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Job category with ID ${updateJobPostingDto.categoryId} not found`,
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
          `Recruiter with ID ${updateJobPostingDto.createdBy} not found`,
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
        'salaryMin cannot be greater than salaryMax',
      );
    }
  }
}
