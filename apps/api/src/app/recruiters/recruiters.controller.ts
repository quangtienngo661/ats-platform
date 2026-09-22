import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitersService } from './recruiters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { CreateRecruiterDto, RecruiterDto, UpdateMyRecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';
import { Request } from 'express';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';

@ApiTags('Nhà tuyển dụng')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) { }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Post()
  @ApiOperation({ summary: 'Tạo nhà tuyển dụng', description: 'Quản trị viên gán vai trò nhà tuyển dụng cho một user và liên kết với phòng ban. Quản trị tổ chức chỉ được dùng phòng ban thuộc tổ chức của mình.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng hoặc phòng ban' })
  async create(
    @Body() createRecruiterDto: CreateRecruiterDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    const recruiter = await this.recruitersService.create(createRecruiterDto, caller);
    return recruiter;
  }

  @Roles(UserRole.recruiter)
  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ cá nhân', description: 'Nhà tuyển dụng xem hồ sơ của chính mình.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    return this.recruitersService.getMe(req.user.userId);
  }

  @Roles(UserRole.recruiter)
  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân', description: 'Nhà tuyển dụng cập nhật chức danh của mình.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateDto: UpdateMyRecruiterDto,
  ) {
    return this.recruitersService.updateMe(req.user.userId, updateDto);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhà tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll(@CurrentCaller() caller: TenantCaller) {
    const recruiters = await this.recruitersService.findAll(caller);
    return recruiters;
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết nhà tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà tuyển dụng' })
  async findOne(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    const recruiter = await this.recruitersService.findOne(id, caller);
    return recruiter;
  }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhà tuyển dụng', description: 'Quản trị viên cập nhật thông tin nhà tuyển dụng trong phạm vi của mình.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    const recruiter = await this.recruitersService.update(id, updateRecruiterDto, caller);
    return recruiter;
  }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhà tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    const recruiter = await this.recruitersService.remove(id, caller);
    return recruiter;
  }
}
