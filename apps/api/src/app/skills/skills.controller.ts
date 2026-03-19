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
import { CreateSkillDto, UpdateSkillDto } from './dtos/skills.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto) {
    const skill = await this.skillsService.create(createSkillDto);
    return successResponse(201, 'Skill created successfully', skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const skills = await this.skillsService.findAll();
    return successResponse(200, 'Skills fetched successfully', skills);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('category') category?: string,
  ) {
    const skills = await this.skillsService.search(name, category);
    return successResponse(200, 'Skills searched successfully', skills);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const skill = await this.skillsService.findOne(id);
    return successResponse(200, 'Skill fetched successfully', skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return successResponse(200, 'Skill updated successfully', skill);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const skill = await this.skillsService.remove(id);
    return successResponse(200, 'Skill deleted successfully', skill);
  }
}
