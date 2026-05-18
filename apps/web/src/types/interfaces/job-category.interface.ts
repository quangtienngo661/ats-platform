import { IJobCategory } from "@ats-platform/types";
export interface IJobCategoryDto extends IJobCategory {
    categoryId: string;
    name: string;
    parentCategoryId?: string | null;
    childCategories?: IJobCategoryDto[];
    jobPostings?: { jobId: string }[];
}
