import { UserRole } from '@ats-platform/database';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { UpsertScorecardDto } from './dto/upsert-scorecard.dto';
import { InterviewScorecardsService } from './interview-scorecards.service';

@ApiTags('Đánh giá phỏng vấn')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class InterviewScorecardsController {
  constructor(private readonly scorecardsService: InterviewScorecardsService) {}

  @Roles(UserRole.recruiter, UserRole.admin)
  @Put('interviews/schedules/:id/scorecard')
  @ApiOperation({ summary: 'Nộp hoặc cập nhật đánh giá phỏng vấn' })
  @ApiResponse({ status: 200, description: 'Lưu đánh giá thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền nộp đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch phỏng vấn' })
  @ApiResponse({ status: 409, description: 'Chưa hoàn tất phỏng vấn hoặc đơn đã chốt' })
  upsert(
    @CurrentCaller() caller: TenantCaller,
    @Param('id') interviewId: string,
    @Body() dto: UpsertScorecardDto,
  ) {
    return this.scorecardsService.upsert(caller, interviewId, dto);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('interviews/schedules/:id/scorecard')
  @ApiOperation({ summary: 'Đọc đánh giá của buổi phỏng vấn' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền đọc đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hoặc chưa có đánh giá' })
  getForSchedule(
    @CurrentCaller() caller: TenantCaller,
    @Param('id') interviewId: string,
  ) {
    return this.scorecardsService.getForSchedule(caller, interviewId);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('interview-scorecards/application/:applicationId')
  @ApiOperation({ summary: 'Danh sách đánh giá phỏng vấn của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền đọc đánh giá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn ứng tuyển' })
  listForApplication(
    @CurrentCaller() caller: TenantCaller,
    @Param('applicationId') applicationId: string,
  ) {
    return this.scorecardsService.listForApplication(caller, applicationId);
  }
}
