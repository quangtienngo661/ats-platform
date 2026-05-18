import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecruiterDto, UpdateMyRecruiterDto, UpdateRecruiterDto } from './dtos/recruiters.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { recruiterIncludeOptions } from '../../common/utils/include-options.util';

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
			throw new NotFoundException('Không tìm thấy người dùng');
		}

		const department = await this.prisma.department.findUnique({
			where: {
				departmentId: createRecruiterDto.departmentId
			},
		});

		if (!department) {
			throw new NotFoundException('Không tìm thấy phòng ban');
		}

		const existingRecruiter = await this.prisma.recruiter.findUnique({
			where: {
				userId: createRecruiterDto.userId
			},
		});

		if (existingRecruiter) {
			throw new NotFoundException('Hồ sơ nhà tuyển dụng đã tồn tại cho người dùng này');
		}

		const recruiter = await this.prisma.recruiter.create({
			data: {
				userId: createRecruiterDto.userId,
				departmentId: createRecruiterDto.departmentId,
				position: createRecruiterDto.position,
			},
			include: { ...recruiterIncludeOptions },
			omit: {
				userId: true,
				departmentId: true
			},
		});

		return recruiter;
	}

	async getMe(userId: string) {
		const recruiter = await this.prisma.recruiter.findUnique({
			where: { userId },
			include: { ...recruiterIncludeOptions },
			omit: { userId: true, departmentId: true },
		});

		if (!recruiter) {
			throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
		}

		return recruiter;
	}

	async updateMe(userId: string, updateDto: UpdateMyRecruiterDto) {
		const recruiter = await this.prisma.recruiter.findUnique({
			where: { userId },
		});

		if (!recruiter) {
			throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
		}

		return await this.prisma.recruiter.update({
			where: { recruiterId: recruiter.recruiterId },
			data: { position: updateDto.position },
			include: { ...recruiterIncludeOptions },
			omit: { userId: true, departmentId: true },
		});
	}

	async findAll() {
		return await this.prisma.recruiter.findMany({
			include: { ...recruiterIncludeOptions },
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
			include: { ...recruiterIncludeOptions },
		});

		if (!recruiter) {
			throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
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
			throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
		}

		return await this.prisma.recruiter.update({
			where: {
				recruiterId: id
			},
			include: { ...recruiterIncludeOptions },
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
			throw new NotFoundException('Không tìm thấy nhà tuyển dụng');
		}

		return await this.prisma.recruiter.delete({
			where: {
				recruiterId: id
			},
			omit: {
				userId: true,
				departmentId: true
			},
			include: { ...recruiterIncludeOptions }
		});
	}
}
