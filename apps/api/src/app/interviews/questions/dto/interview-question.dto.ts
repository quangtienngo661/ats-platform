import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel } from '@ats-platform/database';
import { Transform } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimmedEach = ({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? item.trim() : item)) : value;

export class CreateInterviewQuestionDto {
    @ApiProperty({ enum: DifficultyLevel })
    @IsEnum(DifficultyLevel)
    difficulty!: DifficultyLevel;

    @ApiProperty({ maxLength: 1000, description: 'Nội dung câu hỏi' })
    @Transform(trimmed)
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    questionText!: string;

    @ApiProperty({ type: [String], description: 'Các ý mong đợi trong câu trả lời (1–20 ý)' })
    @Transform(trimmedEach)
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(500, { each: true })
    expectedPoints!: string[];
}

export class UpdateInterviewQuestionDto {
    @ApiPropertyOptional({ enum: DifficultyLevel })
    @IsOptional()
    @IsEnum(DifficultyLevel)
    difficulty?: DifficultyLevel;

    @ApiPropertyOptional({ maxLength: 1000 })
    @IsOptional()
    @Transform(trimmed)
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    questionText?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @Transform(trimmedEach)
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(500, { each: true })
    expectedPoints?: string[];

    @ApiPropertyOptional({ description: 'false = ẩn khỏi các phiên phỏng vấn mới' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class ListInterviewQuestionsQueryDto {
    @ApiPropertyOptional({ enum: DifficultyLevel })
    @IsOptional()
    @IsEnum(DifficultyLevel)
    difficulty?: DifficultyLevel;

    @ApiPropertyOptional({ description: 'true = gồm cả câu hỏi đã ẩn' })
    @IsOptional()
    @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
    @IsBoolean()
    includeInactive?: boolean;

    @ApiPropertyOptional({ minimum: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ minimum: 1, maximum: 100 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
