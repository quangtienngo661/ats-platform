import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { IAiConfig } from '@ats-platform/types';

export class CreateAiConfigDto implements IAiConfig {
    @ApiProperty({
        example: 'Default CV Screening Config',
        description: 'Human-readable config name',
    })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether this config becomes the active default config',
    })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

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
        example: 0.65,
        description: 'Minimum overall score threshold for pass recommendation',
        minimum: 0,
        maximum: 1,
    })
    @IsNumber()
    @Min(0)
    @Max(1)
    minimumScoreThreshold!: number;
}

export class UpdateAiConfigDto extends PartialType(CreateAiConfigDto) { }