import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RESOURCES_KEY } from "../decorators/resources.decorator";
import { PrismaService } from "../../app/prisma/prisma.service";
import { userIncludeOptions } from "../utils/include-options";

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

        const { user } = context.switchToHttp().getRequest();
        const resourceId = context.switchToHttp().getRequest().params.id;
        const userId = user.userId;

        if (user.role === 'admin')
            return true;

        switch (resource) {
            case 'job-posting':
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
                    throw new NotFoundException('You are not the owner of this job posting');
                return true;

            // case 'job-posting-skills':
            //     const jobPostingSkill = await this.prisma.jobPostingSkill.findUnique({
            //         where: { id: resourceId },
            default:
                return true;
        }
    }
}