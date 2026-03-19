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
import { DepartmentsService } from './departments.service';
import { Role, successResponse } from '@ats-platform/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dtos/departments.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentsService.create(createDepartmentDto);
    return successResponse(201, 'Department created successfully', department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return successResponse(200, 'Departments fetched successfully', departments);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return successResponse(200, 'Department fetched successfully', department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(
      id,
      updateDepartmentDto,
    );
    return successResponse(200, 'Department updated successfully', department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const department = await this.departmentsService.remove(id);
    return successResponse(200, 'Department deleted successfully', department);
  }
}
