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
import { AiConfigService } from './ai-config.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';

import { CreateAiConfigDto, UpdateAiConfigDto } from './dtos/ai-config.dto';

@Controller('ai-config')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) { }

  @Roles(UserRole.admin)
  @Post()
  create(@Body() createAiConfigDto: CreateAiConfigDto) {
    return this.aiConfigService.create(createAiConfigDto);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  findAll() {
    return this.aiConfigService.findAll();
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiConfigService.findOne(id);
  }

  @Roles(UserRole.admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiConfigDto: UpdateAiConfigDto) {
    return this.aiConfigService.update(id, updateAiConfigDto);
  }

  @Roles(UserRole.admin)
  @Patch(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.aiConfigService.setDefault(id);
  }

  @Roles(UserRole.admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiConfigService.remove(id);
  }
}
