import { IUserDto } from '@ats-platform/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCandidateProfileDto {
	@ApiPropertyOptional({
		example: 'Senior Frontend Developer',
		description: 'Current professional title of candidate',
	})
	@IsOptional()
	@IsString()
	currentTitle?: string;

	@ApiPropertyOptional({
		example: 3,
		description: 'Total years of professional experience',
	})
	@IsOptional()
	@IsInt()
	@Min(0)
	yearsOfExperience?: number;

	@ApiPropertyOptional({
		example: {
			summary: 'Focused on frontend engineering',
			preferred_location: 'remote',
		},
		description: 'Additional custom profile fields stored as JSON',
	})
	@IsOptional()
	@IsObject()
	profileData?: Record<string, unknown>;

	@IsOptional()
	@IsObject()
	userInfo: IUserDto;
}

export class FindCandidatesQueryDto {
	@ApiPropertyOptional({
		example: 'nguyen',
		description: 'Search by full name, email, phone or current title',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		example: 'active',
		description: 'Filter by user status',
	})
	@IsOptional()
	@IsIn(['active', 'inactive'])
	@IsString()
	status?: 'active' | 'inactive';

	@ApiPropertyOptional({ example: 1, minimum: 1 })
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? Number(value) : 1))
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
	@IsOptional()
	@Transform(({ value }) => (value !== undefined ? Number(value) : 10))
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10;
}
