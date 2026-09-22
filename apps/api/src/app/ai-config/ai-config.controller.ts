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
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { TenantCaller } from '../../common/tenancy/tenant-caller';

@ApiTags('Cấu hình AI')
@ApiBearerAuth()
@Controller('ai-config')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) { }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Post()
  @ApiOperation({ summary: 'Tạo cấu hình AI', description: 'Tạo bộ trọng số mới cho sàng lọc CV (skills, experience, education). Tổng trọng số phải bằng 1.0.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Tổng trọng số không bằng 1.0' })
  create(
    @Body() createAiConfigDto: CreateAiConfigDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    return this.aiConfigService.create(createAiConfigDto, caller);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cấu hình AI', description: 'Danh sách sắp xếp theo cấu hình mặc định trước.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(@CurrentCaller() caller: TenantCaller) {
    return this.aiConfigService.findAll(caller);
  }

  @Roles(UserRole.admin, UserRole.recruiter)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết cấu hình AI' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  findOne(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return this.aiConfigService.findOne(id, caller);
  }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình AI' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(
    @Param('id') id: string,
    @Body() updateAiConfigDto: UpdateAiConfigDto,
    @CurrentCaller() caller: TenantCaller,
  ) {
    return this.aiConfigService.update(id, updateAiConfigDto, caller);
  }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Đặt làm cấu hình mặc định', description: 'Đặt một cấu hình làm mặc định của tổ chức sở hữu nó. Cấu hình mặc định trước đó của CÙNG tổ chức sẽ bị hủy.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  setDefault(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return this.aiConfigService.setDefault(id, caller);
  }

  @Roles(UserRole.admin, UserRole.org_admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cấu hình AI', description: 'Không thể xóa cấu hình mặc định hoặc đang được sử dụng.' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa cấu hình đang sử dụng' })
  remove(@Param('id') id: string, @CurrentCaller() caller: TenantCaller) {
    return this.aiConfigService.remove(id, caller);
  }
}
