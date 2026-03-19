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
import { Role, successResponse } from '@ats-platform/types';
import { CreateSkillDto, SkillDto, UpdateSkillDto } from './dtos/skills.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.create(createSkillDto);
    return SkillDto.fromEntity(skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(): Promise<SkillDto[]> {
    const skills = await this.skillsService.findAll();
    return skills.map(SkillDto.fromEntity);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('category') category?: string,
  ): Promise<SkillDto[]> {
    const skills = await this.skillsService.search(name, category);
    return skills.map(SkillDto.fromEntity);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.findOne(id);
    return SkillDto.fromEntity(skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return SkillDto.fromEntity(skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.remove(id);
    return SkillDto.fromEntity(skill);
  }
}
