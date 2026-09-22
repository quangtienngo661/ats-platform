import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { defaultAiConfigData } from '../../common/constants/default-ai-config';
import {
  requireCallerOrganization,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { CreateOrganizationDto } from './dto/organization.dto';

const organizationSummary = {
  organizationId: true,
  name: true,
  slug: true,
  createdAt: true,
  _count: { select: { departments: true, recruiters: true, admins: true } },
} as const;

/**
 * Organizations are administered by the PLATFORM admin only; an org_admin or a
 * recruiter may read its own. Create/list only — no update or delete yet: a tenant
 * being removed takes its whole hiring history with it, which is a decision this
 * build deliberately does not expose.
 */
@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A new organization comes with its own default screening config, in the same
   * transaction: screening falls back to it, so an organization without one could
   * not screen a single CV.
   */
  async create(dto: CreateOrganizationDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: dto.name.trim(), slug: dto.slug },
        });

        await tx.aiConfig.create({
          data: {
            ...defaultAiConfigData(),
            organizationId: organization.organizationId,
          },
        });

        return tx.organization.findUniqueOrThrow({
          where: { organizationId: organization.organizationId },
          select: organizationSummary,
        });
      });
    } catch (error: unknown) {
      // P2002: unique constraint — the only unique column here is `slug`.
      if ((error as { code?: string } | null)?.code === 'P2002') {
        throw new ConflictException(`Slug '${dto.slug}' đã được sử dụng`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
      select: organizationSummary,
    });
  }

  async findOne(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { organizationId },
      select: organizationSummary,
    });

    if (!organization) {
      throw new NotFoundException('Không tìm thấy tổ chức');
    }

    return organization;
  }

  /** The caller's own organization (org_admin or recruiter). */
  async findMine(caller: TenantCaller) {
    return this.findOne(requireCallerOrganization(caller));
  }
}
