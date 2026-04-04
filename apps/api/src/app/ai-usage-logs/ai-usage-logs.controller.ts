import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AiUsageLogsService } from './ai-usage-logs.service';
import { AiActionType, AiLogStatus } from '@ats-platform/database';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@ats-platform/types';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('ai-usage-logs')
export class AiUsageLogsController {
  constructor(private readonly aiUsageLogsService: AiUsageLogsService) {}

  @Get()
  async getAllLogs(
    @Query('actionType') actionType?: AiActionType,
    @Query('status') status?: AiLogStatus,
  ) {
    return this.aiUsageLogsService.getAllLogs({ actionType, status });
  }

  @Get(':referenceId')
  async getLogsById(@Param('referenceId') referenceId: string) {
    return this.aiUsageLogsService.getLogsById(referenceId);
  }
}

