import { Prisma } from '@ats-platform/database';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertInCallerOrganizationOr404,
  isPlatformAdmin,
  TenantCaller,
} from '../../common/tenancy/tenant-caller';
import { ApplicationsService } from '../applications/applications.service';
import { ListNotesQueryDto, NoteDto } from './dto/note.dto';

export type NoteView = {
  id: string;
  applicationId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { userId: string; fullName: string };
};

const noteSelect = {
  id: true,
  applicationId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { userId: true, fullName: true } },
} satisfies Prisma.ApplicationNoteSelect;

@Injectable()
export class ApplicationNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async create(
    caller: TenantCaller,
    applicationId: string,
    dto: NoteDto,
  ): Promise<NoteView> {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { organizationId: true },
    });
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }
    assertInCallerOrganizationOr404(
      caller,
      application.organizationId,
      'Không tìm thấy đơn ứng tuyển',
    );
    if (isPlatformAdmin(caller.role)) {
      throw new ForbiddenException('Quản trị viên nền tảng chỉ được đọc ghi chú');
    }
    await this.applicationsService.assertCanAccessApplication(caller, applicationId);

    return this.prisma.applicationNote.create({
      data: {
        applicationId,
        organizationId: application.organizationId,
        authorId: caller.userId,
        body: dto.body,
      },
      select: noteSelect,
    });
  }

  async list(
    caller: TenantCaller,
    applicationId: string,
    query: ListNotesQueryDto,
  ): Promise<{
    items: NoteView[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { organizationId: true },
    });
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }
    assertInCallerOrganizationOr404(
      caller,
      application.organizationId,
      'Không tìm thấy đơn ứng tuyển',
    );
    await this.applicationsService.assertCanAccessApplication(caller, applicationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.applicationNote.findMany({
        where: { applicationId },
        select: noteSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.applicationNote.count({ where: { applicationId } }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(
    caller: TenantCaller,
    noteId: string,
    dto: NoteDto,
  ): Promise<NoteView> {
    await this.assertCanMutateNote(caller, noteId);

    try {
      return await this.prisma.applicationNote.update({
        where: { id: noteId },
        data: { body: dto.body },
        select: noteSelect,
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy ghi chú');
      }
      throw error;
    }
  }

  async remove(caller: TenantCaller, noteId: string): Promise<{ id: string }> {
    await this.assertCanMutateNote(caller, noteId);

    try {
      await this.prisma.applicationNote.delete({ where: { id: noteId } });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy ghi chú');
      }
      throw error;
    }
    return { id: noteId };
  }

  private async assertCanMutateNote(
    caller: TenantCaller,
    noteId: string,
  ): Promise<void> {
    const note = await this.prisma.applicationNote.findUnique({
      where: { id: noteId },
    });
    if (!note) {
      throw new NotFoundException('Không tìm thấy ghi chú');
    }
    assertInCallerOrganizationOr404(
      caller,
      note.organizationId,
      'Không tìm thấy ghi chú',
    );
    if (isPlatformAdmin(caller.role)) {
      throw new ForbiddenException('Quản trị viên nền tảng chỉ được đọc ghi chú');
    }
    if (note.authorId !== caller.userId) {
      throw new ForbiddenException('Chỉ tác giả được sửa hoặc xoá ghi chú');
    }
  }
}
