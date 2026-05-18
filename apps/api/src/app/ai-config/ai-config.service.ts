import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dtos/ai-config.dto';

@Injectable()
export class AiConfigService {
	private static readonly WEIGHT_SUM_EPSILON = 1e-9;

	constructor(private readonly prisma: PrismaService) { }

	async create(createAiConfigDto: CreateAiConfigDto) {
		this.validateWeightsSum(
			createAiConfigDto.skillsWeight,
			createAiConfigDto.experienceWeight,
			createAiConfigDto.educationWeight,
		);

		return await this.prisma.$transaction(async (tx) => {
			if (createAiConfigDto.isDefault) {
				await tx.aiConfig.updateMany({
					where: { isDefault: true },
					data: { isDefault: false },
				});
			}

			return await tx.aiConfig.create({
				data: {
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

	async findAll() {
		return await this.prisma.aiConfig.findMany({
			orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
		});
	}

	async findOne(configId: string) {
		return this.getConfigOrThrow(configId);
	}

	async update(configId: string, updateAiConfigDto: UpdateAiConfigDto) {
		const existingConfig = await this.getConfigOrThrow(configId);

		this.validateWeightsSum(
			updateAiConfigDto.skillsWeight ?? this.toNumber(existingConfig.skillsWeight),
			updateAiConfigDto.experienceWeight ?? this.toNumber(existingConfig.experienceWeight),
			updateAiConfigDto.educationWeight ?? this.toNumber(existingConfig.educationWeight),
		);

		return await this.prisma.$transaction(async (tx) => {
			if (updateAiConfigDto.isDefault === true) {
				await tx.aiConfig.updateMany({
					where: { isDefault: true, configId: { not: configId } },
					data: { isDefault: false },
				});
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

	async remove(configId: string) {
		const config = await this.getConfigOrThrow(configId);

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

	async setDefault(configId: string) {
		await this.getConfigOrThrow(configId);

		return await this.prisma.$transaction(async (tx) => {
			await tx.aiConfig.updateMany({
				where: { isDefault: true, configId: { not: configId } },
				data: { isDefault: false },
			});

			return tx.aiConfig.update({
				where: { configId },
				data: { isDefault: true },
			});
		});
	}

	private validateWeightsSum(skillsWeight: number, experienceWeight: number, educationWeight: number) {
		const sum = skillsWeight + experienceWeight + educationWeight;
		if (Math.abs(sum - 1) > AiConfigService.WEIGHT_SUM_EPSILON) {
			throw new BadRequestException(
				'Tổng skillsWeight + experienceWeight + educationWeight phải bằng đúng 1.0',
			);
		}
	}

	private async getConfigOrThrow(configId: string) {
		const config = await this.prisma.aiConfig.findUnique({ where: { configId } });
		if (!config) {
			throw new NotFoundException(`Không tìm thấy cấu hình AI với ID ${configId}`);
		}
		return config;
	}

	private toNumber(decimalValue: Prisma.Decimal | number) {
		return Number(decimalValue);
	}
}
