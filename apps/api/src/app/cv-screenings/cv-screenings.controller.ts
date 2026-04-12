import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('screening')
export class CvScreeningsController {
  constructor(private readonly cvScreeningsService: CvScreeningsService) { }

  /**
   * Xem thống kê tổng quan screening của một job
   */
  @Roles(UserRole.admin, UserRole.recruiter)
  @Get('stats')
  async getScreeningStats(@Query('jobId') jobId: string) {
    return this.cvScreeningsService.getScreeningStats(jobId);
  }

  /**
   * Xem kết quả screening của chính mình — partial reveal
   */
  @Get('me/:applicationId')
  @Roles(UserRole.candidate)
  async getScreeningResultForCandidate(@Req() req: Request & { user: { userId: string } }, @Param('applicationId') applicationId: string) {
    return this.cvScreeningsService.getScreeningResultForCandidate(applicationId, req.user.userId);
  }

  /**
   * Xem kết quả screening đầy đủ của một application. Phương thức này cho HR
   */
  @Get(':applicationId')
  @Roles(UserRole.admin, UserRole.recruiter)
  async getScreeningResult(@Param('applicationId') applicationId: string) {
    return this.cvScreeningsService.getScreeningResult(applicationId);
  }
}
