import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobPostingsService } from './job-postings.service';
import { CreateJobPostingDto, FindJobPostingsQueryDto, ParseJdPreviewDto, UpdateJobPostingDto } from './dto/job-posting.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { Request } from 'express';
import { Resources } from '../../common/decorators/resources.decorator';

@ApiTags('Tin tuyển dụng')
@Controller('job-postings')
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) { }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Post('parse-jd-preview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Phân tích JD bằng AI', description: 'Gửi mô tả công việc (JD) để AI trích xuất yêu cầu, kỹ năng, kinh nghiệm.' })
  @ApiResponse({ status: 200, description: 'Phân tích thành công' })
  parseJdPreview(@Body() parseJdPreviewDto: ParseJdPreviewDto) {
    return this.jobPostingsService.parseJdPreview(parseJdPreviewDto.description);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tin tuyển dụng', description: 'Tạo tin tuyển dụng mới với thông tin vị trí, lương, kỹ năng yêu cầu.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() createJobPostingDto: CreateJobPostingDto, @Req() req: Request) {
      return this.jobPostingsService.create(req.user['userId'], createJobPostingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tin tuyển dụng', description: 'Tìm kiếm và lọc tin tuyển dụng. Hỗ trợ phân trang.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(@Query() query: FindJobPostingsQueryDto) {
    return this.jobPostingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết tin tuyển dụng' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tuyển dụng' })
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.findOne(id);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tin tuyển dụng', description: 'Chỉ chủ sở hữu hoặc admin mới được cập nhật.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: UpdateJobPostingDto,
  ) {
    return await this.jobPostingsService.update(id, updateJobPostingDto);
  }

  @Resources('job-posting')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles(UserRole.admin, UserRole.recruiter)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tin tuyển dụng', description: 'Chỉ chủ sở hữu hoặc admin mới được xóa.' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
