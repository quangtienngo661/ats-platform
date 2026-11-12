import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { CopilotService } from './copilot.service';
import { CopilotDecisionDto } from './dto/copilot-decision.dto';

// org_admin passes as recruiter (RolesGuard). The department/organization scope is the
// same as the Kanban's and is checked by the service.
@ApiTags('AI co-pilot')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.recruiter, UserRole.admin)
@Controller('applications')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Get('job/:jobId/copilot')
  @ApiOperation({ summary: 'Gợi ý bước tiếp theo cho các hồ sơ của một tin' })
  suggestionsForJob(@Param('jobId') jobId: string, @CurrentCaller() caller: TenantCaller) {
    return this.copilotService.suggestionsForJob(caller, jobId);
  }

  @Post(':id/copilot/apply')
  @HttpCode(200)
  @ApiOperation({ summary: 'Áp dụng gợi ý co-pilot (đổi trạng thái hoặc chạy sàng lọc)' })
  @ApiResponse({ status: 409, description: 'Gợi ý đã thay đổi' })
  apply(@Param('id') id: string, @CurrentCaller() caller: TenantCaller, @Body() dto: CopilotDecisionDto) {
    return this.copilotService.apply(caller, id, dto.key);
  }

  @Post(':id/copilot/dismiss')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bỏ qua gợi ý co-pilot' })
  dismiss(@Param('id') id: string, @CurrentCaller() caller: TenantCaller, @Body() dto: CopilotDecisionDto) {
    return this.copilotService.dismiss(caller, id, dto.key);
  }

  @Post(':id/copilot/explain')
  @HttpCode(200)
  @ApiOperation({ summary: 'AI giải thích gợi ý co-pilot' })
  @ApiResponse({ status: 503, description: 'Chưa tạo được giải thích' })
  explain(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return this.copilotService.explain(caller, id);
  }
}
