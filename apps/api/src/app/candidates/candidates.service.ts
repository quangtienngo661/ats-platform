import { Prisma } from '@ats-platform/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FindCandidatesQueryDto, UpdateCandidateProfileDto } from './dtos/candidates.dto';
import { candidateIncludeOptions } from '../../common/utils/include-options.util';

@Injectable()
export class CandidatesService {
	constructor(private readonly prisma: PrismaService) { }

	async getProfile(userId: string) {
		const candidate = await this.prisma.candidate.findUnique({
			where: { userId },
			include: { ...candidateIncludeOptions },
			omit: {
				userId: true
			}
		});

		if (!candidate) {
			throw new NotFoundException('Candidate profile not found');
		}

		return {
			candidateId: candidate.candidateId,
			user: candidate.user,
			currentTitle: candidate.currentTitle,
			yearsOfExperience: candidate.yearsOfExperience,
			profileData: candidate.profileData,
			cvCount: candidate._count.cvs,
			applicationCount: candidate._count.applications,
		};
	}

	async updateProfile(userId: string, updateDto: UpdateCandidateProfileDto) {
		const candidate = await this.prisma.candidate.findUnique({
			where: { userId },
			select: {
				profileData: true,
			},
		});

		if (!candidate) {
			throw new NotFoundException('Candidate profile not found');
		}

		const currentProfileData = this.asObject(candidate.profileData);
		const incomingProfileData = updateDto.profileData ?? {};

		await this.prisma.candidate.update({
			where: { userId },
			data: {
				currentTitle: updateDto.currentTitle,
				yearsOfExperience: updateDto.yearsOfExperience,
				profileData: {
					...currentProfileData,
					...incomingProfileData,
				} as Prisma.InputJsonObject,
				user: {
					update: {
						...updateDto.userInfo
					}
				}
			},
		});

		return this.getProfile(userId);
	}

	async updateProfileData(candidateId: string, profileData: Record<string, unknown>) {
		await this.prisma.candidate.update({
			where: { candidateId },
			data: {
				profileData: profileData as Prisma.InputJsonObject,
			},
		});
	}

	async findOne(candidateId: string) {
		const candidate = await this.prisma.candidate.findUnique({
			where: { candidateId },
			include: {
				user: {
					select: {
						userId: true,
						email: true,
						fullName: true,
						phoneNumber: true,
						status: true,
						emailVerified: true,
						createdAt: true,
					},
				},
				_count: {
					select: {
						cvs: true,
						applications: true,
					},
				},
			},
		});

		if (!candidate) {
			throw new NotFoundException('Candidate not found');
		}

		return {
			candidateId: candidate.candidateId,
			user: candidate.user,
			currentTitle: candidate.currentTitle,
			yearsOfExperience: candidate.yearsOfExperience,
			profileData: candidate.profileData,
			cvCount: candidate._count.cvs,
			applicationCount: candidate._count.applications,
		};
	}

	async findAll(query: FindCandidatesQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 10;

		const where: Prisma.CandidateWhereInput = {
			...(query.search
				? {
					OR: [
						{ currentTitle: { contains: query.search, mode: 'insensitive' } },
						{ user: { fullName: { contains: query.search, mode: 'insensitive' } } },
						{ user: { email: { contains: query.search, mode: 'insensitive' } } },
						{ user: { phoneNumber: { contains: query.search, mode: 'insensitive' } } },
					],
				}
				: {}),
			...(query.status
				? {
					user: {
						status: query.status,
					},
				}
				: {}),
		};

		const [candidates, total] = await this.prisma.$transaction([
			this.prisma.candidate.findMany({
				where,
				include: {
					user: {
						select: {
							userId: true,
							email: true,
							fullName: true,
							phoneNumber: true,
							status: true,
							emailVerified: true,
							createdAt: true,
						},
					},
					_count: {
						select: {
							cvs: true,
							applications: true,
						},
					},
				},
				orderBy: {
					user: {
						createdAt: 'desc',
					},
				},
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prisma.candidate.count({ where }),
		]);

		return {
			items: candidates.map((candidate) => ({
				candidateId: candidate.candidateId,
				user: candidate.user,
				currentTitle: candidate.currentTitle,
				yearsOfExperience: candidate.yearsOfExperience,
				profileData: candidate.profileData,
				cvCount: candidate._count.cvs,
				applicationCount: candidate._count.applications,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	private asObject(value: Prisma.JsonValue | null): Record<string, unknown> {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}

		return {};
	}
}
