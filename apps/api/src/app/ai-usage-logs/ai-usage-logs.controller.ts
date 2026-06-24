import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiUsageLogsService } from './ai-usage-logs.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';

@ApiTags('Nhật ký sử dụng AI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@Controller('ai-usage-logs')
export class AiUsageLogsController {
  constructor(private readonly aiUsageLogsService: AiUsageLogsService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhật ký AI', description: 'Lọc theo loại hành động (cv_parsing, cv_scoring, mock_interview, job_parsing) và trạng thái. Hỗ trợ phân trang.' })
  @ApiQuery({ name: 'actionType', required: false, enum: ['cv_parsing', 'cv_scoring', 'mock_interview', 'job_parsing'], description: 'Loại hành động AI' })
  @ApiQuery({ name: 'status', required: false, enum: ['success', 'failed'], description: 'Trạng thái' })
  @ApiQuery({ name: 'page', required: false, description: 'Trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số bản ghi mỗi trang (mặc định: 10)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getAllLogs(
    @Query('actionType') actionType?: AiActionType,
    @Query('status') status?: AiLogStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.aiUsageLogsService.getAllLogs({ actionType, status }, pageNum, limitNum);
  }

  @Get(':referenceId')
  @ApiOperation({ summary: 'Xem nhật ký theo reference ID', description: 'Lấy tất cả bản ghi AI liên quan đến một entity (CV, đơn ứng tuyển, phiên phỏng vấn).' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhật ký' })
  async getLogsById(@Param('referenceId') referenceId: string) {
    return this.aiUsageLogsService.getLogsById(referenceId);
  }
}
