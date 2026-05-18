import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RESOURCES_KEY } from "../decorators/resources.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext) {
        const resource = this.reflector.getAllAndOverride<String>(RESOURCES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])

        if (!resource)
            return true;

        const { user, params } = context.switchToHttp().getRequest();
        // Support different route param naming conventions: :id, :cvId, :jobId, etc.
        const resourceId = params.id ?? params.cvId ?? params.jobId ?? params.jobPostingId;
        const userId = user.userId;

        // No ID param on this route — nothing to check ownership on, allow through
        if (!resourceId)
            return true;

        if (user.role === 'admin')
            return true;

        switch (resource) {
            case 'job-posting': {
                const jobPosting = await this.prisma.jobPosting.findUnique({
                    where: { jobId: resourceId },
                    select: {
                        recruiter: {
                            select: { userId: true }
                        }
                    }
                });

                if (!jobPosting)
                    throw new NotFoundException('Không tìm thấy tin tuyển dụng');

                if (jobPosting.recruiter.userId !== userId)
                    throw new ForbiddenException('Bạn không phải chủ sở hữu tin tuyển dụng này');
                return true;
            }

            case 'cv': {
                const cv = await this.prisma.cV.findUnique({
                    where: { cvId: resourceId },
                    select: { candidateId: true }
                });

                if (!cv)
                    throw new NotFoundException('Không tìm thấy CV');

                const candidate = await this.prisma.candidate.findUnique({
                    where: { candidateId: cv.candidateId },
                    select: { userId: true }
                });

                if (!candidate || candidate.userId !== userId)
                    throw new ForbiddenException('Bạn không phải chủ sở hữu CV này');
                return true;
            }

            case 'application': {
                const application = await this.prisma.application.findUnique({
                    where: { applicationId: resourceId },
                    select: {
                        candidate: { select: { userId: true } },
                        jobPosting: { select: { departmentId: true } },
                    },
                });

                if (!application)
                    throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

                if (user.role === 'recruiter') {
                    const recruiter = await this.prisma.recruiter.findUnique({
                        where: { userId },
                        select: { departmentId: true },
                    });

                    if (!recruiter || recruiter.departmentId !== application.jobPosting.departmentId)
                        throw new ForbiddenException('Bạn không có quyền truy cập đơn ứng tuyển của khoa này');
                    return true;
                }

                if (!application.candidate || application.candidate.userId !== userId)
                    throw new ForbiddenException('Bạn không phải chủ sở hữu đơn ứng tuyển này');
                return true;
            }

            case 'interview-schedule': {
                const schedule = await this.prisma.interviewSchedule.findUnique({
                    where: { interviewId: resourceId },
                    select: { scheduledBy: true },
                });

                if (!schedule)
                    throw new NotFoundException('Không tìm thấy lịch phỏng vấn');

                if (schedule.scheduledBy !== userId)
                    throw new ForbiddenException('Bạn không phải chủ sở hữu lịch phỏng vấn này');
                return true;
            }

            default:
                return true;
        }
    }
}
