import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IJobPostingSkills } from "@ats-platform/types";
import { Prisma } from "@ats-platform/database";

@Injectable()
export class JobPostingSkillsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }
    
    async create(jobId: string, skills: IJobPostingSkills[], tx?: Prisma.TransactionClient) {
        const jobPostingSkillsData = skills.map(skill => ({
            jobId,
            skillId: skill.skillId,
            isRequired: skill.isRequired,
        }));
        
        return (tx || this.prisma).jobPostingSkill.createMany({
            data: jobPostingSkillsData,
        });
    }

    async deleteBySkillId(skillId: string, tx?: Prisma.TransactionClient) {
        return (tx || this.prisma).jobPostingSkill.deleteMany({
            where: { skillId },
        });
    }

    async deleteByJobId(jobId: string, tx?: Prisma.TransactionClient) {
        return (tx || this.prisma).jobPostingSkill.deleteMany({
            where: { jobId },
        });
    }
}