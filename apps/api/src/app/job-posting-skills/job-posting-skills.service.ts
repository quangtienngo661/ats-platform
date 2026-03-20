import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJobPostingSkillDto,
  UpdateJobPostingSkillDto,
} from './dto/job-posting-skill.dto';
import { jobPostingSkillIncludeOptions } from '../../common/utils/include-options';

@Injectable()
export class JobPostingSkillsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createJobPostingSkillDto: CreateJobPostingSkillDto) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { jobId: createJobPostingSkillDto.jobId },
      select: { jobId: true },
    });

    if (!jobPosting) {
      throw new NotFoundException(
        `Job posting with ID ${createJobPostingSkillDto.jobId} not found`,
      );
    }

    const skill = await this.prisma.skill.findUnique({
      where: { skillId: createJobPostingSkillDto.skillId },
      select: { skillId: true },
    });

    if (!skill) {
      throw new NotFoundException(
        `Skill with ID ${createJobPostingSkillDto.skillId} not found`,
      );
    }

    const existingSkill = await this.prisma.jobPostingSkill.findUnique({
      where: {
        jobId_skillId: {
          jobId: createJobPostingSkillDto.jobId,
          skillId: createJobPostingSkillDto.skillId,
        },
      },
      select: { id: true },
    });

    if (existingSkill) {
      throw new BadRequestException(
        `Skill ${createJobPostingSkillDto.skillId} is already assigned to this job posting`,
      );
    }

    return this.prisma.jobPostingSkill.create({
      data: {
        jobId: createJobPostingSkillDto.jobId,
        skillId: createJobPostingSkillDto.skillId,
        isRequired: createJobPostingSkillDto.isRequired ?? true,
      },
      include: { ...jobPostingSkillIncludeOptions },
    });
  }

  async findAll() {
    return this.prisma.jobPostingSkill.findMany({
      include: { ...jobPostingSkillIncludeOptions },
    });
  }

  async findOne(id: string) {
    const jobPostingSkill = await this.prisma.jobPostingSkill.findUnique({
      where: { id },
      include: { ...jobPostingSkillIncludeOptions },
    });

    if (!jobPostingSkill) {
      throw new NotFoundException(
        `Job posting skill with ID ${id} not found`,
      );
    }

    return jobPostingSkill;
  }

  async update(id: string, updateJobPostingSkillDto: UpdateJobPostingSkillDto) {
    const existingJobPostingSkill =
      await this.prisma.jobPostingSkill.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existingJobPostingSkill) {
      throw new NotFoundException(
        `Job posting skill with ID ${id} not found`,
      );
    }

    return this.prisma.jobPostingSkill.update({
      where: { id },
      data: {
        isRequired: updateJobPostingSkillDto.isRequired,
      },
      include: { ...jobPostingSkillIncludeOptions },
    });
  }

  async remove(id: string) {
    const existingJobPostingSkill =
      await this.prisma.jobPostingSkill.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existingJobPostingSkill) {
      throw new NotFoundException(
        `Job posting skill with ID ${id} not found`,
      );
    }

    return this.prisma.jobPostingSkill.delete({
      where: { id },
      include: { ...jobPostingSkillIncludeOptions },
    });
  }
}
