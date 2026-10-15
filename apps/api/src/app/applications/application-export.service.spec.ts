import { UserRole } from '@ats-platform/database';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { callerOf, createPrismaMock } from '../../test-utils/unit-test-helpers';
import {
  ApplicationExportService,
  EXPORT_HEADERS,
  EXPORT_ROW_LIMIT,
} from './application-export.service';

const caller = callerOf(UserRole.recruiter);
const job = {
  jobId: '123e4567-e89b-42d3-a456-426614174000',
  departmentId: 'dep-1',
  organizationId: 'org-1',
};
const application = {
  applicationId: 'app-1',
  status: 'screening',
  appliedAt: new Date('2026-10-13T02:05:00.000Z'),
  candidate: {
    currentTitle: 'Backend Developer',
    yearsOfExperience: 4,
    user: { fullName: 'Nguyễn An' },
  },
  screening: {
    status: 'completed',
    overallScore: 82.5,
    skillsScore: '80',
    experienceScore: 75,
    educationScore: '90',
    aiRecommendation: 'interview',
    matchedSkills: { hardSkills: ['NestJS', 'SQL'] },
    missingSkills: ['Docker'],
  },
};

// These fixtures have no embedded record separators; toCsv quotes every cell.
const parseCsvRecords = (content: string): string[][] =>
  content
    .replace(/^\uFEFF/, '')
    .split('\r\n')
    .filter((record) => record.length > 0)
    .map((record) =>
      record
        .slice(1, -1)
        .split('","')
        .map((cell) => cell.replace(/""/g, '"')),
    );

