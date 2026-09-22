import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { IAiConfig } from '@ats-platform/types';

export class CreateAiConfigDto implements Omit<IAiConfig, 'configId'> {
    @ApiProperty({
        example: 'Default CV Screening Config',
        description: 'Human-readable config name',
    })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({
        example: true,
        description: 'Whether this config becomes the active default config',
    })
    @IsBoolean()
    isDefault = false;

    @ApiPropertyOptional({
        example: 'Default CV Screening Config',
        description: 'Human-readable config name',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: 0.5,
        description: 'Weight for skill matching score',
        minimum: 0,
        maximum: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(1)
    skillsWeight!: number;

    @ApiProperty({
        example: 0.3,
        description: 'Weight for experience matching score',
        minimum: 0,
        maximum: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(1)
    experienceWeight!: number;

    @ApiProperty({
        example: 0.2,
        description: 'Weight for education matching score',
        minimum: 0,
        maximum: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(1)
    educationWeight!: number;

    @ApiProperty({
        example: 65,
        description: 'Minimum overall score threshold for pass recommendation',
        minimum: 0,
        maximum: 100,
    })
    @IsNumber()
    @Min(0)
    @Max(100)
    minimumScoreThreshold!: number;

    // Only a platform admin sends this — it belongs to no organization, so it must
    // say whose config this is. Anyone else always gets its own organization.
    @ApiPropertyOptional({
        example: '00000000-0000-4000-8000-000000000001',
        description: 'Bắt buộc với quản trị viên nền tảng. Người dùng khác nếu gửi thì phải trùng tổ chức của chính mình.',
    })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}

// A config never changes organization. Sending organizationId here is a 400.
export class UpdateAiConfigDto extends PartialType(
    OmitType(CreateAiConfigDto, ['organizationId'] as const),
) { }
