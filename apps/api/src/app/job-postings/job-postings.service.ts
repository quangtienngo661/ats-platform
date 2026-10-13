import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole, UserStatus } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
  FindJobPostingsQueryDto,
} from './dto/job-posting.dto';
import { jobPostingIncludeOptions } from '../../common/utils/include-options.util';
import { JobPostingSkillsService } from './job-posting-skills/job-posting-skills.service';
import {
  isOrganizationStaff,
  isPlatformAdmin,
  organizationScope,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { randomUUID } from 'crypto';

/** Staff browse their organization's postings in every status; nobody else does. */
const isStaffViewer = (viewer?: TenantCaller): viewer is TenantCaller =>
  !!viewer &&
  (isPlatformAdmin(viewer.role) || isOrganizationStaff(viewer.role));

/**
 * A posting is drafted, published, then closed. Closing is final: re-opening a
 * posting that already collected applications would silently reuse its pipeline,
 * and un-publishing a live posting (`active` → `draft`) hides a job candidates may
 * already have applied to. Both were previously accepted without complaint.
 */
const JOB_STATUS_TRANSITIONS: Partial<Record<JobStatus, JobStatus[]>> = {
  [JobStatus.draft]: [JobStatus.active, JobStatus.closed],
  [JobStatus.active]: [JobStatus.closed],
  [JobStatus.closed]: [],
};

@Injectable()
export class JobPostingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobPostingSkillsService: JobPostingSkillsService,
    private readonly geminiService: GeminiService,
  ) {}

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

  async create(caller: TenantCaller, createJobPostingDto: CreateJobPostingDto) {
    if (!isStaffViewer(caller)) throw new ForbiddenException();
    const manager = caller.role === UserRole.admin || caller.role === UserRole.org_admin;
    if (manager && !createJobPostingDto.createdBy) throw new BadRequestException('Vui lòng chọn recruiter phụ trách');
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
      where: manager ? { recruiterId: createJobPostingDto.createdBy } : { userId: caller.userId },
      select: { recruiterId: true, departmentId: true, organizationId: true, user: { select: { role: true, status: true } } },
    });

    if (!recruiter) {
      throw new NotFoundException(`Không tìm thấy nhà tuyển dụng`);
    }

    if (caller.role !== UserRole.admin && recruiter.organizationId !== caller.organizationId) throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
    if (recruiter.user.role !== UserRole.recruiter || recruiter.user.status !== UserStatus.active) throw new BadRequestException('Người phụ trách phải là recruiter đang hoạt động');
    if (!manager && createJobPostingDto.createdBy && createJobPostingDto.createdBy !== recruiter.recruiterId) throw new ForbiddenException('Không thể tạo tin cho recruiter khác');
    if (createJobPostingDto.departmentId && createJobPostingDto.departmentId !== recruiter.departmentId) throw new BadRequestException('Phòng ban phải khớp với recruiter phụ trách');

    if (!recruiter.departmentId) {
      throw new BadRequestException(
        'Tài khoản nhà tuyển dụng chưa được gán phòng ban',
      );
    }

    const department = await this.prisma.department.findUnique({
      where: { departmentId: recruiter.departmentId },
      select: { departmentId: true, organizationId: true },
    });

    if (!department) {
      throw new NotFoundException(
        `Không tìm thấy phòng ban với ID ${recruiter.departmentId}`,
      );
    }
    if (department.organizationId !== recruiter.organizationId) throw new BadRequestException('Tổ chức của recruiter và phòng ban không khớp');

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
          // The posting belongs to the organization that owns the recruiter's department.
          organization: {
            connect: { organizationId: department.organizationId },
          },
          title: createJobPostingDto.title,
          locationType: createJobPostingDto.locationType,
          salaryMin: createJobPostingDto.salaryMin,
          salaryMax: createJobPostingDto.salaryMax,
          description: createJobPostingDto.description,
          parsedRequirements,
          status: createJobPostingDto.status,
          publishedAt:
            createJobPostingDto.status === JobStatus.active
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
        await this.jobPostingSkillsService.create(
          newJobPosting.jobId,
          newJobPosting.organizationId,
          createJobPostingDto.skills,
          tx,
        );
      }

      return await tx.jobPosting.findUnique({
        where: { jobId: newJobPosting.jobId },
        include: jobPostingIncludeOptions,
        omit: {
          createdBy: true,
          departmentId: true,
          categoryId: true,
        },
      });
    });
  }

  async findAll(query: FindJobPostingsQueryDto = {}, viewer?: TenantCaller) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.JobPostingWhereInput = {
      // Staff see every status, but only inside their own organization (a platform
      // admin: every organization). Everyone else — anonymous visitors AND
      // logged-in candidates — browses the shared job board: published postings
      // from EVERY organization, and a client-supplied `status` filter must not be
      // able to surface drafts or closed postings.
      ...(isStaffViewer(viewer)
        ? {
            ...organizationScope(viewer),
            ...(query.status ? { status: query.status } : {}),
          }
        : { status: JobStatus.active }),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            title: {
              contains: query.search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          }
        : {}),
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

  async findOne(id: string, viewer?: TenantCaller) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: id },
      include: jobPostingIncludeOptions,
      omit: {
        createdBy: true,
        departmentId: true,
        categoryId: true,
      },
    });

    if (!jobPosting) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID ${id}`);
    }

    // One 404 for "missing", "exists but unpublished" and "belongs to another
    // organization": no caller may tell those apart from a posting that does not
    // exist (criterion 2).
    const visible = isStaffViewer(viewer)
      ? isPlatformAdmin(viewer.role) ||
        (viewer.organizationId !== null &&
          jobPosting.organizationId === viewer.organizationId)
      : jobPosting.status === JobStatus.active;

    if (!visible) {
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
        status: true,
        publishedAt: true,
        departmentId: true,
        organizationId: true,
      },
    });

    if (!existingJobPosting) {
      throw new NotFoundException(`Không tìm thấy tin tuyển dụng với ID ${id}`);
    }

    await this.ensureRelationsExist(updateJobPostingDto);
    this.validateSalaryRange(existingJobPosting, updateJobPostingDto);
    this.validateStatusTransition(
      existingJobPosting.status,
      updateJobPostingDto.status,
    );
    const departmentId = await this.resolveOwnerDepartment(
      existingJobPosting,
      updateJobPostingDto.createdBy,
    );

    const parsedRequirements =
      updateJobPostingDto.parsedRequirements !== undefined
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
          // Stamp the publish date once, on the first transition to `active`.
          // Re-saving an already-published posting used to reset it to now(),
          // silently destroying the real publication date.
          publishedAt:
            updateJobPostingDto.status === JobStatus.active &&
            !existingJobPosting.publishedAt
              ? new Date()
              : undefined,
          department: departmentId ? { connect: { departmentId } } : undefined,
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
      });

      if (updateJobPostingDto.skills !== undefined) {
        await this.jobPostingSkillsService.deleteByJobId(id, tx);
        if (updateJobPostingDto.skills.length > 0) {
          await this.jobPostingSkillsService.create(
            id,
            updatedJobPosting.organizationId,
            updateJobPostingDto.skills,
            tx,
          );
        }
      }
      return await tx.jobPosting.findUnique({
        where: { jobId: updatedJobPosting.jobId },
        include: jobPostingIncludeOptions,
        omit: {
          createdBy: true,
          departmentId: true,
          categoryId: true,
        },
      });
    });
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
        createdBy: true,
        departmentId: true,
        categoryId: true,
      },
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

    // The recruiter is deliberately NOT checked here — `resolveOwnerDepartment()`
    // has to load it anyway to realign `departmentId`, and it throws the same
    // NotFoundException. Checking it twice would be two round-trips and two places
    // that must agree on what "recruiter not found" means.
  }

  /**
   * A posting's department must always match its owning recruiter's department.
   * Reassigning `createdBy` used to leave `departmentId` pointing at the old
   * department forever, so the posting was "owned" by someone outside the
   * department it claimed to belong to — and department-scoped access checks
   * (applications, candidates) then disagreed with reality.
   */
  private async resolveOwnerDepartment(
    posting: { departmentId: string; organizationId: string },
    nextRecruiterId?: string,
  ): Promise<string | undefined> {
    if (!nextRecruiterId) return undefined;

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId: nextRecruiterId },
      select: { departmentId: true, organizationId: true },
    });

    if (!recruiter) {
      throw new NotFoundException(
        `Không tìm thấy nhà tuyển dụng với ID ${nextRecruiterId}`,
      );
    }

    // Never across organizations — not even for a platform admin. The posting's
    // organizationId would stay behind while its department moved, and every
    // application under it would still belong to the old organization.
    if (recruiter.organizationId !== posting.organizationId) {
      throw new ForbiddenException(
        'Nhà tuyển dụng mới phải thuộc cùng tổ chức với tin tuyển dụng',
      );
    }

    return recruiter.departmentId === posting.departmentId
      ? undefined
      : recruiter.departmentId;
  }

  private validateStatusTransition(
    currentStatus: JobStatus,
    nextStatus?: JobStatus,
  ) {
    if (!nextStatus || nextStatus === currentStatus) return;

    const allowedNext = JOB_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái tin tuyển dụng từ '${currentStatus}' sang '${nextStatus}'. ` +
          `Các trạng thái hợp lệ: [${allowedNext.join(', ') || 'không có - đây là trạng thái cuối'}]`,
      );
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
