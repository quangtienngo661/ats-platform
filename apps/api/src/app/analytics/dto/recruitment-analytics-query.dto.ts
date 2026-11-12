import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

/** GET /analytics/recruitment (GĐ4 R17). Without from/to: the last 30 days. */
export class RecruitmentAnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-21T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày bắt đầu không hợp lệ' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-20T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày kết thúc không hợp lệ' })
  to?: string;

  @ApiPropertyOptional({ description: 'Chỉ một tin tuyển dụng' })
  @IsOptional()
  @IsUUID('all', { message: 'Mã tin tuyển dụng không hợp lệ' })
  jobId?: string;

  @ApiPropertyOptional({ description: 'Chỉ quản trị viên nền tảng: một tổ chức' })
  @IsOptional()
  @IsUUID('all', { message: 'Mã tổ chức không hợp lệ' })
  organizationId?: string;
}

/** GET /analytics/ai-cost (GĐ4 R22). */
export class AiCostQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày bắt đầu không hợp lệ' })
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày kết thúc không hợp lệ' })
  to?: string;

  @ApiPropertyOptional({ description: 'Quản trị viên nền tảng: một tổ chức; quản trị tổ chức: chỉ tổ chức của mình' })
  @IsOptional()
  @IsUUID('all', { message: 'Mã tổ chức không hợp lệ' })
  organizationId?: string;
}
