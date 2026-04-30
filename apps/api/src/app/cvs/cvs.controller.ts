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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
  async uploadCV(
    @Req() req: Request & { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadCvDto,
  ) {
    try {
      const candidateId = await this.resolveCandidateId(req.user.userId);
      return this.cvsService.uploadCV(candidateId, file, body.fileName);
    } catch (error) {
      await fs.unlink(file.path);
      throw new BadRequestException('Error uploading CV', error.message);
    }
  }

  @Roles(UserRole.candidate)
  @Get('me')
  async getMyCVs(@Req() req: Request & { user: { userId: string } }) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.getMyCVs(candidateId);
  }

  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId')
  @Resources('cv')
  @UseGuards(OwnershipGuard)
  async getCVById(
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.getCVById(cvId);
  }

  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId/parsed-data')
  @Resources('cv')
  @UseGuards(OwnershipGuard)
  async getParsedData(
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.getParsedData(cvId);
  }

  // TODO: Review this method
  @Roles(UserRole.admin, UserRole.recruiter, UserRole.candidate)
  @Get(':cvId/download')
  @Resources('cv')
  @UseGuards(OwnershipGuard)
  async downloadCV(
    @Param('cvId') cvId: string,
    @Res() res: Response,
  ) {
    const { absolutePath, fileName } = await this.cvsService.downloadCV(cvId);
    res.download(absolutePath, fileName);
  }

  @Resources('cv')
  @UseGuards(OwnershipGuard)
  @Post(':cvId/confirm')
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
      throw new NotFoundException('Candidate profile not found');
    }

    return candidate.candidateId;
  }
}
