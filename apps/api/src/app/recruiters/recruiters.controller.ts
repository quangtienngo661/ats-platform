import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { CreateRecruiterDto, RecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) { }

  @Roles(UserRole.admin)
  @Post()
  async create(@Body() createRecruiterDto: CreateRecruiterDto) {
    const recruiter = await this.recruitersService.create(createRecruiterDto);
    return recruiter;
  }

  @Roles(UserRole.recruiter)
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    return this.recruitersService.getMe(req.user.userId);
  }

  @Roles(UserRole.recruiter)
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateDto: UpdateRecruiterDto,
  ) {
    return this.recruitersService.updateMe(req.user.userId, updateDto);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  async findAll() {
    const recruiters = await this.recruitersService.findAll();
    return recruiters;
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const recruiter = await this.recruitersService.findOne(id);
    return recruiter;
  }

  @Roles(UserRole.admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    const recruiter = await this.recruitersService.update(id, updateRecruiterDto);
    return recruiter;
  }

  @Roles(UserRole.admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const recruiter = await this.recruitersService.remove(id);
    return recruiter;
  }
}
