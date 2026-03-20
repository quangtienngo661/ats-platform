import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';
import { PrismaService } from '../prisma/prisma.service';
import { userIncludeOptions } from '../../common/utils/include-options';

@Injectable()
export class RecruitersService {
	constructor(
		private readonly prisma: PrismaService
	) { }
	async create(createRecruiterDto: CreateRecruiterDto) {
		const user = await this.prisma.user.findUnique({
			where: {
				userId: createRecruiterDto.userId
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const department = await this.prisma.department.findUnique({
			where: {
				departmentId: createRecruiterDto.departmentId
			},
		});

		if (!department) {
			throw new NotFoundException('Department not found');
		}

		const recruiter = await this.prisma.recruiter.create({
			data: {
				userId: createRecruiterDto.userId,
				departmentId: createRecruiterDto.departmentId,
				position: createRecruiterDto.position,
			},
			include: {
				user: { ...userIncludeOptions },
				department: true
			},
			omit: {
				userId: true,
				departmentId: true
			},
		});

		return recruiter;
	}

	async findAll() {
		return await this.prisma.recruiter.findMany({
			include: {
				user: { ...userIncludeOptions },
				department: true,
			},
			omit: {
				userId: true,
				departmentId: true
			}
		});
	}

	async findOne(id: string) {
		const recruiter = await this.prisma.recruiter.findUnique({
			where: {
				recruiterId: id
			},
			omit: {
				userId: true,
				departmentId: true
			},
			include: {
				user: { ...userIncludeOptions },
				department: true,
			},
		});

		if (!recruiter) {
			throw new NotFoundException('Recruiter not found');
		}

		return recruiter;
	}

	async update(id: string, updateRecruiterDto: UpdateRecruiterDto) {
		const recruiter = await this.prisma.recruiter.findUnique({
			where: {
				recruiterId: id
			}
		});

		if (!recruiter) {
			throw new NotFoundException('Recruiter not found');
		}

		return await this.prisma.recruiter.update({
			where: {
				recruiterId: id
			},
			include: {
				user: { ...userIncludeOptions },
				department: true,
			},
			data: updateRecruiterDto,
			omit: {
				userId: true,
				departmentId: true
			},
		});
	}

	async remove(id: string) {
		const recruiter = await this.prisma.recruiter.findUnique({
			where: {
				recruiterId: id
			},
		});

		if (!recruiter) {
			throw new NotFoundException('Recruiter not found');
		}

		return await this.prisma.recruiter.delete({
			where: {
				recruiterId: id
			},
			omit: {
				userId: true,
				departmentId: true
			},
			include: {
				user: { ...userIncludeOptions },
				department: true
			}
		});
	}
}
