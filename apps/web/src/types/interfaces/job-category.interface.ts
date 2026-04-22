import { IJobCategory } from "@ats-platform/types";

/** DTO đầu ra từ API cho một Job Category */
export interface IJobCategoryDto extends IJobCategory {
    categoryId: string;
    name: string;
    parentCategoryId?: string | null;
    childCategories?: IJobCategoryDto[];
    jobPostingsCount?: number;
}
