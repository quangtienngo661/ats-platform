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
import { UserRole } from '@ats-platform/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto, DepartmentDto, UpdateDepartmentDto } from './dtos/departments.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentsService.create(createDepartmentDto);
    return department;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return departments;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return department;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
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
  async remove(@Param('id') id: string) {
    const department = await this.departmentsService.remove(id);
    return department;
  }
}
