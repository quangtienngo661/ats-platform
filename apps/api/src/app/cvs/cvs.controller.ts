import { UserRole } from '@ats-platform/database';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CVsService } from './cvs.service';
import { CVUploadInterceptor } from '../../common/interceptors/cv-upload.interceptor';
import * as fs from 'fs/promises';
import { Resources } from '../../common/decorators/resources.decorator';
import { OwnershipGuard } from '../../common/guards/resources.guard';
import { UploadCvDto } from './dtos/cvs.dto';
import { createReadStream, existsSync } from 'fs';

@ApiTags('CV')
@ApiBearerAuth()
@Controller('cvs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CVsController {
  constructor(
    private readonly cvsService: CVsService,
    private readonly prisma: PrismaService,
  ) { }

  @Post('upload')
  @UseInterceptors(CVUploadInterceptor)
  @Roles(UserRole.candidate)
  @ApiOperation({ summary: 'Tải CV lên', description: 'Ứng viên tải file CV (PDF). Hệ thống tự động trích xuất và phân tích nội dung bằng AI.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Tải lên thành công, bắt đầu xử lý' })
  @ApiResponse({ status: 400, description: 'File không hợp lệ' })
  async uploadCV(
    @Req() req: Request & { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadCvDto,
  ) {
    try {
      const candidateId = await this.resolveCandidateId(req.user.userId);
      return await this.cvsService.uploadCV(candidateId, file, body.fileName);
    } catch (error) {
      await fs.unlink(file.path);
      throw new BadRequestException('Tải CV lên thất bại', error.message);
    }
  }

  @Roles(UserRole.candidate)
  @Get('me')
  @ApiOperation({ summary: 'Xem danh sách CV của tôi', description: 'Ứng viên xem tất cả CV đã tải lên.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getMyCVs(@Req() req: Request & { user: { userId: string } }) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.getMyCVs(candidateId);
  }

  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId')
  @Resources('cv')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Xem chi tiết CV' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV' })
  async getCVById(
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.getCVById(cvId);
  }

  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId/parsed-data')
  @Resources('cv')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Xem dữ liệu phân tích CV', description: 'Trả về dữ liệu đã được AI trích xuất từ CV (kỹ năng, kinh nghiệm, học vấn).' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getParsedData(
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.getParsedData(cvId);
  }

  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId/download')
  @Resources('cv')
  @ApiOperation({ summary: 'Tải xuống CV', description: 'Tải file CV gốc (PDF).' })
  @ApiResponse({ status: 200, description: 'File CV' })
  async downloadCV(
    @Param('cvId') cvId: string,
    @Query('name') name: string,
    @Res() res: Response,
  ) {
    const { absolutePath } = await this.cvsService.downloadCV(cvId);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File CV không còn tồn tại trên hệ thống lưu trữ');
    }

    res.download(absolutePath, `${name || 'cv'} Resume.pdf`);;
  }

  @Resources('cv')
  @UseGuards(OwnershipGuard)
  @Post(':cvId/confirm')
  @ApiOperation({ summary: 'Xác nhận dữ liệu CV', description: 'Xác nhận dữ liệu AI phân tích là chính xác. Tùy chọn đồng bộ vào hồ sơ ứng viên.' })
  @ApiQuery({ name: 'syncToProfile', required: true, type: Boolean, description: 'Đồng bộ dữ liệu vào hồ sơ' })
  @ApiQuery({ name: 'markAsConfirmed', required: true, type: Boolean, description: 'Đánh dấu đã xác nhận' })
  @ApiResponse({ status: 200, description: 'Xác nhận thành công' })
  async confirmCV(
    @Req() req: Request & { user: { userId: string } },
    @Param('cvId') cvId: string,
    @Query('syncToProfile', ParseBoolPipe) syncToProfile: boolean,
    @Query('markAsConfirmed', ParseBoolPipe) markAsConfirmed: boolean,
  ) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.confirmCV(cvId, candidateId, syncToProfile, markAsConfirmed);
  }

  @Resources('cv')
  @UseGuards(OwnershipGuard)
  @Delete(':cvId')
  @ApiOperation({ summary: 'Xóa CV' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteCV(
    @Req() req: Request & { user: { userId: string } },
    @Param('cvId') cvId: string,
  ) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.deleteCV(cvId, candidateId);
  }

  private async resolveCandidateId(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { candidateId: true },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    return candidate.candidateId;
  }
}
