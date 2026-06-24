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

@ApiTags('Nhà tuyển dụng')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) { }

  @Roles(UserRole.admin)
  @Post()
  @ApiOperation({ summary: 'Tạo nhà tuyển dụng', description: 'Admin gán vai trò nhà tuyển dụng cho một user và liên kết với phòng ban.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng hoặc phòng ban' })
  async create(@Body() createRecruiterDto: CreateRecruiterDto) {
    const recruiter = await this.recruitersService.create(createRecruiterDto);
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
  async findAll() {
    const recruiters = await this.recruitersService.findAll();
    return recruiters;
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết nhà tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhà tuyển dụng' })
  async findOne(@Param('id') id: string) {
    const recruiter = await this.recruitersService.findOne(id);
    return recruiter;
  }

  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhà tuyển dụng', description: 'Admin cập nhật thông tin nhà tuyển dụng.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    const recruiter = await this.recruitersService.update(id, updateRecruiterDto);
    return recruiter;
  }

  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhà tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string) {
    const recruiter = await this.recruitersService.remove(id);
    return recruiter;
  }
}
