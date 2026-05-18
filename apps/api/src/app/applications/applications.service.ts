import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus, NotificationType, ParsingStatus, RelatedEntityType, ScreeningStatus, UserRole } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto, GetApplicationsByJobQueryDto, UpdateApplicationStatusDto } from './dtos/application.dto';
import { applicationIncludeOptions } from '../../common/utils/include-options.util';
import { CvScreeningsService } from '../cv-screenings/cv-screenings.service';
import { SocketIoService } from '../../common/socket-io/socket-io.service';
import { NotificationsService } from '../notifications/notifications.service';

const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
    [ApplicationStatus.applied]: [ApplicationStatus.screening, ApplicationStatus.rejected],
    [ApplicationStatus.screening]: [ApplicationStatus.interview, ApplicationStatus.rejected],
    [ApplicationStatus.interview]: [ApplicationStatus.offer, ApplicationStatus.rejected],
    [ApplicationStatus.offer]: [ApplicationStatus.hired, ApplicationStatus.rejected],
};

const NOTIFY_CANDIDATE_ON: ApplicationStatus[] = [
    ApplicationStatus.interview,
    ApplicationStatus.offer,
    ApplicationStatus.hired,
    ApplicationStatus.rejected,
];

const APPLICATION_STATUS_NOTIFICATION_COPY: Record<string, { title: string; message: string }> = {
    [ApplicationStatus.interview]: {
        title: 'Đơn ứng tuyển chuyển sang vòng phỏng vấn',
        message: 'Đơn ứng tuyển của bạn đã được chuyển sang vòng phỏng vấn.',
    },
    [ApplicationStatus.offer]: {
        title: 'Cập nhật đề nghị tuyển dụng',
        message: 'Đơn ứng tuyển của bạn đã được chuyển sang vòng đề nghị tuyển dụng.',
    },
    [ApplicationStatus.hired]: {
        title: 'Chúc mừng, bạn đã được tuyển',
        message: 'Chúc mừng, đơn ứng tuyển của bạn đã được chuyển sang trạng thái trúng tuyển.',
    },
    [ApplicationStatus.rejected]: {
        title: 'Đơn ứng tuyển đã bị từ chối',
        message: 'Rất tiếc, đơn ứng tuyển của bạn đã bị từ chối.',
    },
};


