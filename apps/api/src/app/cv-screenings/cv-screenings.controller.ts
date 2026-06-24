import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CvScreeningsService } from './cv-screenings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { Request } from 'express';

@ApiTags('Sàng lọc CV')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('screening')
export class CvScreeningsController {
  constructor(private readonly cvScreeningsService: CvScreeningsService) { }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê sàng lọc', description: 'Xem thống kê tổng quan sàng lọc CV của một vị trí tuyển dụng.' })
  @ApiQuery({ name: 'jobId', required: true, description: 'ID vị trí tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getScreeningStats(
    @Req() req: Request & { user: { userId: string; role: UserRole } },
    @Query('jobId') jobId: string,
  ) {
    return this.cvScreeningsService.getScreeningStats(jobId, req.user.userId, req.user.role);
  }

  @Get('me/:applicationId')
  @Roles(UserRole.candidate)
  @ApiOperation({ summary: 'Xem kết quả sàng lọc (ứng viên)', description: 'Ứng viên xem kết quả sàng lọc rút gọn của đơn ứng tuyển.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả sàng lọc' })
  async getScreeningResultForCandidate(@Req() req: Request & { user: { userId: string } }, @Param('applicationId') applicationId: string) {
    return this.cvScreeningsService.getScreeningResultForCandidate(applicationId, req.user.userId);
  }

  @Get(':applicationId')
  @Roles(UserRole.admin, UserRole.recruiter)
  @ApiOperation({ summary: 'Xem kết quả sàng lọc (HR)', description: 'Nhà tuyển dụng xem kết quả sàng lọc đầy đủ: điểm số, kỹ năng phù hợp, khuyến nghị AI.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả sàng lọc' })
  async getScreeningResult(
    @Req() req: Request & { user: { userId: string; role: UserRole } },
    @Param('applicationId') applicationId: string,
  ) {
    return this.cvScreeningsService.getScreeningResult(applicationId, req.user.userId, req.user.role);
  }
}
