import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@ats-platform/database';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/organization.dto';

@ApiTags('Tổ chức')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Roles(UserRole.admin)
  @Post()
  @ApiOperation({
    summary: 'Tạo tổ chức',
    description:
      'Chỉ quản trị viên nền tảng. Tổ chức mới được tạo kèm một cấu hình AI mặc định.',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Slug đã được sử dụng' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Roles(UserRole.admin)
  @Get()
  @ApiOperation({
    summary: 'Danh sách tổ chức',
    description: 'Chỉ quản trị viên nền tảng.',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll() {
    return this.organizationsService.findAll();
  }

  // Declared before ':id' so 'me' is not captured as an id.
  @Roles(UserRole.org_admin, UserRole.recruiter)
  @Get('me')
  @ApiOperation({
    summary: 'Tổ chức của tôi',
    description:
      'Tổ chức mà quản trị tổ chức hoặc nhà tuyển dụng đang thuộc về.',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findMine(@CurrentCaller() caller: TenantCaller) {
    return this.organizationsService.findMine(caller);
  }

  @Roles(UserRole.admin)
  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết tổ chức',
    description: 'Chỉ quản trị viên nền tảng.',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tổ chức' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
