import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IJobCategory } from '@ats-platform/types';

export class CreateJobCategoryDto implements IJobCategory {
	@ApiProperty({ example: 'Software Development', description: 'The name of the job category' })
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	name!: string;

	@ApiProperty({ example: 'uuid-of-parent-category', description: 'The ID of the parent job category, if any' })
	@IsOptional()
	@IsUUID()
	parentCategoryId?: string;
}

export class UpdateJobCategoryDto extends PartialType(CreateJobCategoryDto) {}

export class JobCategoryDto {
	@ApiProperty({
		example: 'a7b0f9f9-2a39-4f2f-ac7a-cf7cb8c3cb2f',
		description: 'Job category ID',
	})
	categoryId!: string;

	@ApiProperty({
		example: 'Software Development',
		description: 'The name of the job category',
	})
	name!: string;

	@ApiProperty({
		example: 'uuid-of-parent-category',
		description: 'The ID of the parent job category, if any',
		nullable: true,
	})
	parentCategoryId?: string;

	static fromEntity(entity: any): JobCategoryDto {
		const jobCategoryDto = new JobCategoryDto();
		jobCategoryDto.categoryId = entity.categoryId;
		jobCategoryDto.name = entity.name;
		jobCategoryDto.parentCategoryId = entity.parentCategoryId;
		return jobCategoryDto;
	}
}
