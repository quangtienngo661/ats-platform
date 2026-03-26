import { IJobPostingSkills } from '../skills/skills.interface';

export interface IJobPosting {
	departmentId: string;
	categoryId?: string;
	createdBy?: string;
	title: string;
	locationType: string;
	salaryMin?: number;
	salaryMax?: number;
	description?: string;
	parsedRequirements?: string;
	status?: string;
	skills?: IJobPostingSkills[];
	publishedAt?: string;
}


