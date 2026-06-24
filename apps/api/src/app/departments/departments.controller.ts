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

@ApiTags('Phòng ban')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Post()
  @ApiOperation({ summary: 'Tạo phòng ban', description: 'Tạo phòng ban mới trong tổ chức.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentsService.create(createDepartmentDto);
    return department;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phòng ban', description: 'Lấy tất cả phòng ban kèm thông tin nhà tuyển dụng và tin tuyển dụng.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return departments;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết phòng ban' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return department;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(
      id,
      updateDepartmentDto,
    );
    return department;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng ban' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string) {
    const department = await this.departmentsService.remove(id);
    return department;
  }
}
