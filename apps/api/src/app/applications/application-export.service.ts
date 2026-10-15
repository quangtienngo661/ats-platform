import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AiRecommendation,
  ApplicationStatus,
  ScreeningStatus,
} from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { toCsv } from '../../common/utils/csv.util';
import { ApplicationsService } from './applications.service';

export const EXPORT_ROW_LIMIT = 5000;

export const EXPORT_HEADERS = [
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
] as const;

const applicationStatusLabels: Partial<Record<ApplicationStatus, string>> = {
  [ApplicationStatus.applied]: 'Mới',
  [ApplicationStatus.screening]: 'Sàng lọc',
  [ApplicationStatus.interview]: 'Phỏng vấn',
  [ApplicationStatus.offer]: 'Offer',
  [ApplicationStatus.hired]: 'Đã tuyển',
  [ApplicationStatus.rejected]: 'Từ chối',
};

const screeningStatusLabels: Record<ScreeningStatus, string> = {
  [ScreeningStatus.pending]: 'Đang chờ',
  [ScreeningStatus.processing]: 'Đang xử lý',
  [ScreeningStatus.completed]: 'Hoàn tất',
  [ScreeningStatus.failed]: 'Lỗi',
};

const recommendationLabels: Record<AiRecommendation, string> = {
  [AiRecommendation.interview]: 'Nên phỏng vấn',
  [AiRecommendation.reject]: 'Không phù hợp',
};

const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function vietnamDateParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    vietnamDateFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
}

function formatScore(value: unknown): string {
  return value === null || value === undefined ? '' : Number(value).toFixed(1);
}

function joinSkills(value: unknown): string {
  return Array.isArray(value) && value.every((skill) => typeof skill === 'string')
    ? value.join('; ')
    : '';
}

function formatMatchedSkills(value: unknown): string {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('hardSkills' in value)
  ) {
    return '';
  }

  return joinSkills(value.hardSkills);
}

@Injectable()
export class ApplicationExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async exportJobCsv(
    caller: TenantCaller,
    jobId: string,
  ): Promise<{ filename: string; content: string }> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      select: { jobId: true, departmentId: true, organizationId: true },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    await this.applicationsService.assertCanAccessDepartment(caller, job);

    const where = { jobId, status: { not: ApplicationStatus.cancelled } };
    const count = await this.prisma.application.count({ where });
    if (count > EXPORT_ROW_LIMIT) {
      throw new BadRequestException(
        'Tin có quá nhiều đơn để xuất CSV (tối đa 5000)',
      );
    }

    const applications = await this.prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      select: {
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
      },
    });

    const rows = applications.map((application) => {
      const { year, month, day, hour, minute } = vietnamDateParts(
        application.appliedAt,
      );
      const screening = application.screening;

      return [
        application.applicationId,
        application.candidate.user.fullName,
        applicationStatusLabels[application.status] ?? '',
        `${year}-${month}-${day} ${hour}:${minute}`,
        application.candidate.currentTitle,
        application.candidate.yearsOfExperience,
        screening ? screeningStatusLabels[screening.status] : 'Chưa chấm',
        formatScore(screening?.overallScore),
        formatScore(screening?.skillsScore),
        formatScore(screening?.experienceScore),
        formatScore(screening?.educationScore),
        screening?.aiRecommendation
          ? recommendationLabels[screening.aiRecommendation]
          : '',
        formatMatchedSkills(screening?.matchedSkills),
        joinSkills(screening?.missingSkills),
      ];
    });

    const { year, month, day } = vietnamDateParts(new Date());
    return {
      filename: `ung-vien-${jobId.slice(0, 8)}-${year}${month}${day}.csv`,
      content: toCsv(EXPORT_HEADERS, rows),
    };
  }
}
