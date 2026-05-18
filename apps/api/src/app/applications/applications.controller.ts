import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, GetApplicationsByJobQueryDto, UpdateApplicationStatusDto } from './dtos/application.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Resources } from '../../common/decorators/resources.decorator';

@ApiTags('Đơn ứng tuyển')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Roles(UserRole.candidate)
  @Post()
  @ApiOperation({ summary: 'Nộp đơn ứng tuyển', description: 'Ứng viên nộp đơn vào một vị trí tuyển dụng bằng CV đã tải lên.' })
  @ApiResponse({ status: 201, description: 'Nộp đơn thành công' })
  @ApiResponse({ status: 400, description: 'Đã nộp đơn vào vị trí này hoặc CV không hợp lệ' })
  apply(@Req() req: Request, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(req.user['userId'], dto);
  }

  @Roles(UserRole.candidate)
  @Get('my')
  @ApiOperation({ summary: 'Xem đơn ứng tuyển của tôi', description: 'Ứng viên xem tất cả đơn đã nộp.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getMyApplications(@Req() req: Request) {
    return this.applicationsService.getMyApplications(req.user['userId']);
  }

  @Roles(UserRole.candidate)
  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Rút đơn ứng tuyển', description: 'Ứng viên hủy đơn đã nộp.' })
  @ApiResponse({ status: 200, description: 'Rút đơn thành công' })
  withdraw(@Param('id') id: string, @Req() req: Request) {
    return this.applicationsService.withdraw(id, req.user['userId']);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('board/all')
  @ApiOperation({ summary: 'Kanban tổng quan', description: 'Lấy bảng Kanban tất cả đơn thuộc phòng ban.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getAllKanbanBoard(@Req() req: Request) {
    return this.applicationsService.getAllKanbanBoard(req.user['userId'], req.user['role']);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('board/:jobId')
  @ApiOperation({ summary: 'Kanban theo vị trí', description: 'Lấy bảng Kanban cho một vị trí tuyển dụng cụ thể.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getKanbanBoard(@Param('jobId') jobId: string, @Req() req: Request) {
    return this.applicationsService.getKanbanBoard(req.user['userId'], req.user['role'], jobId);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('job/:jobId')
  @ApiOperation({ summary: 'Danh sách đơn theo vị trí', description: 'Lấy danh sách ứng viên đã nộp đơn vào một vị trí.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getApplicationsByJob(
    @Param('jobId') jobId: string,
    @Query() query: GetApplicationsByJobQueryDto,
    @Req() req: Request,
  ) {
    return this.applicationsService.getApplicationsByJob(req.user['userId'], req.user['role'], jobId, query);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Chuyển trạng thái đơn', description: 'Cập nhật trạng thái đơn ứng tuyển theo luồng Kanban (applied → screening → interview → offer → hired).' })
  @ApiResponse({ status: 200, description: 'Chuyển trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Trạng thái chuyển đổi không hợp lệ' })
  updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, req.user['userId'], req.user['role'], dto);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Post(':id/trigger-screening')
  @ApiOperation({ summary: 'Kích hoạt sàng lọc AI', description: 'Kích hoạt quy trình sàng lọc CV bằng AI cho một đơn ứng tuyển.' })
  @ApiResponse({ status: 200, description: 'Đã kích hoạt sàng lọc' })
  triggerScreening(@Param('id') id: string, @Req() req: Request, @Body('configId') configId?: string) {
    return this.applicationsService.triggerScreening(id, req.user['userId'], req.user['role'], configId);
  }

  @Roles(UserRole.recruiter, UserRole.admin, UserRole.candidate)
  @Get(':id/history')
  @ApiOperation({ summary: 'Lịch sử trạng thái', description: 'Xem lịch sử chuyển trạng thái của đơn ứng tuyển.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getApplicationHistory(@Param('id') id: string, @Req() req: Request) {
    return this.applicationsService.getApplicationHistory(id, req.user['userId'], req.user['role']);
  }

  @Roles(UserRole.recruiter, UserRole.admin, UserRole.candidate)
  @UseGuards(OwnershipGuard)
  @Resources('application')
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn ứng tuyển' })
  getApplicationById(@Param('id') id: string, @Req() req: Request) {
    return this.applicationsService.getApplicationById(id, req.user['userId'], req.user['role']);
  }
}
