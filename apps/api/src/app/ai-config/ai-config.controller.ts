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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiConfigService } from './ai-config.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { CreateAiConfigDto, UpdateAiConfigDto } from './dtos/ai-config.dto';

@ApiTags('Cấu hình AI')
@ApiBearerAuth()
@Controller('ai-config')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) { }

  @Roles(UserRole.admin)
  @Post()
  @ApiOperation({ summary: 'Tạo cấu hình AI', description: 'Tạo bộ trọng số mới cho sàng lọc CV (skills, experience, education). Tổng trọng số phải bằng 1.0.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Tổng trọng số không bằng 1.0' })
  create(@Body() createAiConfigDto: CreateAiConfigDto) {
    return this.aiConfigService.create(createAiConfigDto);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cấu hình AI', description: 'Danh sách sắp xếp theo cấu hình mặc định trước.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll() {
    return this.aiConfigService.findAll();
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết cấu hình AI' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  findOne(@Param('id') id: string) {
    return this.aiConfigService.findOne(id);
  }

  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình AI' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(@Param('id') id: string, @Body() updateAiConfigDto: UpdateAiConfigDto) {
    return this.aiConfigService.update(id, updateAiConfigDto);
  }

  @Roles(UserRole.admin)
  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Đặt làm cấu hình mặc định', description: 'Đặt một cấu hình làm mặc định. Cấu hình mặc định trước đó sẽ bị hủy.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  setDefault(@Param('id') id: string) {
    return this.aiConfigService.setDefault(id);
  }

  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cấu hình AI', description: 'Không thể xóa cấu hình mặc định hoặc đang được sử dụng.' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa cấu hình đang sử dụng' })
  remove(@Param('id') id: string) {
    return this.aiConfigService.remove(id);
  }
}
