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
import { Role } from '@ats-platform/types';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dtos/ai-config.dto';

@Controller('ai-config')
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createAiConfigDto: CreateAiConfigDto) {
    return this.aiConfigService.create(createAiConfigDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get()
  findAll() {
    return this.aiConfigService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiConfigService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiConfigDto: UpdateAiConfigDto) {
    return this.aiConfigService.update(id, updateAiConfigDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.aiConfigService.setDefault(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiConfigService.remove(id);
  }
}
