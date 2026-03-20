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
import { RecruitersService } from './recruiters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';
import { CreateRecruiterDto, RecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';

@Controller('recruiters')

export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createRecruiterDto: CreateRecruiterDto) {
    const recruiter = await this.recruitersService.create(createRecruiterDto);
    return recruiter;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get()
  async findAll() {
    const recruiters = await this.recruitersService.findAll();
    return recruiters;
  }

  @UseGuards(AuthGuard('jwt'))
  // @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const recruiter = await this.recruitersService.findOne(id);
    return recruiter;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    const recruiter = await this.recruitersService.update(id, updateRecruiterDto);
    return recruiter;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const recruiter = await this.recruitersService.remove(id);
    return recruiter;
  }
}
