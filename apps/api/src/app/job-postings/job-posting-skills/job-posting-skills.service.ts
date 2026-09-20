import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { IJobPostingSkills, ISkill } from "@ats-platform/types";
import { Prisma } from "@ats-platform/database";

@Injectable()
export class JobPostingSkillsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // organizationId is passed in rather than looked up: every caller already holds the
    // parent job posting, and this runs inside that job's transaction.
    async create(jobId: string, organizationId: string, skills: IJobPostingSkills[], tx?: Prisma.TransactionClient) {
        const jobPostingSkillsData = skills.map(skill => ({
            jobId,
            organizationId,
            skillId: skill.skillId,
            isRequired: skill.isRequired,
        }));

        return await (tx || this.prisma).jobPostingSkill.createMany({
            data: jobPostingSkillsData,
        });
    }

    async deleteBySkillId(skillId: string, tx?: Prisma.TransactionClient) {
        return await (tx || this.prisma).jobPostingSkill.deleteMany({
            where: { skillId },
        });
    }

    async deleteByJobId(jobId: string, tx?: Prisma.TransactionClient) {
        return await (tx || this.prisma).jobPostingSkill.deleteMany({
            where: { jobId },
        });
    }
}