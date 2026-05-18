import { JobStatus, LocationType } from '@ats-platform/database';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IJobPostingSkills, ISkill } from '@ats-platform/types'
import {
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FindJobPostingsQueryDto {
	@ApiPropertyOptional({ enum: JobStatus })
	@IsOptional()
	@IsEnum(JobStatus)
	status?: JobStatus;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	departmentId?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@ApiPropertyOptional({ description: 'Search by job title' })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({ default: 1 })
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	@Min(1)
	page?: number;

	@ApiPropertyOptional({ default: 20 })
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	@Min(1)
	limit?: number;
}

export class ParseJdPreviewDto {
	@ApiProperty({
		example: 'We are looking for a Backend Engineer experienced with NestJS and PostgreSQL...',
		description: 'Raw job description content to parse before creating a job posting',
	})
	@IsString()
	@IsNotEmpty()
	description!: string;
}

export class CreateJobPostingDto {
	@ApiProperty({
		example: '0b5f2f42-87f0-4dbe-b861-cde1e7f6e11e',
		description: 'Department ID of this job posting',
	})
	@IsOptional()
	@IsUUID()
	departmentId?: string;

	@ApiPropertyOptional({
		example: '64de8e8f-718d-4a7d-aec5-c9df19037df7',
		description: 'Job category ID',
	})
	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@ApiProperty({
		example: '32c9a334-3099-4c65-b03a-595f39b6dcaf',
		description: 'Recruiter ID who created this posting',
	})
	@IsUUID()
	@IsOptional()
	createdBy?: string;

	@ApiProperty({
		example: 'Senior Backend Engineer',
		description: 'Job title',
	})
	@IsString()
	@IsNotEmpty()
	title!: string;

	@ApiProperty({
		enum: LocationType,
		example: 'hybrid',
		description: 'Work location type',
	})
	@IsEnum(LocationType)
	locationType!: LocationType;

	@ApiPropertyOptional({
		example: 1000,
		description: 'Minimum salary',
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	salaryMin?: number;

	@ApiPropertyOptional({
		example: 3000,
		description: 'Maximum salary',
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	salaryMax?: number;

	@ApiPropertyOptional({
		example: 'Build APIs with NestJS and PostgreSQL',
		description: 'Job description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		example: {
			job_summary: 'Build APIs with NestJS and PostgreSQL',
			requirements: {
				hard_skills: ['NestJS', 'PostgreSQL'],
			},
		},
		description: 'AI/parsed requirements',
	})
	@IsOptional()
	parsedRequirements?: unknown;

	@ApiPropertyOptional({
		enum: JobStatus,
		example: 'draft',
		description: 'Current posting status',
	})
	@IsOptional()
	@IsEnum(JobStatus)
	status?: JobStatus;

	@ApiPropertyOptional({
		example: [
			{ "skillId": "uuid-nestjs", "isRequired": true },
			{ "skillId": "uuid-postgresql", "isRequired": true },
			{ "skillId": "uuid-docker", "isRequired": false }
		],
		description: 'Skills for this job posting with required/optional flag',
	})
	@IsOptional()
	skills?: IJobPostingSkills[];

	@ApiPropertyOptional({
		example: '2026-03-20T10:00:00.000Z',
		description: 'Publish time',
	})
	@IsOptional()
	@IsDateString()
	publishedAt?: string;
}

export class UpdateJobPostingDto extends PartialType(CreateJobPostingDto) { }
