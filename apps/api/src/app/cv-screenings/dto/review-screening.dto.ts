import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ReviewScreeningDto {
  @ApiProperty({ description: 'Điểm kỹ năng sau duyệt (0–100)', example: 80 })
  @IsNumber()
  @Min(0)
  @Max(100)
  skillsScore!: number;

  @ApiProperty({ description: 'Điểm kinh nghiệm sau duyệt (0–100)', example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  experienceScore!: number;

  @ApiProperty({ description: 'Điểm học vấn sau duyệt (0–100)', example: 60 })
  @IsNumber()
  @Min(0)
  @Max(100)
  educationScore!: number;

  @ApiPropertyOptional({
    description: 'Lý do duyệt. Bắt buộc khi có điểm khác điểm AI.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
