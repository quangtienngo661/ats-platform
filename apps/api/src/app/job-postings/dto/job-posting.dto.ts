import { JobStatus, LocationType } from '@ats-platform/database';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IJobPostingSkills, ISkill } from '@ats-platform/types'
import {
	ArrayMaxSize,
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Nest hands controllers classToPlain(entity) (main.ts sets no `transform`), so every
// @Transform runs twice: each one below must give the same result on its own output.
// An empty salary means "no filter": Number('') would silently be 0.
const toOptionalNumber = ({ value }: { value: unknown }) =>
	typeof value === 'string' ? (value.trim() === '' ? undefined : Number(value)) : value;

// `?skillIds=a` arrives as a string and `?skillIds=a&skillIds=b` as an array.
const toSkillIdList = ({ value }: { value: unknown }) =>
	value === undefined || Array.isArray(value) ? value : [value];

export class FindJobPostingsQueryDto {
	@ApiPropertyOptional({ enum: JobStatus })
	@IsOptional()
	@IsEnum(JobStatus)
	status?: JobStatus;

	@ApiPropertyOptional({ enum: LocationType })
	@IsOptional()
	@IsEnum(LocationType)
	locationType?: LocationType;

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
	@Transform(({ value }) => Number(value))
	@IsInt()
	@Min(1)
	page?: number;

	@ApiPropertyOptional({ default: 20 })
	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsInt()
	@Min(1)
	limit?: number;

	@ApiPropertyOptional({ description: 'Lowest salary the candidate accepts (VND)' })
	@IsOptional()
	@Transform(toOptionalNumber)
	@IsNumber()
	@Min(0)
	salaryMin?: number;

	@ApiPropertyOptional({ description: 'Highest salary the candidate asks for (VND)' })
	@IsOptional()
	@Transform(toOptionalNumber)
	@IsNumber()
	@Min(0)
	salaryMax?: number;

	@ApiPropertyOptional({ type: [String], description: 'Match a posting that requires any of these skills' })
	@IsOptional()
	@Transform(toSkillIdList)
	@IsArray()
	@ArrayMaxSize(20)
	@IsUUID(undefined, { each: true })
	skillIds?: string[];
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
