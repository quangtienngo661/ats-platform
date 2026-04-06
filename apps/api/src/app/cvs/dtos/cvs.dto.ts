import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UploadCVsResponseDto {
  cvId!: string;
  candidateId!: string;
  filePath!: string;
  parsingStatus!: string;
  uploadedAt!: Date;
}

export class CandidateCVsListDto {
  cvId!: string;
  filePath!: string;
  parsingStatus!: string;
  uploadedAt!: Date;
}

export class PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
