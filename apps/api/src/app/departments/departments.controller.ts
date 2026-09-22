import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { UserRole } from '@ats-platform/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dtos/departments.dto';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';

@ApiTags('Phòng ban')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.org_admin, UserRole.recruiter)
  @Post()
  @ApiOperation({
    summary: 'Tạo phòng ban',
    description:
      'Tạo phòng ban mới. Phòng ban thuộc tổ chức của người tạo; quản trị viên nền tảng phải chỉ định organizationId.',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    return await this.departmentsService.create(createDepartmentDto, caller);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.org_admin)
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách phòng ban',
    description:
      'Phòng ban trong phạm vi của người gọi, kèm nhà tuyển dụng và tin tuyển dụng. Quản trị tổ chức chỉ thấy tổ chức của mình.',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll(@CurrentCaller() caller: TenantCaller) {
    return await this.departmentsService.findAll(caller);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.org_admin)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết phòng ban' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async findOne(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return await this.departmentsService.findOne(id, caller);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.org_admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    return await this.departmentsService.update(id, updateDepartmentDto, caller);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.org_admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng ban' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return await this.departmentsService.remove(id, caller);
  }
}
