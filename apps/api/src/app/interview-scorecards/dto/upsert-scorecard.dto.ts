import { ScorecardRecommendation } from '@ats-platform/database';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertScorecardDto {
  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Điểm phải là số nguyên' })
  @Min(1, { message: 'Điểm tối thiểu là 1' })
  @Max(5, { message: 'Điểm tối đa là 5' })
  technicalSkills: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Điểm phải là số nguyên' })
  @Min(1, { message: 'Điểm tối thiểu là 1' })
  @Max(5, { message: 'Điểm tối đa là 5' })
  problemSolving: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Điểm phải là số nguyên' })
  @Min(1, { message: 'Điểm tối thiểu là 1' })
  @Max(5, { message: 'Điểm tối đa là 5' })
  communication: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Điểm phải là số nguyên' })
  @Min(1, { message: 'Điểm tối thiểu là 1' })
  @Max(5, { message: 'Điểm tối đa là 5' })
  cultureFit: number;

  @ApiProperty({ enum: ScorecardRecommendation })
  @IsEnum(ScorecardRecommendation, { message: 'Đề xuất tuyển dụng không hợp lệ' })
  recommendation: ScorecardRecommendation;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString({ message: 'Nhận xét phải là chuỗi' })
  @MaxLength(2000, { message: 'Nhận xét không được vượt quá 2000 ký tự' })
  comment?: string;
}
