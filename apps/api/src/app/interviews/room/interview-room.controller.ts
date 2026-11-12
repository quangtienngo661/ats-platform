import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentCaller } from '../../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../../common/tenancy/tenant-caller';
import { InterviewRoomService } from './interview-room.service';

@ApiTags('Phỏng vấn')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('interviews')
export class InterviewRoomController {
  constructor(private readonly interviewRoomService: InterviewRoomService) {}

  // org_admin passes as recruiter (RolesGuard). Whether the caller is IN the interview
  // is checked by the service.
  @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
  @Post('schedules/:id/join')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Vào phòng phỏng vấn trực tuyến',
    description:
      'Cấp token LiveKit cho ứng viên, người phỏng vấn hoặc người tạo lịch, từ 15 phút trước giờ hẹn đến 30 phút sau giờ kết thúc.',
  })
  @ApiResponse({ status: 200, description: 'Thông tin kết nối phòng' })
  @ApiResponse({ status: 400, description: 'Ngoài khung giờ, lịch trực tiếp hoặc đã huỷ' })
  @ApiResponse({ status: 403, description: 'Không tham gia buổi phỏng vấn này' })
  @ApiResponse({ status: 503, description: 'Chưa cấu hình LiveKit' })
  join(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return this.interviewRoomService.join(id, caller);
  }
}
