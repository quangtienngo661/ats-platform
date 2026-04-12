import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus, ParsingStatus, ScreeningStatus } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto, GetApplicationsByJobQueryDto, UpdateApplicationStatusDto } from './dtos/application.dto';
import { applicationIncludeOptions } from '../../common/utils/include-options.util';
import { CvScreeningsService } from '../cv-screenings/cv-screenings.service';

// Valid Kanban transitions — terminal states (hired/rejected) have no outgoing transitions
// Need to review the basic knowledge: Partial, Record
const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
    [ApplicationStatus.applied]: [ApplicationStatus.screening, ApplicationStatus.rejected],
    [ApplicationStatus.screening]: [ApplicationStatus.interview, ApplicationStatus.rejected],
    [ApplicationStatus.interview]: [ApplicationStatus.offer, ApplicationStatus.rejected],
    [ApplicationStatus.offer]: [ApplicationStatus.hired, ApplicationStatus.rejected],
};


@Injectable()
export class ApplicationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cvScreeningsService: CvScreeningsService
    ) { }
    async apply(userId: string, dto: CreateApplicationDto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Candidate profile not found');

        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId: dto.jobId },
            select: { jobId: true, status: true },
        });
        if (!job) throw new NotFoundException('Job posting not found');
        if (job.status !== JobStatus.active) {
            throw new BadRequestException('This job posting is not accepting applications');
        }

        const cv = await this.prisma.cV.findUnique({
            where: { cvId: dto.cvId },
            include: { parsedData: { select: { isConfirmed: true } } },
        });
        if (!cv) throw new NotFoundException('CV not found');
        if (cv.candidateId !== candidate.candidateId) {
            throw new ForbiddenException('This CV does not belong to you');
        }
        if (cv.parsingStatus !== ParsingStatus.success) {
            throw new BadRequestException('Your CV must be successfully parsed before applying');
        }
        if (!cv.parsedData?.isConfirmed) {
            throw new BadRequestException('You must confirm your CV profile before applying');
        }

        const existing = await this.prisma.application.findUnique({
            where: { jobId_candidateId: { jobId: dto.jobId, candidateId: candidate.candidateId } },
        });
        if (existing) throw new ConflictException('You have already applied to this job');

        return this.prisma.$transaction(async (tx) => {
            const application = await tx.application.create({
                data: { jobId: dto.jobId, candidateId: candidate.candidateId, cvId: dto.cvId },
                include: applicationIncludeOptions,
            });

            await tx.applicationHistory.create({
                data: {
                    applicationId: application.applicationId,
                    fromStatus: null,
                    toStatus: ApplicationStatus.applied,
                    changedBy: userId,
                },
            });

            return application;
        });
    }

    async getMyApplications(userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Candidate profile not found');

        return this.prisma.application.findMany({
            where: { candidateId: candidate.candidateId },
            include: {
                jobPosting: {
                    select: { jobId: true, title: true, locationType: true, status: true },
                },
                cv: { select: { cvId: true, parsingStatus: true, uploadedAt: true } },
                screening: {
                    select: { screeningId: true, status: true, overallScore: true, aiRecommendation: true },
                },
                history: { orderBy: { changedAt: 'desc' }, take: 1 },
            },
            orderBy: { appliedAt: 'desc' },
        });
    }

    async withdraw(applicationId: string, userId: string) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { userId },
            select: { candidateId: true },
        });
        if (!candidate) throw new NotFoundException('Candidate profile not found');

        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true, candidateId: true, status: true },
        });
        if (!application) throw new NotFoundException('Application not found');
        if (application.candidateId !== candidate.candidateId) {
            throw new ForbiddenException('You do not have permission to withdraw this application');
        }
        if (application.status !== ApplicationStatus.applied) {
            throw new BadRequestException(
                `Applications can only be withdrawn during the 'applied' stage. Current stage: '${application.status}'`,
            );
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.application.update({
                where: { applicationId },
                data: { status: ApplicationStatus.cancelled, currentStageSince: new Date() },
            });

            await tx.applicationHistory.create({
                data: {
                    applicationId,
                    fromStatus: ApplicationStatus.applied,
                    toStatus: ApplicationStatus.cancelled,
                    changedBy: userId,
                    notes: 'Candidate withdrew their application',
                },
            });
        });

        return { message: 'Application withdrawn successfully' };
    }

    async getKanbanBoard(jobId: string) {
        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId },
            select: { jobId: true, title: true, status: true, locationType: true },
        });
        if (!job) throw new NotFoundException('Job posting not found');

        const applications = await this.prisma.application.findMany({
            // Exclude cancelled from active board — HR views cancelled separately via getApplicationsByJob
            where: { jobId, status: { not: ApplicationStatus.cancelled } },
            include: applicationIncludeOptions,
            orderBy: { currentStageSince: 'asc' },
        });

        // Active Kanban columns only (cancelled is intentionally excluded from the board)
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

        // Count cancelled separately for HR awareness
        const cancelledCount = await this.prisma.application.count({
            where: { jobId, status: ApplicationStatus.cancelled },
        });

        return { job, board, cancelledCount };
    }

    async getApplicationsByJob(jobId: string, query: GetApplicationsByJobQueryDto = {}) {
        const job = await this.prisma.jobPosting.findUnique({
            where: { jobId },
            select: { jobId: true },
        });
        if (!job) throw new NotFoundException('Job posting not found');

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

    async getApplicationById(applicationId: string) {
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
        if (!application) throw new NotFoundException('Application not found');
        return application;
    }

    async updateStatus(applicationId: string, userId: string, dto: UpdateApplicationStatusDto) {
        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true, status: true },
        });
        if (!application) throw new NotFoundException('Application not found');

        const allowedNext = VALID_TRANSITIONS[application.status] ?? [];
        if (!allowedNext.includes(dto.status)) {
            throw new BadRequestException(
                `Cannot transition from '${application.status}' to '${dto.status}'. ` +
                `Allowed: [${allowedNext.join(', ') || 'none — terminal status'}]`,
            );
        }

        return this.prisma.$transaction(async (tx) => {
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

    async getApplicationHistory(applicationId: string) {
        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: { applicationId: true },
        });
        if (!application) throw new NotFoundException('Application not found');

        return this.prisma.applicationHistory.findMany({
            where: { applicationId },
            include: {
                user: { select: { userId: true, fullName: true, role: true } },
            },
            orderBy: { changedAt: 'desc' },
        });
    }

    // Confirmation when the HR need to trigger AI screening manually
    async triggerScreening(applicationId: string) {
        const application = await this.prisma.application.findUnique({
            where: { applicationId },
            select: {
                applicationId: true,
                status: true,
                cvId: true,
                screening: { select: { screeningId: true, status: true } },
            },
        });
        if (!application) throw new NotFoundException('Application not found');

        if (application.status === ApplicationStatus.applied) {
            throw new BadRequestException(
                `Move the application to 'screening' stage before triggering AI screening`,
            );
        }
        if (
            application.status === ApplicationStatus.hired ||
            application.status === ApplicationStatus.rejected
        ) {
            throw new BadRequestException(
                `Cannot trigger AI screening on a '${application.status}' application`,
            );
        }
        if (application.screening && application.screening.status) {
            if (application.screening.status === ScreeningStatus.pending) {
                throw new ConflictException('AI screening is already queued');
            }
            if (application.screening.status === ScreeningStatus.processing) {
                throw new ConflictException('AI screening is already in progress');
            }
            if (application.screening.status === ScreeningStatus.success) {
                throw new ConflictException('AI screening has already completed. Check results in application detail');
            }
            // status === 'failed' → allow retry
        }

        const aiConfig = await this.prisma.aiConfig.findFirst({
            where: { isDefault: true },
            select: { configId: true },
        });
        
        // Pass aiConfig?.configId so CvScreeningsService knows which one to use if found, 
        // else CvScreeningsService has its own getActiveConfig logic fallback.
        return this.cvScreeningsService.createScreeningRecord(application.applicationId, application.cvId, aiConfig?.configId);
    }
}
