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
import { RecuitersService } from './recuiters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, successResponse } from '@ats-platform/types';
import { CreateRecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';
import { Recruiter } from '@ats-platform/database';

@Controller('recuiters')

export class RecuitersController {
  constructor(private readonly recuitersService: RecuitersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createRecruiterDto: CreateRecruiterDto) {
    const recruiter = await this.recuitersService.create(createRecruiterDto);
    return successResponse(201, 'Recruiter created successfully', recruiter);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const recruiters = await this.recuitersService.findAll();
    return successResponse(200, 'Recruiters fetched successfully', recruiters);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const recruiter = await this.recuitersService.findOne(id);
    return successResponse(200, 'Recruiter fetched successfully', recruiter);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    const recruiter = await this.recuitersService.update(id, updateRecruiterDto);
    return successResponse(200, 'Recruiter updated successfully', recruiter);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const recruiter = await this.recuitersService.remove(id);
    return successResponse(200, 'Recruiter deleted successfully', recruiter);
  }
}
