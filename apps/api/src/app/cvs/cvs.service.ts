import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ParsingStatus, Prisma } from '@ats-platform/database';
import * as path from 'node:path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CandidatesService } from '../candidates/candidates.service';
import { PdfService } from '../../common/pdf/pdf.service';
import * as fs from 'fs/promises';
import { candidateIncludeOptions } from '../../common/utils/include-options.util';
import { GeminiService } from '../../common/external-apis/gemini/gemini.service';
import { CV_PARSE_PROMPT } from '../../common/constants/gemini-api';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CVsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidatesService: CandidatesService,
    private readonly pdfService: PdfService,
    private readonly geminiService: GeminiService,
    @InjectQueue('cv-processing') private readonly cvProcessingQueue: Queue,
  ) { }

  async uploadCV(candidateId: string, file: Express.Multer.File) {
    const fileBuffer = await fs.readFile(file.path);
    const rawTextFromCV = await this.pdfService.parsePdf(fileBuffer);

    const cvRecord = await this.prisma.cV.create({
        data: {
          candidateId,
          filePath: file.path,
          parsingStatus: ParsingStatus.pending,
          rawText: rawTextFromCV,
          uploadedAt: new Date(),
        },
        include: {
          candidate: {
            include: { ...candidateIncludeOptions }
          },
        },
        omit: {
          candidateId: true,
        },
      });

      await this.cvProcessingQueue.add('parse-cv', {
        cvId: cvRecord.cvId,
        rawTextFromCV,
      });

      return cvRecord;
  }

  async getMyCVs(candidateId: string) {
    return this.prisma.cV.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        cvId: true,
        filePath: true,
        parsingStatus: true,
        uploadedAt: true,
      },
    });
  }

  async getCVById(cvId: string, candidateId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      include: {
        parsedData: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.candidateId !== candidateId) {
      throw new ForbiddenException('You do not have permission to access this CV');
    }

    return cv;
  }

  async getParsedData(cvId: string, candidateId: string) {
    const cv = await this.getCVById(cvId, candidateId);

    if (!cv.parsedData) {
      throw new NotFoundException('Parsed data not found');
    }

    return cv.parsedData;
  }

  async confirmCV(cvId: string, candidateId: string) {
    const cv = await this.getCVById(cvId, candidateId);

    if (cv.parsingStatus !== ParsingStatus.success) {
      throw new BadRequestException('CV has not been parsed successfully yet');
    }

    if (!cv.parsedData) {
      throw new BadRequestException('Parsed data not found for this CV');
    }

    if (cv.parsedData.isConfirmed) {
      throw new BadRequestException('This CV has already been confirmed');
    }

    const profileData: Record<string, unknown> = {
      full_name: cv.parsedData.fullName,
      email: cv.parsedData.email,
      experience: cv.parsedData.experience as Prisma.InputJsonValue,
      education: cv.parsedData.education as Prisma.InputJsonValue,
      skills: cv.parsedData.skills as Prisma.InputJsonValue,
      source_cv_id: cv.cvId,
      last_updated_from_cv: new Date().toISOString(),
    };

    await this.candidatesService.updateProfileData(candidateId, profileData);

    await this.prisma.cVParsedData.update({
      where: { cvId: cv.cvId },
      data: { isConfirmed: true },
    });

    return {
      message: 'CV confirmed and candidate profile updated successfully',
      cvId: cv.cvId,
      isConfirmed: true,
    };
  }

  async deleteCV(cvId: string, candidateId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.candidateId !== candidateId) {
      throw new ForbiddenException('You do not have permission to delete this CV');
    }

    if (cv._count.applications > 0) {
      throw new BadRequestException('Cannot delete CV that is used by an application');
    }

    await this.prisma.cV.delete({ where: { cvId } });

    const absolutePath = path.isAbsolute(cv.filePath)
      ? cv.filePath
      : path.join(process.cwd(), cv.filePath);

    try {
      await fs.unlink(absolutePath);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    return {
      message: 'CV deleted successfully',
    };

    // TODO: Download CV by HR endpoint
  }
}