@Injectable()
export class ApplicationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cvScreeningsService: CvScreeningsService,
        private readonly socketIoService: SocketIoService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private async getRecruiterDepartmentId(userId: string) {
        const recruiter = await this.prisma.recruiter.findUnique({
            where: { userId },
            select: { departmentId: true },
        });

        if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
        return recruiter.departmentId;
    }

    private async assertCanAccessDepartment(userId: string, role: string, departmentId: string) {
        if (role === UserRole.admin) return;

        if (role !== UserRole.recruiter) {
            throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
        }

        const recruiterDepartmentId = await this.getRecruiterDepartmentId(userId);
        if (recruiterDepartmentId !== departmentId) {
            throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu tuyển dụng của khoa này');
        }
    }

    private async assertCanAccessApplication(userId: string, role: string, applicationId: string) {
        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: {
                applicationId: true,
                candidate: { select: { userId: true } },
                jobPosting: { select: { departmentId: true } },
            },
        });

        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

        if (role === UserRole.candidate) {
            if (application.candidate.userId !== userId) {
                throw new ForbiddenException('Bạn không phải chủ sở hữu đơn ứng tuyển này');
            }
            return;
        }

        await this.assertCanAccessDepartment(userId, role, application.jobPosting.departmentId);
    }

    async apply(userId: string, dto: CreateApplicationDto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId: dto.jobId },
            select: { jobId: true, status: true },
        });
        if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
        if (job.status !== JobStatus.active) {
            throw new BadRequestException('Tin tuyển dụng này hiện không nhận đơn ứng tuyển');
        }

        const cv = await this.prisma.cV.findUnique({
            where: { cvId: dto.cvId },
            include: { parsedData: { select: { isConfirmed: true } } },
        });
        if (!cv) throw new NotFoundException('Không tìm thấy CV');
        if (cv.candidateId !== candidate.candidateId) {
            throw new ForbiddenException('CV này không thuộc về bạn');
        }
        if (cv.parsingStatus !== ParsingStatus.completed) {
            throw new BadRequestException('CV của bạn cần được phân tích thành công trước khi ứng tuyển');
        }
        if (!cv.parsedData?.isConfirmed) {
            throw new BadRequestException('Bạn cần xác nhận hồ sơ CV trước khi ứng tuyển');
        }

        const existings = await this.prisma.application.findMany({
            where: { jobId: dto.jobId, candidateId: candidate.candidateId },
        });

        const isNotCancelled = existings.some(app => app.status !== ApplicationStatus.cancelled);
        if (isNotCancelled) {
            throw new ConflictException('Bạn đã ứng tuyển công việc này rồi');
        }

        return await this.prisma.$transaction(async (tx) => {
            const appliedApplication = await tx.application.create({
                data: { jobId: dto.jobId, candidateId: candidate.candidateId, cvId: dto.cvId },
                include: applicationIncludeOptions,
            });

            this.socketIoService.handleEmit(
                'application:application_created',
                appliedApplication,
                `job_${appliedApplication.jobId}`,
            );

            await tx.applicationHistory.create({
                data: {
                    applicationId: appliedApplication.applicationId,
                    fromStatus: null,
                    toStatus: ApplicationStatus.applied,
                    changedBy: userId,
                },
            });

            return appliedApplication;
        });

    }

    async getMyApplications(userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

        return await this.prisma.application.findMany({
            where: { candidateId: candidate.candidateId },
            include: applicationIncludeOptions,
            orderBy: { appliedAt: 'desc' },
        });
    }

    async withdraw(applicationId: string, userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true, candidateId: true, status: true },
        });
        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
        if (application.candidateId !== candidate.candidateId) {
            throw new ForbiddenException('Bạn không có quyền rút đơn ứng tuyển này');
        }
        if (application.status !== ApplicationStatus.applied) {
            throw new BadRequestException(
                `Chỉ có thể rút đơn khi đơn đang ở trạng thái 'applied'. Trạng thái hiện tại: '${application.status}'`,
            );
        }

        await this.prisma.$transaction(async (tx) => {
            const withdrawnApplication = await tx.application.update({
                where: { applicationId },
                data: { status: ApplicationStatus.cancelled, currentStageSince: new Date() },
                include: applicationIncludeOptions,
            });

            this.socketIoService.handleEmit(
                'application:application_withdrawn',
                withdrawnApplication,
                `job_${withdrawnApplication.jobId}`,
            );

            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: ApplicationStatus.applied,
                    toStatus: ApplicationStatus.cancelled,
                    changedBy: userId,
                    notes: 'Ứng viên đã rút đơn ứng tuyển',
                },
            });
        });

        return { message: 'Rút đơn ứng tuyển thành công' };
    }

    async getAllKanbanBoard(userId: string, role: string) {
        let whereCondition: any = { status: { not: ApplicationStatus.cancelled } };

        if (role === UserRole.recruiter) {
            const recruiter = await this.prisma.recruiter.findUnique({
                where: { userId }
            });
            if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
            whereCondition.jobPosting = { departmentId: recruiter.departmentId };
        }

        const applications = await this.prisma.application.findMany({
            where: whereCondition,
            include: applicationIncludeOptions,
            orderBy: { currentStageSince: 'asc' },
        });

        const activeStatuses = [
            ApplicationStatus.applied,
            ApplicationStatus.screening,
            ApplicationStatus.interview,
            ApplicationStatus.offer,
            ApplicationStatus.hired,
            ApplicationStatus.rejected,
        ] as const;

        const board = activeStatuses.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<typeof activeStatuses[number], typeof applications>);

        for (const app of applications) {
            board[app.status as typeof activeStatuses[number]].push(app);
        }

        return board;
    }

    async getKanbanBoard(userId: string, role: string, jobId: string) {
        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId },
            select: { jobId: true, title: true, status: true, locationType: true, departmentId: true },
        });
        if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
        await this.assertCanAccessDepartment(userId, role, job.departmentId);

        const applications = await this.prisma.application.findMany({

            where: { jobId, status: { not: ApplicationStatus.cancelled } },
            include: applicationIncludeOptions,
            orderBy: { currentStageSince: 'asc' },
        });

        const activeStatuses = [
            ApplicationStatus.applied,
            ApplicationStatus.screening,
            ApplicationStatus.interview,
            ApplicationStatus.offer,
            ApplicationStatus.hired,
            ApplicationStatus.rejected,
        ] as const;

        const board = activeStatuses.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<typeof activeStatuses[number], typeof applications>);

        for (const app of applications) {
            board[app.status as typeof activeStatuses[number]].push(app);
        }

        const cancelledCount = await this.prisma.application.count({
            where: { jobId, status: ApplicationStatus.cancelled },
        });

        return {
            job: {
                jobId: job.jobId,
                title: job.title,
                status: job.status,
                locationType: job.locationType,
            },
            board,
            cancelledCount,
        };
    }

    async getApplicationsByJob(userId: string, role: string, jobId: string, query: GetApplicationsByJobQueryDto = {}) {
        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId },
            select: { jobId: true, departmentId: true },
        });
        if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
        await this.assertCanAccessDepartment(userId, role, job.departmentId);

        const page = query.page ?? 1;
        const limit = query.limit ?? 50;

        const where = {
            jobId,
            ...(query.includeCancelled ? {} : { status: { not: ApplicationStatus.cancelled } }),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.application.findMany({
                where,
                include: applicationIncludeOptions,
                orderBy: { appliedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.application.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getApplicationById(applicationId: string, userId: string, role: string) {
        await this.assertCanAccessApplication(userId, role, applicationId);

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            include: {
                ...applicationIncludeOptions,
                history: {
                    include: {
                        user: { select: { userId: true, fullName: true, role: true } },
                    },
                    orderBy: { changedAt: 'desc' },
                },
            },
        });
        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
        return application;
    }

    async updateStatus(applicationId: string, userId: string, role: string, dto: UpdateApplicationStatusDto) {
        await this.assertCanAccessApplication(userId, role, applicationId);

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true, status: true },
        });
        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

        if (dto.isReverted) {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.application.update({
                    where: { applicationId },
                    data: { status: dto.status, currentStageSince: new Date() },
                    include: applicationIncludeOptions,
                });

                await tx.applicationHistory.create({
                    data: {
                        applicationId,
                        fromStatus: application.status,
                        toStatus: dto.status,
                        changedBy: userId,
                        notes: dto.notes,
                        rejectionReason: dto.rejectionReason,
                    },
                });

                return updated;
            });
        }

        const allowedNext = VALID_TRANSITIONS[application.status] ?? [];
        if (!allowedNext.includes(dto.status)) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ '${application.status}' sang '${dto.status}'. ` +
                `Các trạng thái hợp lệ: [${allowedNext.join(', ') || 'không có - đây là trạng thái cuối'}]`,
            );
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.application.update({
                where: { applicationId },
                data: { status: dto.status, currentStageSince: new Date() },
                include: applicationIncludeOptions,
            });

            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: application.status,
                    toStatus: dto.status,
                    changedBy: userId,
                    notes: dto.notes,
                    rejectionReason: dto.rejectionReason,
                },
            });

            return updated;
        });

        await this.notifyCandidateStatusChangeSafe(updated);

        return updated;
    }

    async getApplicationHistory(applicationId: string, userId: string, role: string) {
        await this.assertCanAccessApplication(userId, role, applicationId);

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true },
        });
        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

        return await this.prisma.applicationHistory.findMany({
            where: { applicationId },
            include: {
                user: { select: { userId: true, fullName: true, role: true } },
            },
            orderBy: { changedAt: 'desc' },
        });
    }

    async triggerScreening(applicationId: string, userId: string, role: string, configId?: string) {
        await this.assertCanAccessApplication(userId, role, applicationId);

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: {
                applicationId: true,
                status: true,
                cvId: true,
                screening: { select: { screeningId: true, status: true } },
            },
        });
        if (!application) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

        if (application.status === ApplicationStatus.applied) {
            throw new BadRequestException(
                `Hãy chuyển đơn ứng tuyển sang trạng thái 'screening' trước khi chạy sàng lọc AI`,
            );
        }
        if (
            application.status === ApplicationStatus.hired ||
            application.status === ApplicationStatus.rejected
        ) {
            throw new BadRequestException(
                `Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái '${application.status}'`,
            );
        }
        if (application.screening && application.screening.status) {
            if (application.screening.status === ScreeningStatus.pending) {
                throw new ConflictException('Sàng lọc AI đã được đưa vào hàng đợi');
            }
            if (application.screening.status === ScreeningStatus.processing) {
                throw new ConflictException('Sàng lọc AI đang được xử lý');
            }
            if (application.screening.status === ScreeningStatus.completed) {
                throw new ConflictException('Sàng lọc AI đã hoàn tất. Vui lòng xem kết quả trong chi tiết đơn ứng tuyển');
            }

        }

        let aiConfig;
        if (configId) {
            aiConfig = await this.prisma.aiConfig.findUnique({
                where: { configId },
                select: { configId: true },
            });
            if (!aiConfig) throw new NotFoundException('Không tìm thấy cấu hình AI');
        } else {
            aiConfig = await this.prisma.aiConfig.findFirst({
                where: { isDefault: true },
                select: { configId: true },
            });
        }

        return this.cvScreeningsService.createScreeningRecord(application.applicationId, application.cvId, aiConfig?.configId);
    }

    private async notifyCandidateStatusChangeSafe(application: any) {
        if (!NOTIFY_CANDIDATE_ON.includes(application.status)) return;

        const userId = application.candidate?.user?.userId;
        if (!userId) return;

        const copy = APPLICATION_STATUS_NOTIFICATION_COPY[application.status];
        if (!copy) return;

        try {
            await this.notificationsService.create({
                userId,
                type: NotificationType.application,
                title: copy.title,
                message: copy.message,
                relatedEntityId: application.applicationId,
                relatedEntityType: RelatedEntityType.application,
            });
        } catch (error) {

            Logger.warn(
                `Failed to notify candidate ${userId} for application ${application.applicationId}: ${error.message}`,
                'ApplicationsService',
            );
        }
    }
}
