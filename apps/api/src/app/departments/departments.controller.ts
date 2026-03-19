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
import { Role } from '@ats-platform/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDepartmentDto, DepartmentDto, UpdateDepartmentDto } from './dtos/departments.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<DepartmentDto> {
    const department = await this.departmentsService.create(createDepartmentDto);
    return DepartmentDto.fromEntity(department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(): Promise<DepartmentDto[]> {
    const departments = await this.departmentsService.findAll();
    return departments.map(DepartmentDto.fromEntity); 
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DepartmentDto> {
    const department = await this.departmentsService.findOne(id);
    return DepartmentDto.fromEntity(department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    const department = await this.departmentsService.update(
      id,
      updateDepartmentDto,
    );
    return DepartmentDto.fromEntity(department);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<DepartmentDto> {
    const department = await this.departmentsService.remove(id);
    return DepartmentDto.fromEntity(department);
  }
}
