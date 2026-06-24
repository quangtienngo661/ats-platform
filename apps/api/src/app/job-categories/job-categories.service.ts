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
	constructor(private readonly prisma: PrismaService) { }

	async create(createJobCategoryDto: CreateJobCategoryDto) {
		await this.ensureParentExists(createJobCategoryDto.parentCategoryId);

		return await this.prisma.jobCategory.create({
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
		return await this.prisma.jobCategory.findMany({
			include: {
				parentCategory: true,
				childCategories: {
					include: { jobPostings: { select: { jobId: true } } }
				},
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
			throw new NotFoundException(`Không tìm thấy danh mục công việc với ID ${id}`);
		}

		return category;
	}

	async update(id: string, updateJobCategoryDto: UpdateJobCategoryDto) {
		const existingCategory = await this.prisma.jobCategory.findUnique({
			where: { categoryId: id },
		});

		if (!existingCategory) {
			throw new NotFoundException(`Không tìm thấy danh mục công việc với ID ${id}`);
		}

		if (updateJobCategoryDto.parentCategoryId === id) {
			throw new BadRequestException('Danh mục không thể là danh mục cha của chính nó');
		}

		if (updateJobCategoryDto.parentCategoryId !== undefined) {
			await this.ensureParentExists(updateJobCategoryDto.parentCategoryId);
			await this.ensureNotCircular(id, updateJobCategoryDto.parentCategoryId);
		}

		return await this.prisma.jobCategory.update({
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
			throw new NotFoundException(`Không tìm thấy danh mục công việc với ID ${id}`);
		}

		if (existingCategory.childCategories.length > 0) {
			throw new BadRequestException(
				'Không thể xóa danh mục vẫn còn danh mục con',
			);
		}

		return await this.prisma.jobCategory.delete({
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
				`Không tìm thấy danh mục cha với ID ${parentCategoryId}`,
			);
		}
	}

	private async ensureNotCircular(categoryId: string, parentCategoryId: string) {
		let currentParentId: string | null = parentCategoryId;

		while (currentParentId) {
			if (currentParentId === categoryId) {
				throw new BadRequestException(
					'Phát hiện vòng lặp trong quan hệ danh mục cha',
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
