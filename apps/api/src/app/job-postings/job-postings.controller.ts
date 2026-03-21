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
} from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { CreateJobPostingDto, UpdateJobPostingDto } from './dto/job-posting.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Request } from 'express';
import { Resources } from '../../common/decorators/resources.decorator';

@Controller('job-postings')
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Post()
  create(@Body() createJobPostingDto: CreateJobPostingDto, @Req() req: Request) {
    return this.jobPostingsService.create(req.user['userId'], createJobPostingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.jobPostingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.findOne(id);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: UpdateJobPostingDto,
  ) {
    console.log('JobPosting update debugging')
    return await this.jobPostingsService.update(id, updateJobPostingDto);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
