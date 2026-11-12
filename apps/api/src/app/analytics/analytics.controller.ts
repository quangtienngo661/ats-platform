import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { AnalyticsService } from './analytics.service';
import { AiCostQueryDto, RecruitmentAnalyticsQueryDto } from './dto/recruitment-analytics-query.dto';
import { ModelPriceDto } from './dto/model-price.dto';

// Under /analytics rather than /ai-usage-logs: that controller's GET :referenceId would
// capture /ai-usage-logs/summary and /ai-usage-logs/prices.
@ApiTags('Thống kê')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // org_admin passes as recruiter (RolesGuard); the scope is the service's.
  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('recruitment')
  @ApiOperation({ summary: 'Thống kê tuyển dụng: funnel, thời gian ở giai đoạn, xu hướng, đơn mới nhất' })
  @ApiResponse({ status: 400, description: 'Khoảng thời gian không hợp lệ' })
  recruitment(@CurrentCaller() caller: TenantCaller, @Query() query: RecruitmentAnalyticsQueryDto) {
    return this.analyticsService.recruitment(caller, query);
  }

  @Roles(UserRole.org_admin, UserRole.admin)
  @Get('ai-cost')
  @ApiOperation({ summary: 'Chi phí AI ước tính theo tháng và loại tác vụ' })
  @ApiResponse({ status: 403, description: 'Tổ chức khác' })
  aiCost(@CurrentCaller() caller: TenantCaller, @Query() query: AiCostQueryDto) {
    return this.analyticsService.aiCost(caller, query);
  }

  @Roles(UserRole.admin)
  @Get('ai-model-prices')
  @ApiOperation({ summary: 'Bảng giá model AI (USD / 1 triệu token)' })
  modelPrices() {
    return this.analyticsService.modelPrices();
  }

  @Roles(UserRole.admin)
  @Put('ai-model-prices/:modelName')
  @ApiOperation({ summary: 'Đặt giá cho một model AI' })
  setModelPrice(
    @CurrentCaller() caller: TenantCaller,
    @Param('modelName') modelName: string,
    @Body() dto: ModelPriceDto,
  ) {
    return this.analyticsService.setModelPrice(caller, modelName, dto);
  }
}