describe('ApplicationExportService', () => {
  let service: ApplicationExportService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let applicationsService: { assertCanAccessDepartment: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.jobPosting.findUnique.mockResolvedValue(job);
    prisma.application.count.mockResolvedValue(1);
    prisma.application.findMany.mockResolvedValue([application]);
    applicationsService = {
      assertCanAccessDepartment: jest.fn().mockResolvedValue(undefined),
    };
    service = new ApplicationExportService(
      prisma as any,
      applicationsService as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes EXPORT_HEADERS as the first record', async () => {
    const { content } = await service.exportJobCsv(caller, job.jobId);

    expect(EXPORT_HEADERS).toEqual([
      'Mã đơn',
      'Họ tên',
      'Trạng thái',
      'Ngày nộp',
      'Chức danh hiện tại',
      'Số năm kinh nghiệm',
      'Trạng thái sàng lọc',
      'Điểm tổng (gợi ý AI)',
      'Điểm kỹ năng',
      'Điểm kinh nghiệm',
      'Điểm học vấn',
      'Gợi ý AI',
      'Kỹ năng khớp',
      'Kỹ năng thiếu',
    ]);
    expect(parseCsvRecords(content)[0]).toEqual(EXPORT_HEADERS);
    expect(content.replace(/^\uFEFF/, '').split('\r\n')[0]).toBe(
      EXPORT_HEADERS.map((header) => `"${header}"`).join(','),
    );
  });

  it('selects no contact field at any depth', async () => {
    await service.exportJobCsv(caller, job.jobId);

    const query = prisma.application.findMany.mock.calls[0][0];
    const serializedQuery = JSON.stringify(query);
    expect(serializedQuery).not.toContain('email');
    expect(serializedQuery).not.toContain('phoneNumber');
    expect(serializedQuery).not.toContain('include');
    expect(query.select).toEqual({
      applicationId: true,
      status: true,
      appliedAt: true,
      candidate: {
        select: {
          currentTitle: true,
          yearsOfExperience: true,
          user: { select: { fullName: true } },
        },
      },
      screening: {
        select: {
          status: true,
          overallScore: true,
          skillsScore: true,
          experienceScore: true,
          educationScore: true,
          aiRecommendation: true,
          matchedSkills: true,
          missingSkills: true,
        },
      },
    });
  });

  it('excludes cancelled and orders newest first', async () => {
    await service.exportJobCsv(caller, job.jobId);

    const where = { jobId: job.jobId, status: { not: 'cancelled' } };
    expect(prisma.jobPosting.findUnique).toHaveBeenCalledWith({
      where: { jobId: job.jobId },
      select: { jobId: true, departmentId: true, organizationId: true },
    });
    expect(applicationsService.assertCanAccessDepartment).toHaveBeenCalledWith(
      caller,
      job,
    );
    expect(prisma.application.count).toHaveBeenCalledWith({ where });
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, orderBy: { appliedAt: 'desc' } }),
    );
    expect(prisma.jobPosting.findUnique.mock.invocationCallOrder[0]).toBeLessThan(
      applicationsService.assertCanAccessDepartment.mock.invocationCallOrder[0],
    );
    expect(
      applicationsService.assertCanAccessDepartment.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.application.count.mock.invocationCallOrder[0]);
    expect(prisma.application.count.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.application.findMany.mock.invocationCallOrder[0],
    );
  });

  it('maps labels, Vietnam time, scores and skills', async () => {
    const { content } = await service.exportJobCsv(caller, job.jobId);

    expect(parseCsvRecords(content)[1]).toEqual([
      'app-1',
      'Nguyễn An',
      'Sàng lọc',
      '2026-10-13 09:05',
      'Backend Developer',
      '4',
      'Hoàn tất',
      '82.5',
      '80.0',
      '75.0',
      '90.0',
      'Nên phỏng vấn',
      'NestJS; SQL',
      'Docker',
    ]);

    for (const [status, label] of [
      ['applied', 'Mới'],
      ['screening', 'Sàng lọc'],
      ['interview', 'Phỏng vấn'],
      ['offer', 'Offer'],
      ['hired', 'Đã tuyển'],
      ['rejected', 'Từ chối'],
    ]) {
      prisma.application.findMany.mockResolvedValue([{ ...application, status }]);
      const result = await service.exportJobCsv(caller, job.jobId);
      expect(parseCsvRecords(result.content)[1][2]).toBe(label);
    }

    for (const [status, label] of [
      ['pending', 'Đang chờ'],
      ['processing', 'Đang xử lý'],
      ['completed', 'Hoàn tất'],
      ['failed', 'Lỗi'],
    ]) {
      prisma.application.findMany.mockResolvedValue([
        { ...application, screening: { ...application.screening, status } },
      ]);
      const result = await service.exportJobCsv(caller, job.jobId);
      expect(parseCsvRecords(result.content)[1][6]).toBe(label);
    }

    prisma.application.findMany.mockResolvedValue([
      {
        ...application,
        screening: {
          ...application.screening,
          aiRecommendation: 'reject',
          matchedSkills: { hardSkills: 'NestJS' },
          missingSkills: { skills: ['Docker'] },
        },
      },
    ]);
    const result = await service.exportJobCsv(caller, job.jobId);
    expect(parseCsvRecords(result.content)[1].slice(11)).toEqual([
      'Không phù hợp',
      '',
      '',
    ]);
  });

  it('leaves the AI columns empty and says Chưa chấm without a screening', async () => {
    prisma.application.findMany.mockResolvedValue([
      { ...application, screening: null },
    ]);

    const { content } = await service.exportJobCsv(caller, job.jobId);
    const row = parseCsvRecords(content)[1];

    expect(row[6]).toBe('Chưa chấm');
    expect(row.slice(7)).toEqual(['', '', '', '', '', '', '']);
  });

  it('writes only the header record for a job without applications', async () => {
    prisma.application.count.mockResolvedValue(0);
    prisma.application.findMany.mockResolvedValue([]);

    const { content } = await service.exportJobCsv(caller, job.jobId);

    expect(parseCsvRecords(content)).toEqual([EXPORT_HEADERS]);
    expect(content).toBe(
      `\uFEFF${EXPORT_HEADERS.map((header) => `"${header}"`).join(',')}\r\n`,
    );
  });

  it('refuses more than 5000 with 400 before reading rows', async () => {
    expect(EXPORT_ROW_LIMIT).toBe(5000);
    prisma.application.count.mockResolvedValue(5001);

    const result = service.exportJobCsv(caller, job.jobId);

    await expect(result).rejects.toBeInstanceOf(BadRequestException);
    await expect(result).rejects.toMatchObject({
      status: 400,
      message: 'Tin có quá nhiều đơn để xuất CSV (tối đa 5000)',
    });
    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown job and lets the 403 through', async () => {
    prisma.jobPosting.findUnique.mockResolvedValue(null);

    const unknownJob = service.exportJobCsv(caller, job.jobId);

    await expect(unknownJob).rejects.toBeInstanceOf(NotFoundException);
    await expect(unknownJob).rejects.toMatchObject({
      status: 404,
      message: 'Không tìm thấy tin tuyển dụng',
    });
    expect(applicationsService.assertCanAccessDepartment).not.toHaveBeenCalled();
    expect(prisma.application.count).not.toHaveBeenCalled();
    expect(prisma.application.findMany).not.toHaveBeenCalled();

    prisma.jobPosting.findUnique.mockResolvedValue(job);
    const forbidden = new ForbiddenException('Không có quyền truy cập tin');
    applicationsService.assertCanAccessDepartment.mockRejectedValue(forbidden);

    await expect(service.exportJobCsv(caller, job.jobId)).rejects.toBe(forbidden);
    expect(forbidden.getStatus()).toBe(403);
    expect(applicationsService.assertCanAccessDepartment).toHaveBeenCalledWith(
      caller,
      job,
    );
    expect(prisma.application.count).not.toHaveBeenCalled();
    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });

  it('names the file from the job id and the Vietnam date', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-13T20:00:00.000Z'));

    const { filename } = await service.exportJobCsv(caller, job.jobId);

    expect(filename).toBe('ung-vien-123e4567-20261014.csv');
  });
});
