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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { CreateSkillDto, SkillDto, UpdateSkillDto } from './dtos/skills.dto';

@ApiTags('Kỹ năng')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  @ApiOperation({ summary: 'Tạo kỹ năng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Kỹ năng đã tồn tại' })
  async create(@Body() createSkillDto: CreateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.create(createSkillDto);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách kỹ năng', description: 'Trả về tất cả kỹ năng, sắp xếp theo danh mục.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll(): Promise<SkillDto[]> {
    const skills = await this.skillsService.findAll();
    return skills;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm kỹ năng', description: 'Tìm kỹ năng theo tên hoặc danh mục.' })
  @ApiQuery({ name: 'name', required: false, description: 'Tên kỹ năng' })
  @ApiQuery({ name: 'category', required: false, description: 'Danh mục kỹ năng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
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
  @ApiOperation({ summary: 'Xem chi tiết kỹ năng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kỹ năng' })
  async findOne(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.findOne(id);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật kỹ năng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto): Promise<SkillDto> {
    const skill = await this.skillsService.update(id, updateSkillDto);
    return skill;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa kỹ năng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string): Promise<SkillDto> {
    const skill = await this.skillsService.remove(id);
    return skill;
  }
}
