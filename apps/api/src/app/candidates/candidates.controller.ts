import { UserRole } from '@ats-platform/database';
import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CandidatesService } from './candidates.service';
import { FindCandidatesQueryDto, UpdateCandidateProfileDto } from './dtos/candidates.dto';

@ApiTags('Ứng viên')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.candidate)
  @Get('me')
  @ApiOperation({ summary: 'Xem hồ sơ cá nhân', description: 'Ứng viên xem hồ sơ của mình bao gồm thông tin cá nhân, kỹ năng, số CV và đơn ứng tuyển.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hồ sơ ứng viên' })
  getProfile(@Req() req: Request & { user: { userId: string } }) {
    return this.candidatesService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.candidate)
  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ', description: 'Cập nhật chức danh, kinh nghiệm, và dữ liệu hồ sơ chi tiết.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateDto: UpdateCandidateProfileDto,
  ) {
    return this.candidatesService.updateProfile(req.user.userId, updateDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.recruiter, UserRole.admin)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết ứng viên', description: 'Nhà tuyển dụng hoặc admin xem thông tin ứng viên.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ứng viên' })
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.candidatesService.findOne(id, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.recruiter, UserRole.admin)
  @Get()
  @ApiOperation({ summary: 'Tìm kiếm ứng viên', description: 'Tìm kiếm ứng viên theo tên, email, chức danh. Hỗ trợ phân trang.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(
    @Query() query: FindCandidatesQueryDto,
    @Req() req: Request & { user: { userId: string; role: UserRole } },
  ) {
    return this.candidatesService.findAll(query, req.user.userId, req.user.role);
  }
}
