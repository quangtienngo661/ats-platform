import { Role } from '@ats-platform/types';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CVsService } from './cvs.service';
import { CVUploadInterceptor } from '../../common/interceptors/cv-upload.interceptor';
import * as fs from 'fs/promises';
import { Resources } from '../../common/decorators/resources.decorator';
import { OwnershipGuard } from '../../common/guards/resources.guard';

@Controller('cvs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CVsController {
  constructor(
    private readonly cvsService: CVsService,
    private readonly prisma: PrismaService,
  ) { }

  @Post('upload')
  @UseInterceptors(CVUploadInterceptor)
  @Roles(Role.CANDIDATE)
  async uploadCV(
    @Req() req: Request & { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const candidateId = await this.resolveCandidateId(req.user.userId);
      return this.cvsService.uploadCV(candidateId, file);
    } catch (error) {
      await fs.unlink(file.path);
      throw new BadRequestException('Error uploading CV', error.message);
    }
  }

  @Roles(Role.CANDIDATE)
  @Get('me')
  @Resources('cvs')
  @UseGuards(OwnershipGuard)
  async getMyCVs(@Req() req: Request & { user: { userId: string } }) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.getMyCVs(candidateId);
  }

  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get(':cvId')
  async getCVById(
    @Req() req: Request & { user: { userId: string } },
    @Param('cvId') cvId: string,
  ) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.getCVById(cvId, candidateId);
  }

  @Roles(Role.ADMIN, Role.RECRUITER)
  @Get(':cvId/parsed-data')
  async getParsedData(
    @Req() req: Request & { user: { userId: string } },
    @Param('cvId') cvId: string,
  ) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.getParsedData(cvId, candidateId);
  }

  @Resources('cvs')
  @UseGuards(OwnershipGuard)
  @Post(':cvId/confirm')
  async confirmCV(
    @Req() req: Request & { user: { userId: string } },
    @Param('cvId') cvId: string,
  ) {
    const candidateId = await this.resolveCandidateId(req.user.userId);
    return this.cvsService.confirmCV(cvId, candidateId);
  }

  @Resources('cvs')
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
