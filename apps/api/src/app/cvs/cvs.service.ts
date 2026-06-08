import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ParsingStatus, Prisma } from '@ats-platform/database';
import * as path from 'node:path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CandidatesService } from '../candidates/candidates.service';
import { PdfService } from '../../common/pdf/pdf.service';
import * as fs from 'fs/promises';
import { candidateIncludeOptions } from '../../common/utils/include-options.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CVsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidatesService: CandidatesService,
    private readonly pdfService: PdfService,
    @InjectQueue('cv-processing') private readonly cvProcessingQueue: Queue,
  ) { }

  async uploadCV(candidateId: string, file: Express.Multer.File, fileName: string) {
    const fileBuffer = await fs.readFile(file.path);
    const rawTextFromCV = await this.pdfService.parsePdf(fileBuffer);

    const relativePath = file.path
      .replace(process.cwd(), '')
      .replace(/^[\\/]/, '')
      .replace(/\\/g, '/');

    const cvRecord = await this.prisma.cV.create({
      data: {
        candidateId,
        fileName,
        filePath: relativePath,
        parsingStatus: ParsingStatus.pending,
        rawText: rawTextFromCV,
        uploadedAt: new Date(),
      },
      include: {
        candidate: {
          include: { ...candidateIncludeOptions },
        },
      },
      omit: {
        candidateId: true,
      },
    });

    await this.cvProcessingQueue.add('parse-cv', {
      cvId: cvRecord.cvId,
    });

    return cvRecord;
  }

  async getMyCVs(candidateId: string) {
    return await this.prisma.cV.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: 'desc' },
      omit: { rawText: true },
      include: {
        parsedData: {
          omit: {
            cvId: true,
          }
        }
      }
    });
  }

  async getCVById(cvId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      include: {
        parsedData: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    return cv;
  }

  async getParsedData(cvId: string) {
    const cv = await this.getCVById(cvId);

    if (!cv.parsedData) {
      throw new NotFoundException('Không tìm thấy dữ liệu đã phân tích');
    }

    return cv.parsedData;
  }

  async confirmCV(cvId: string, candidateId: string, syncToProfile: boolean, markAsConfirmed: boolean) {
    const cv = await this.getCVById(cvId);

    if (cv.parsingStatus !== ParsingStatus.completed) {
      throw new BadRequestException('CV chưa được phân tích thành công');
    }

    if (!cv.parsedData) {
      throw new BadRequestException('Không tìm thấy dữ liệu đã phân tích cho CV này');
    }

    if (cv.parsedData.isConfirmed && !syncToProfile) {
      throw new BadRequestException('CV này đã được xác nhận');
    }

    const profileData: Record<string, unknown> = {
      summary: cv.parsedData.summary,
      location: cv.parsedData.location,
      experience: cv.parsedData.experience as Prisma.InputJsonValue,
      education: cv.parsedData.education as Prisma.InputJsonValue,
      skills: cv.parsedData.skills as Prisma.InputJsonValue,
      source_cv_id: cv.cvId,
      last_updated_from_cv: new Date().toISOString(),
    };

    let message: string;

    if (syncToProfile && markAsConfirmed) {
      await this.candidatesService.updateProfileData(candidateId, profileData);

      await this.prisma.cVParsedData.update({
        where: { cvId: cv.cvId },
        data: { isConfirmed: true },
      });

      message = 'Xác nhận CV và cập nhật hồ sơ ứng viên thành công';
    } else if (syncToProfile) {
      await this.candidatesService.updateProfileData(candidateId, profileData);
      message = 'Cập nhật hồ sơ ứng viên thành công';
    } else if (markAsConfirmed) {
      await this.prisma.cVParsedData.update({
        where: { cvId: cv.cvId },
        data: { isConfirmed: true },
      });
      message = 'Xác nhận CV thành công';
    }

    return {
      message: message,
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
      throw new NotFoundException('Không tìm thấy CV');
    }

    if (cv.candidateId !== candidateId) {
      throw new ForbiddenException('Bạn không có quyền xóa CV này');
    }

    if (cv._count.applications > 0) {
      throw new BadRequestException('Không thể xóa CV đang được dùng trong một đơn ứng tuyển');
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
      message: 'Xóa CV thành công',
    };
  }

  async downloadCV(cvId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, filePath: true, candidateId: true },
    });

    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    const absolutePath = path.isAbsolute(cv.filePath)
      ? cv.filePath
      : path.join(process.cwd(), cv.filePath);

    console.log(absolutePath);

    console.log(cv.filePath);


    const fileName = path.basename(cv.filePath);

    return { absolutePath, fileName, cvId: cv.cvId };
  }
}
