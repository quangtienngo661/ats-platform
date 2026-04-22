import { IJobPosting, IJobPostingSkills } from "@ats-platform/types";

/** DTO đầu ra từ API cho một Job Posting */
export interface IJobPostingDto extends IJobPosting {
    jobId: string;
    departmentId: string;
    categoryId?: string;
    title: string;
    locationType: string;
    salaryMin?: number;
    salaryMax?: number;
    description?: string;
    parsedRequirements?: string;
    status?: string;
    skills?: IJobPostingSkills[];
    publishedAt?: string;
    createdAt?: string;
}

export interface IFindJobPostingsQuery {
    status?: string;
    departmentId?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface IPaginatedJobPostings {
    data: IJobPostingDto[];
    total: number;
    page: number;
    limit: number;
}
