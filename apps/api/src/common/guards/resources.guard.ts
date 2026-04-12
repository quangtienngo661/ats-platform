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
                    throw new NotFoundException('Job posting not found');

                if (jobPosting.recruiter.userId !== userId)
                    throw new ForbiddenException('You are not the owner of this job posting');
                return true;
            }

            case 'cv': {
                const cv = await this.prisma.cV.findUnique({
                    where: { cvId: resourceId },
                    select: { candidateId: true }
                });

                if (!cv)
                    throw new NotFoundException('CV not found');

                const candidate = await this.prisma.candidate.findUnique({
                    where: { candidateId: cv.candidateId },
                    select: { userId: true }
                });

                if (!candidate || candidate.userId !== userId)
                    throw new ForbiddenException('You are not the owner of this CV');
                return true;
            }

            case 'application': {
                if (user.role === 'recruiter')
                    return true;

                const application = await this.prisma.application.findUnique({
                    where: { applicationId: resourceId },
                    select: { candidateId: true }
                });

                if (!application)
                    throw new NotFoundException('Application not found');

                const candidate = await this.prisma.candidate.findUnique({
                    where: { candidateId: application.candidateId },
                    select: { userId: true }
                });

                if (!candidate || candidate.userId !== userId)
                    throw new ForbiddenException('You are not the owner of this application');
                return true;
            }

            default:
                return true;
        }
    }
}