import { UserRole } from '@ats-platform/database';
import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CandidatesService } from './candidates.service';
import { FindCandidatesQueryDto, UpdateCandidateProfileDto } from './dtos/candidates.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.candidate)
  @Get('me')
  getProfile(@Req() req: Request & { user: { userId: string } }) {
    return this.candidatesService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.candidate)
  @Patch('me')
  updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateDto: UpdateCandidateProfileDto,
  ) {
    return this.candidatesService.updateProfile(req.user.userId, updateDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.recruiter, UserRole.admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.recruiter, UserRole.admin)
  @Get()
  findAll(@Query() query: FindCandidatesQueryDto) {
    return this.candidatesService.findAll(query);
  }
}
