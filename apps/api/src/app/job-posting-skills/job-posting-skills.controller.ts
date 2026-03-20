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
import { AuthGuard } from '@nestjs/passport';
import { JobPostingSkillsService } from './job-posting-skills.service';
import {
  CreateJobPostingSkillDto,
  UpdateJobPostingSkillDto,
} from './dto/job-posting-skill.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';

@Controller('job-posting-skills')
export class JobPostingSkillsController {
  constructor(
    private readonly jobPostingSkillsService: JobPostingSkillsService,
  ) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Post()
  create(@Body() createJobPostingSkillDto: CreateJobPostingSkillDto) {
    return this.jobPostingSkillsService.create(createJobPostingSkillDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get()
  findAll() {
    return this.jobPostingSkillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingSkillsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobPostingSkillDto: UpdateJobPostingSkillDto,
  ) {
    return this.jobPostingSkillsService.update(id, updateJobPostingSkillDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingSkillsService.remove(id);
  }
}
