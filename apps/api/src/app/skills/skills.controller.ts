import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { successResponse } from '@ats-platform/types';
import { UserRole } from '@ats-platform/database';
import { CreateSkillDto, SkillDto, UpdateSkillDto } from './dtos/skills.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.create(createSkillDto);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  async findAll(): Promise<SkillDto[]> {
    const skills = await this.skillsService.findAll();
    return skills;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('category') category?: string,
  ): Promise<SkillDto[]> {
    const skills = await this.skillsService.search(name, category);
    return skills;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.findOne(id);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.remove(id);
    return skill;
  }
}
