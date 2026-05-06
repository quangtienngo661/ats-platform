import { IJobPosting, IJobPostingSkills } from "@ats-platform/types";
import { IApplicationDto } from "./application.interface";

/** DTO đầu ra từ API cho một Job Posting */
export interface IJobPostingDto extends Omit<IJobPosting, 'salaryMin' | 'salaryMax' | 'parsedRequirements' | 'publishedAt'> {
    jobId: string;
    title: string;
    locationType: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    description?: string;
    parsedRequirements?: unknown;
    status?: string;
    publishedAt?: string | null;
    createdAt?: string;
    department?: {
        departmentId: string;
        name: string;
        description?: string | null;
        color?: string | null;
    };
    category?: {
        categoryId: string;
        name: string;
    } | null;
    recruiter?: {
        recruiterId: string;
        position?: string | null;
        department?: {
            departmentId: string;
            name: string;
        };
        user?: {
            fullName: string;
            email: string;
        };
    };
    jobPostingSkills?: {
        id: string;
        isRequired: boolean;
        skill: {
            skillId: string;
            name: string;
        };
    }[];
    applications?: IApplicationDto[];
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
