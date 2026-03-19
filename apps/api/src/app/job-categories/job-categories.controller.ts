import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JobCategoriesService } from './job-categories.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';
import {
  CreateJobCategoryDto,
  JobCategoryDto,
  UpdateJobCategoryDto,
} from './dtos/job-categories.dto';

@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly jobCategoriesService: JobCategoriesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createJobCategoryDto: CreateJobCategoryDto): Promise<JobCategoryDto> {
    const category = await this.jobCategoriesService.create(createJobCategoryDto);
    return JobCategoryDto.fromEntity(category);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(): Promise<JobCategoryDto[]> {
    const categories = await this.jobCategoriesService.findAll();
    return categories.map(JobCategoryDto.fromEntity);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<JobCategoryDto> {
    const category = await this.jobCategoriesService.findOne(id);
    return JobCategoryDto.fromEntity(category);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobCategoryDto: UpdateJobCategoryDto,
  ): Promise<JobCategoryDto> {
    const category = await this.jobCategoriesService.update(
      id,
      updateJobCategoryDto,
    );
    return JobCategoryDto.fromEntity(category);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<JobCategoryDto> {
    const category = await this.jobCategoriesService.remove(id);
    return JobCategoryDto.fromEntity(category);
  }
}
