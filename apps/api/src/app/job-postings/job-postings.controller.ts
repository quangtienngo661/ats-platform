import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { CreateJobPostingDto, FindJobPostingsQueryDto, UpdateJobPostingDto } from './dto/job-posting.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Request } from 'express';
import { Resources } from '../../common/decorators/resources.decorator';

@Controller('job-postings')
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Post()
  create(@Body() createJobPostingDto: CreateJobPostingDto, @Req() req: Request) {
    return this.jobPostingsService.create(req.user['userId'], createJobPostingDto);
  }

  @Get()
  findAll(@Query() query: FindJobPostingsQueryDto) {
    return this.jobPostingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.findOne(id);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: UpdateJobPostingDto,
  ) {
    return await this.jobPostingsService.update(id, updateJobPostingDto);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
