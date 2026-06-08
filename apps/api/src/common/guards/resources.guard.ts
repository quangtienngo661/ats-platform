import { ApplicationStatus, UserRole } from '@ats-platform/database';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RESOURCES_KEY } from '../decorators/resources.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext) {
        const resource = this.reflector.getAllAndOverride<string>(RESOURCES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!resource) return true;

        const { user, params } = context.switchToHttp().getRequest();
        const resourceId = params.id ?? params.cvId ?? params.jobId ?? params.jobPostingId;
        const userId = user.userId;

        if (!resourceId) return true;
        if (user.role === UserRole.admin) return true;

        switch (resource) {
            case 'job-posting': {
                const jobPosting = await this.prisma.jobPosting.findUnique({
                    where: { jobId: resourceId },
                    select: {
                        recruiter: {
                            select: { userId: true },
                        },
                    },
                });

                if (!jobPosting) {
                    throw new NotFoundException('Không tìm thấy tin tuyển dụng');
                }

                if (jobPosting.recruiter.userId !== userId) {
                    throw new ForbiddenException('Bạn không phải chủ sở hữu tin tuyển dụng này');
                }

                return true;
            }

            case 'cv': {
                const cv = await this.prisma.cV.findUnique({
                    where: { cvId: resourceId },
                    select: {
                        candidate: { select: { userId: true } },
                        applications: {
                            where: { status: { not: ApplicationStatus.cancelled } },
                            select: {
                                jobPosting: { select: { departmentId: true } },
                            },
                        },
                    },
                });

                if (!cv) {
                    throw new NotFoundException('Không tìm thấy CV');
                }

                if (user.role === UserRole.candidate) {
                    if (cv.candidate.userId !== userId) {
                        throw new ForbiddenException('Bạn không phải chủ sở hữu CV này');
                    }
                    return true;
                }

                if (user.role === UserRole.recruiter) {
                    const recruiter = await this.prisma.recruiter.findUnique({
                        where: { userId },
                        select: { departmentId: true },
                    });

                    const canAccess = recruiter
                        ? cv.applications.some((application) => (
                            application.jobPosting.departmentId === recruiter.departmentId
                        ))
                        : false;

                    if (canAccess) return true;
                }

                throw new ForbiddenException('Bạn không có quyền truy cập CV này');
            }

            case 'application': {
                const application = await this.prisma.application.findUnique({
                    where: { applicationId: resourceId },
                    select: {
                        candidate: { select: { userId: true } },
                        jobPosting: { select: { departmentId: true } },
                    },
                });

                if (!application) {
                    throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
                }

                if (user.role === UserRole.recruiter) {
                    const recruiter = await this.prisma.recruiter.findUnique({
                        where: { userId },
                        select: { departmentId: true },
                    });

                    if (!recruiter || recruiter.departmentId !== application.jobPosting.departmentId) {
                        throw new ForbiddenException('Bạn không có quyền truy cập đơn ứng tuyển của khoa này');
                    }
                    return true;
                }

                if (!application.candidate || application.candidate.userId !== userId) {
                    throw new ForbiddenException('Bạn không phải chủ sở hữu đơn ứng tuyển này');
                }

                return true;
            }

            case 'interview-schedule': {
                const schedule = await this.prisma.interviewSchedule.findUnique({
                    where: { interviewId: resourceId },
                    select: { scheduledBy: true },
                });

                if (!schedule) {
                    throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
                }

                if (schedule.scheduledBy !== userId) {
                    throw new ForbiddenException('Bạn không phải chủ sở hữu lịch phỏng vấn này');
                }

                return true;
            }

            default:
                return true;
        }
    }
}
