import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dtos/skills.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSkillDto: CreateSkillDto) {
    // `name` is the ONLY unique column (schema.prisma). Passing `category` here too
    // turned it into an extra AND-filter, so "TypeScript" in a different category
    // looked new — the duplicate slipped through and Prisma threw a raw P2002.
    const existingSkill = await this.prisma.skill.findUnique({
      where: { name: createSkillDto.name },
    });

    if (existingSkill) {
      throw new BadRequestException('Kỹ năng đã tồn tại');
    }

    return await this.prisma.skill.create({
      data: {
        name: createSkillDto.name,
        category: createSkillDto.category,
      },
    });
  }

  async findAll() {
    return await this.prisma.skill.findMany({
      orderBy: {
        category: 'asc',
      },
    });
  }

  async search(name?: string, category?: string) {
    return await this.prisma.skill.findMany({
      where: {
        ...(name
          ? {
              name: {
                contains: name,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(category
          ? {
              category: {
                contains: category,
                mode: 'insensitive',
              },
            }
          : {}),
      },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { skillId: id },
    });

    if (!skill) {
      throw new NotFoundException(`Không tìm thấy kỹ năng với ID ${id}`);
    }

    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({
      where: { skillId: id },
    });

    if (!skill) {
      throw new NotFoundException(`Không tìm thấy kỹ năng với ID ${id}`);
    }

    return await this.prisma.skill.update({
      where: { skillId: id },
      data: {
        name: updateSkillDto.name,
        category: updateSkillDto.category,
      },
    });
  }

  async remove(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { skillId: id },
      include: { _count: { select: { jobPostingSkills: true } } },
    });

    if (!skill) {
      throw new NotFoundException(`Không tìm thấy kỹ năng với ID ${id}`);
    }

    // Block rather than cascade: silently detaching a skill from every job posting
    // that requires it would quietly change what those postings are asking for.
    if (skill._count.jobPostingSkills > 0) {
      throw new BadRequestException(
        'Không thể xóa kỹ năng đang được sử dụng trong tin tuyển dụng',
      );
    }

    return await this.prisma.skill.delete({
      where: { skillId: id },
    });
  }
}
