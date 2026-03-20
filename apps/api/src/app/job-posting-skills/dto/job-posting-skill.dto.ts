import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateJobPostingSkillDto {
  @ApiProperty({
    example: '0b5f2f42-87f0-4dbe-b861-cde1e7f6e11e',
    description: 'Job posting ID',
  })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({
    example: '64de8e8f-718d-4a7d-aec5-c9df19037df7',
    description: 'Skill ID',
  })
  @IsUUID()
  @IsNotEmpty()
  skillId!: string;

  @ApiProperty({
    example: true,
    description: 'Whether this skill is required for the job',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateJobPostingSkillDto {
  @ApiProperty({
    example: true,
    description: 'Whether this skill is required for the job',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
