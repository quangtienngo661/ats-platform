import { UserRole } from '@ats-platform/database';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import {
  ApplicationNotesService,
  type NoteView,
} from './application-notes.service';
import { NoteDto } from './dto/note.dto';

const applicationId = 'app-1';
const noteId = 'note-1';
const author = callerOf(UserRole.recruiter, { userId: 'author-1' });
const dto: NoteDto = { body: 'Ứng viên giải thích rõ kinh nghiệm làm việc' };
const application = {
  applicationId,
  organizationId: 'org-1',
  jobPosting: { departmentId: 'dep-1' },
};
const note: NoteView = {
  id: noteId,
  applicationId,
  body: dto.body,
  createdAt: new Date('2026-10-14T03:00:00.000Z'),
  updatedAt: new Date('2026-10-14T03:00:00.000Z'),
  author: { userId: author.userId, fullName: 'Nguyễn An' },
};
const noteRecord = {
  ...note,
  organizationId: application.organizationId,
  authorId: author.userId,
};

describe('ApplicationNotesService', () => {
  let service: ApplicationNotesService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let applicationsService: { assertCanAccessApplication: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    applicationsService = { assertCanAccessApplication: jest.fn().mockResolvedValue(undefined) };
    prisma.application.findUnique.mockResolvedValue(application);
    prisma.applicationNote.findUnique.mockResolvedValue(noteRecord);
    prisma.applicationNote.create.mockResolvedValue(note);
    prisma.applicationNote.findMany.mockResolvedValue([note]);
    prisma.applicationNote.count.mockResolvedValue(1);
    prisma.applicationNote.update.mockResolvedValue(note);
    prisma.applicationNote.delete.mockResolvedValue(noteRecord);
    service = new ApplicationNotesService(prisma as any, applicationsService as any);
  });

  it('creates a note with the organization of the application', async () => {
    const payload = { ...dto, organizationId: 'org-from-client' };

    await expect(service.create(author, applicationId, payload)).resolves.toEqual(note);

    expect(prisma.application.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { applicationId } }),
    );
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(author, applicationId);
    expect(prisma.applicationNote.create).toHaveBeenCalledTimes(1);
    expect(prisma.applicationNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId,
          organizationId: application.organizationId,
          authorId: author.userId,
          body: dto.body,
        }),
      }),
    );
    const args = prisma.applicationNote.create.mock.calls[0][0];
    expect(args.data.organizationId).not.toBe(payload.organizationId);
  });

  it('lists newest first with pagination', async () => {
    const olderNote: NoteView = {
      ...note,
      id: 'note-2',
      createdAt: new Date('2026-10-13T03:00:00.000Z'),
      updatedAt: new Date('2026-10-13T03:00:00.000Z'),
    };
    prisma.applicationNote.findMany.mockResolvedValue([note, olderNote]);
    prisma.applicationNote.count.mockResolvedValue(11);

    await expect(service.list(author, applicationId, { page: 2, limit: 5 })).resolves.toEqual({
      items: [note, olderNote],
      pagination: { page: 2, limit: 5, total: 11, totalPages: 3 },
    });
    expect(prisma.applicationNote.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ applicationId }),
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      }),
    );
    expect(prisma.applicationNote.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ applicationId }) }),
    );

    await expect(service.list(author, applicationId, {})).resolves.toEqual({
      items: [note, olderNote],
      pagination: { page: 1, limit: 20, total: 11, totalPages: 1 },
    });
    expect(prisma.applicationNote.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ applicationId }),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      }),
    );
    expect(prisma.applicationNote.count).toHaveBeenCalledTimes(2);
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(author, applicationId);
  });

  it('lets only the author edit', async () => {
    const revisedDto: NoteDto = { body: 'Bổ sung nhận xét về ứng viên' };
    const revisedNote = { ...note, body: revisedDto.body };
    prisma.applicationNote.update.mockResolvedValue(revisedNote);

    for (const role of [UserRole.recruiter, UserRole.org_admin]) {
      const otherStaff = callerOf(role, { userId: 'other-staff-1' });
      const call = service.update(otherStaff, noteId, revisedDto);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Chỉ tác giả được sửa hoặc xoá ghi chú',
      });
    }
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();

    await expect(service.update(author, noteId, revisedDto)).resolves.toEqual(revisedNote);
    expect(prisma.applicationNote.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: noteId } }),
    );
    expect(prisma.applicationNote.update).toHaveBeenCalledTimes(1);
    expect(prisma.applicationNote.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: noteId }, data: { body: revisedDto.body } }),
    );
  });

  it('lets only the author delete', async () => {
    for (const role of [UserRole.recruiter, UserRole.org_admin]) {
      const otherStaff = callerOf(role, { userId: 'other-staff-1' });
      const call = service.remove(otherStaff, noteId);

      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Chỉ tác giả được sửa hoặc xoá ghi chú',
      });
    }
    expect(prisma.applicationNote.delete).not.toHaveBeenCalled();

    await expect(service.remove(author, noteId)).resolves.toEqual({ id: noteId });
    expect(prisma.applicationNote.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: noteId } }),
    );
    expect(prisma.applicationNote.delete).toHaveBeenCalledTimes(1);
    expect(prisma.applicationNote.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: noteId } }),
    );
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();
  });

  it('refuses a platform admin to write', async () => {
    const platformAdmin = callerOf(UserRole.admin, { userId: 'admin-1' });

    for (const request of [
      () => service.create(platformAdmin, applicationId, dto),
      () => service.update(platformAdmin, noteId, dto),
      () => service.remove(platformAdmin, noteId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Quản trị viên nền tảng chỉ được đọc ghi chú',
      });
    }
    expect(prisma.applicationNote.create).not.toHaveBeenCalled();
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();
    expect(prisma.applicationNote.delete).not.toHaveBeenCalled();
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();

    await expect(service.list(platformAdmin, applicationId, {})).resolves.toEqual({
      items: [note],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(platformAdmin, applicationId);
  });

  it('answers 404 for a note of another organization', async () => {
    // The organization boundary must run before the author check.
    prisma.applicationNote.findUnique.mockResolvedValue({
      ...noteRecord,
      organizationId: 'org-2',
      authorId: 'someone-else',
    });

    for (const request of [
      () => service.update(author, noteId, dto),
      () => service.remove(author, noteId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy ghi chú',
      });
    }
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();
    expect(prisma.applicationNote.delete).not.toHaveBeenCalled();
  });

  it('answers 404 for an application of another organization', async () => {
    prisma.application.findUnique.mockResolvedValue({ ...application, organizationId: 'org-2' });

    for (const request of [
      () => service.create(author, applicationId, dto),
      () => service.list(author, applicationId, {}),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy đơn ứng tuyển',
      });
    }
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
    expect(prisma.applicationNote.create).not.toHaveBeenCalled();
    expect(prisma.applicationNote.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });

  it('refuses a recruiter of another department', async () => {
    const otherDepartmentRecruiter = callerOf(UserRole.recruiter, {
      userId: 'recruiter-dep-2',
    });
    applicationsService.assertCanAccessApplication.mockRejectedValue(
      new ForbiddenException('Bạn không có quyền truy cập phòng ban này'),
    );

    for (const request of [
      () => service.create(otherDepartmentRecruiter, applicationId, dto),
      () => service.list(otherDepartmentRecruiter, applicationId, {}),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({ status: 403 });
    }
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledTimes(2);
    expect(applicationsService.assertCanAccessApplication).toHaveBeenCalledWith(
      otherDepartmentRecruiter,
      applicationId,
    );
    expect(prisma.applicationNote.create).not.toHaveBeenCalled();
    expect(prisma.applicationNote.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
  });

  it('answers 404 when the note was deleted meanwhile', async () => {
    prisma.applicationNote.findUnique.mockResolvedValue(null);

    for (const request of [
      () => service.update(author, noteId, dto),
      () => service.remove(author, noteId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy ghi chú',
      });
    }
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();
    expect(prisma.applicationNote.delete).not.toHaveBeenCalled();

    prisma.applicationNote.findUnique.mockResolvedValue(noteRecord);
    prisma.applicationNote.update.mockRejectedValue({ code: 'P2025' });
    prisma.applicationNote.delete.mockRejectedValue({ code: 'P2025' });

    for (const request of [
      () => service.update(author, noteId, dto),
      () => service.remove(author, noteId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(NotFoundException);
      await expect(call).rejects.toMatchObject({
        status: 404,
        message: 'Không tìm thấy ghi chú',
      });
    }
    expect(prisma.applicationNote.update).toHaveBeenCalledTimes(1);
    expect(prisma.applicationNote.delete).toHaveBeenCalledTimes(1);
  });

  it('refuses a candidate', async () => {
    const candidate = callerOf(UserRole.candidate, { userId: author.userId });

    for (const request of [
      () => service.create(candidate, applicationId, dto),
      () => service.list(candidate, applicationId, {}),
      () => service.update(candidate, noteId, dto),
      () => service.remove(candidate, noteId),
    ]) {
      const call = request();
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call).rejects.toMatchObject({
        status: 403,
        message: 'Bạn không có quyền truy cập tài nguyên này',
      });
    }
    expect(applicationsService.assertCanAccessApplication).not.toHaveBeenCalled();
    expect(prisma.applicationNote.create).not.toHaveBeenCalled();
    expect(prisma.applicationNote.findMany).not.toHaveBeenCalled();
    expect(prisma.applicationNote.count).not.toHaveBeenCalled();
    expect(prisma.applicationNote.update).not.toHaveBeenCalled();
    expect(prisma.applicationNote.delete).not.toHaveBeenCalled();
  });
});
