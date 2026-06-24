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
import { JobCategoriesService } from './job-categories.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import {
  CreateJobCategoryDto,
  JobCategoryDto,
  UpdateJobCategoryDto,
} from './dtos/job-categories.dto';

@ApiTags('Danh mục công việc')
@ApiBearerAuth()
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly jobCategoriesService: JobCategoriesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  @ApiOperation({ summary: 'Tạo danh mục công việc', description: 'Tạo danh mục mới, hỗ trợ phân cấp cha-con.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() createJobCategoryDto: CreateJobCategoryDto) {
    const category = await this.jobCategoriesService.create(createJobCategoryDto);
    return category;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục', description: 'Lấy tất cả danh mục kèm quan hệ cha-con.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll() {
    const categories = await this.jobCategoriesService.findAll();
    return categories;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết danh mục' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
  async findOne(@Param('id') id: string) {
    const category = await this.jobCategoriesService.findOne(id);
    return category;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục', description: 'Cập nhật tên hoặc danh mục cha. Kiểm tra vòng lặp tự động.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Phát hiện vòng lặp trong quan hệ cha-con' })
  async update(
    @Param('id') id: string,
    @Body() updateJobCategoryDto: UpdateJobCategoryDto,
  ) {
    const category = await this.jobCategoriesService.update(
      id,
      updateJobCategoryDto,
    );
    return category;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục', description: 'Xóa danh mục. Không thể xóa nếu còn danh mục con.' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa danh mục còn danh mục con' })
  async remove(@Param('id') id: string) {
    const category = await this.jobCategoriesService.remove(id);
    return category;
  }
}
