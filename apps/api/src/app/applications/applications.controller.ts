import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, GetApplicationsByJobQueryDto, UpdateApplicationStatusDto } from './dtos/application.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Resources } from '../../common/decorators/resources.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }
  @Roles(UserRole.candidate)
  @Post()
  apply(@Req() req: Request, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(req.user['userId'], dto);
  }

  @Roles(UserRole.candidate)
  @Get('my')
  getMyApplications(@Req() req: Request) {
    return this.applicationsService.getMyApplications(req.user['userId']);
  }

  @Roles(UserRole.candidate)
  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Req() req: Request) {
    return this.applicationsService.withdraw(id, req.user['userId']);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('board/all')
  getAllKanbanBoard(@Req() req: Request) {
    return this.applicationsService.getAllKanbanBoard(req.user['userId'], req.user['role']);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('board/:jobId')
  getKanbanBoard(@Param('jobId') jobId: string) {
    return this.applicationsService.getKanbanBoard(jobId);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('job/:jobId')
  getApplicationsByJob(@Param('jobId') jobId: string, @Query() query: GetApplicationsByJobQueryDto) {
    return this.applicationsService.getApplicationsByJob(jobId, query);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, req.user['userId'], dto);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Post(':id/trigger-screening')
  triggerScreening(@Param('id') id: string, @Body('configId') configId?: string) {
    return this.applicationsService.triggerScreening(id, configId);
  }

  @Roles(UserRole.recruiter, UserRole.admin, UserRole.candidate)
  @Get(':id/history')
  getApplicationHistory(@Param('id') id: string) {
    return this.applicationsService.getApplicationHistory(id);
  }

  @Roles(UserRole.recruiter, UserRole.admin, UserRole.candidate)
  @UseGuards(OwnershipGuard)
  @Resources('application')
  @Get(':id')
  getApplicationById(@Param('id') id: string) {
    return this.applicationsService.getApplicationById(id);
  }
}
