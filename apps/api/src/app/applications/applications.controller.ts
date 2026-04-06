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
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dtos/application.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Resources } from '../../common/decorators/resources.decorator';

// TODO: Review applications module before continuing to the next module
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }
  @Roles(Role.CANDIDATE)
  @Post()
  apply(@Req() req: Request, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(req.user['userId'], dto);
  }

  @Roles(Role.CANDIDATE)
  @Get('my')
  getMyApplications(@Req() req: Request) {
    return this.applicationsService.getMyApplications(req.user['userId']);
  }

  @Roles(Role.CANDIDATE)
  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Req() req: Request) {
    return this.applicationsService.withdraw(id, req.user['userId']);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Get('board/:jobId')
  getKanbanBoard(@Param('jobId') jobId: string) {
    return this.applicationsService.getKanbanBoard(jobId);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Get('job/:jobId')
  getApplicationsByJob(@Param('jobId') jobId: string) {
    return this.applicationsService.getApplicationsByJob(jobId);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, req.user['userId'], dto);
  }

  @Roles(Role.RECRUITER, Role.ADMIN)
  @Post(':id/trigger-screening')
  triggerScreening(@Param('id') id: string) {
    return this.applicationsService.triggerScreening(id);
  }

  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  @Get(':id/history')
  getApplicationHistory(@Param('id') id: string) {
    return this.applicationsService.getApplicationHistory(id);
  }

  @Roles(Role.RECRUITER, Role.ADMIN, Role.CANDIDATE)
  @UseGuards(OwnershipGuard)
  @Resources('applications')
  @Get(':id')
  getApplicationById(@Param('id') id: string) {
    return this.applicationsService.getApplicationById(id);
  }
}
