import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IRecruiter } from '@ats-platform/types';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Recruiter } from '@ats-platform/database';

export class CreateRecruiterDto implements IRecruiter {
	@ApiProperty({
		example: '8a6f6624-5399-4f0b-8f49-25c4e2b7f7aa',
		description: 'Recruiter user ID',
	})
	@IsNotEmpty()
	@IsUUID()
	userId: string;

	@ApiProperty({
		example: 'a7b0f9f9-2a39-4f2f-ac7a-cf7cb8c3cb2f',
		description: 'Department ID',
	})
	@IsNotEmpty()
	@IsUUID()
	departmentId: string;

	@ApiProperty({
		example: 'Senior Recruiter',
		description: 'Recruiter position in organization',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	position: string;
}

export class UpdateRecruiterDto extends PartialType(CreateRecruiterDto) {}

export class UpdateMyRecruiterDto {
	@ApiProperty({
		example: 'Senior Recruiter',
		description: 'Recruiter position in organization',
		required: false,
	})
	@IsString()
	@IsOptional()
	@MinLength(1)
	position?: string;
}

export class RecruiterDto {
	@ApiProperty({
		example: '8a6f6624-5399-4f0b-8f49-25c4e2b7f7aa',
		description: 'Recruiter ID',
	})
	recruiterId!: string;

	@ApiProperty({
		example: '8a6f6624-5399-4f0b-8f49-25c4e2b7f7aa',
		description: 'Recruiter user ID',
	})
	userId!: string;

	@ApiProperty({
		example: 'a7b0f9f9-2a39-4f2f-ac7a-cf7cb8c3cb2f',
		description: 'Department ID',
	})
	departmentId!: string;

	@ApiProperty({
		example: 'Senior Recruiter',
		description: 'Recruiter position in organization',
		nullable: true,
	})
	position?: string;

	static fromEntity(entity: Recruiter): RecruiterDto {
		const dto = new RecruiterDto();
		dto.recruiterId = entity.recruiterId;
		dto.userId = entity.userId;
		dto.departmentId = entity.departmentId;
		dto.position = entity.position;
		return dto;
	}
}
