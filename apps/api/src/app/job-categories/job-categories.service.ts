import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
	CreateJobCategoryDto,
	UpdateJobCategoryDto,
} from './dtos/job-categories.dto';

@Injectable()
export class JobCategoriesService {
	constructor(private readonly prisma: PrismaService) {}

	async create(createJobCategoryDto: CreateJobCategoryDto) {
		await this.ensureParentExists(createJobCategoryDto.parentCategoryId);

		return this.prisma.jobCategory.create({
			data: {
				name: createJobCategoryDto.name,
				parentCategoryId: createJobCategoryDto.parentCategoryId,
			},
			include: {
				parentCategory: true,
				childCategories: true,
			},
		});
	}

	async findAll() {
		return this.prisma.jobCategory.findMany({
			include: {
				parentCategory: true,
				childCategories: true,
			},
		});
	}

	async findOne(id: string) {
		const category = await this.prisma.jobCategory.findUnique({
			where: { categoryId: id },
			include: {
				parentCategory: true,
				childCategories: true,
			},
		});

		if (!category) {
			throw new NotFoundException(`Job category with ID ${id} not found`);
		}

		return category;
	}

	async update(id: string, updateJobCategoryDto: UpdateJobCategoryDto) {
		const existingCategory = await this.prisma.jobCategory.findUnique({
			where: { categoryId: id },
		});

		if (!existingCategory) {
			throw new NotFoundException(`Job category with ID ${id} not found`);
		}

		if (updateJobCategoryDto.parentCategoryId === id) {
			throw new BadRequestException('A category cannot be its own parent');
		}

		if (updateJobCategoryDto.parentCategoryId !== undefined) {
			await this.ensureParentExists(updateJobCategoryDto.parentCategoryId);
			await this.ensureNotCircular(id, updateJobCategoryDto.parentCategoryId);
		}

		return this.prisma.jobCategory.update({
			where: { categoryId: id },
			data: {
				name: updateJobCategoryDto.name,
				parentCategoryId: updateJobCategoryDto.parentCategoryId,
			},
			include: {
				parentCategory: true,
				childCategories: true,
			},
		});
	}

	async remove(id: string) {
		const existingCategory = await this.prisma.jobCategory.findUnique({
			where: { categoryId: id },
			include: {
				childCategories: {
					select: { categoryId: true },
				},
			},
		});

		if (!existingCategory) {
			throw new NotFoundException(`Job category with ID ${id} not found`);
		}

		if (existingCategory.childCategories.length > 0) {
			throw new BadRequestException(
				'Cannot delete a category that still has child categories',
			);
		}

		return this.prisma.jobCategory.delete({
			where: { categoryId: id },
		});
	}

	private async ensureParentExists(parentCategoryId?: string) {
		if (!parentCategoryId) {
			return;
		}

		const parent = await this.prisma.jobCategory.findUnique({
			where: { categoryId: parentCategoryId },
			select: { categoryId: true },
		});

		if (!parent) {
			throw new NotFoundException(
				`Parent category with ID ${parentCategoryId} not found`,
			);
		}
	}

	private async ensureNotCircular(categoryId: string, parentCategoryId: string) {
		let currentParentId: string | null = parentCategoryId;

		while (currentParentId) {
			if (currentParentId === categoryId) {
				throw new BadRequestException(
					'Circular hierarchy detected in category parent relation',
				);
			}

			const current = await this.prisma.jobCategory.findUnique({
				where: { categoryId: currentParentId },
				select: { parentCategoryId: true },
			});

			currentParentId = current?.parentCategoryId ?? null;
		}
	}
}
