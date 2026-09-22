import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dtos/ai-config.dto';
import {
	isPlatformAdmin,
	organizationScope,
	resolveWriteOrganization,
	TenantCaller,
} from '../../common/tenancy/tenant-caller';

/**
 * AI screening configs are per organization (module spec criterion 5): each one keeps
 * its own weights and its own single default, and nothing here reads or writes
 * another organization's rows.
 */
@Injectable()
export class AiConfigService {
	private static readonly WEIGHT_SUM_EPSILON = 1e-9;

	constructor(private readonly prisma: PrismaService) { }

	async create(createAiConfigDto: CreateAiConfigDto, caller: TenantCaller) {
		this.validateWeightsSum(
			createAiConfigDto.skillsWeight,
			createAiConfigDto.experienceWeight,
			createAiConfigDto.educationWeight,
		);

		// The caller's own organization — or, for a platform admin, which belongs to
		// none, the one it names.
		const organizationId = resolveWriteOrganization(
			caller,
			createAiConfigDto.organizationId,
		);
		if (isPlatformAdmin(caller.role)) {
			await this.ensureOrganizationExists(organizationId);
		}

		return await this.prisma.$transaction(async (tx) => {
			if (createAiConfigDto.isDefault) {
				await this.clearDefault(tx, organizationId);
			}

			return await tx.aiConfig.create({
				data: {
					organizationId,
					name: createAiConfigDto.name,
					description: createAiConfigDto.description,
					isDefault: createAiConfigDto.isDefault ?? false,
					skillsWeight: createAiConfigDto.skillsWeight,
					experienceWeight: createAiConfigDto.experienceWeight,
					educationWeight: createAiConfigDto.educationWeight,
					minimumScoreThreshold: createAiConfigDto.minimumScoreThreshold,
				},
			});
		});
	}

	async findAll(caller: TenantCaller) {
		return await this.prisma.aiConfig.findMany({
			where: organizationScope(caller),
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});
	}

	async findOne(configId: string, caller: TenantCaller) {
		return this.getConfigOrThrow(configId, caller);
	}

	async update(
		configId: string,
		updateAiConfigDto: UpdateAiConfigDto,
		caller: TenantCaller,
	) {
		const existingConfig = await this.getConfigOrThrow(configId, caller);

		this.validateWeightsSum(
			updateAiConfigDto.skillsWeight ?? this.toNumber(existingConfig.skillsWeight),
			updateAiConfigDto.experienceWeight ?? this.toNumber(existingConfig.experienceWeight),
			updateAiConfigDto.educationWeight ?? this.toNumber(existingConfig.educationWeight),
		);

		return await this.prisma.$transaction(async (tx) => {
			if (updateAiConfigDto.isDefault === true) {
				await this.clearDefault(tx, existingConfig.organizationId, configId);
			}

			return await tx.aiConfig.update({
				where: { configId },
				data: {
					name: updateAiConfigDto.name,
					description: updateAiConfigDto.description,
					isDefault: updateAiConfigDto.isDefault,
					skillsWeight: updateAiConfigDto.skillsWeight,
					experienceWeight: updateAiConfigDto.experienceWeight,
					educationWeight: updateAiConfigDto.educationWeight,
					minimumScoreThreshold: updateAiConfigDto.minimumScoreThreshold,
				},
			});
		});
	}

	async remove(configId: string, caller: TenantCaller) {
		const config = await this.getConfigOrThrow(configId, caller);

		if (config.isDefault) {
			throw new BadRequestException('Không thể xóa cấu hình AI mặc định');
		}

		const screeningsCount = await this.prisma.cVScreening.count({
			where: { configId },
		});

		if (screeningsCount > 0) {
			throw new BadRequestException('Không thể xóa cấu hình AI đang được dùng cho sàng lọc CV');
		}

		return await this.prisma.aiConfig.delete({ where: { configId } });
	}

	async setDefault(configId: string, caller: TenantCaller) {
		const config = await this.getConfigOrThrow(configId, caller);

		return await this.prisma.$transaction(async (tx) => {
			await this.clearDefault(tx, config.organizationId, configId);

			return tx.aiConfig.update({
				where: { configId },
				data: { isDefault: true },
			});
		});
	}

	/**
	 * Unset the current default — of ONE organization. This used to run over the
	 * whole table, so an organization choosing its default silently took away every
	 * other organization's.
	 */
	private async clearDefault(
		tx: Prisma.TransactionClient,
		organizationId: string,
		exceptConfigId?: string,
	) {
		await tx.aiConfig.updateMany({
			where: {
				organizationId,
				isDefault: true,
				...(exceptConfigId ? { configId: { not: exceptConfigId } } : {}),
			},
			data: { isDefault: false },
		});
	}

	private async ensureOrganizationExists(organizationId: string) {
		const organization = await this.prisma.organization.findUnique({
			where: { organizationId },
			select: { organizationId: true },
		});
		if (!organization) {
			throw new NotFoundException(`Không tìm thấy tổ chức với ID ${organizationId}`);
		}
	}

	private validateWeightsSum(skillsWeight: number, experienceWeight: number, educationWeight: number) {
		const sum = skillsWeight + experienceWeight + educationWeight;
		if (Math.abs(sum - 1) > AiConfigService.WEIGHT_SUM_EPSILON) {
			throw new BadRequestException(
				'Tổng skillsWeight + experienceWeight + educationWeight phải bằng đúng 1.0',
			);
		}
	}

	/** Another organization's config is reported exactly like a missing one. */
	private async getConfigOrThrow(configId: string, caller: TenantCaller) {
		const config = await this.prisma.aiConfig.findFirst({
			where: { configId, ...organizationScope(caller) },
		});
		if (!config) {
			throw new NotFoundException(`Không tìm thấy cấu hình AI với ID ${configId}`);
		}
		return config;
	}

	private toNumber(decimalValue: Prisma.Decimal | number) {
		return Number(decimalValue);
	}
}
