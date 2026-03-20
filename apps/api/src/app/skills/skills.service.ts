import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dtos/skills.dto';

@Injectable()
export class SkillsService {
	constructor(private readonly prisma: PrismaService) { }

	async create(createSkillDto: CreateSkillDto) {
		return this.prisma.skill.create({
			data: {
				name: createSkillDto.name,
				category: createSkillDto.category,
			},
		});
	}

	async findAll() {
		return this.prisma.skill.findMany();
	}

	async search(name?: string, category?: string) {
		return this.prisma.skill.findMany({
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
			throw new NotFoundException(`Skill with ID ${id} not found`);
		}

		return skill;
	}

	async update(id: string, updateSkillDto: UpdateSkillDto) {
		const skill = await this.prisma.skill.findUnique({
			where: { skillId: id },
		});

		if (!skill) {
			throw new NotFoundException(`Skill with ID ${id} not found`);
		}

		return this.prisma.skill.update({
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
		});

		if (!skill) {
			throw new NotFoundException(`Skill with ID ${id} not found`);
		}

		return this.prisma.skill.delete({
			where: { skillId: id },
		});
	}
}
