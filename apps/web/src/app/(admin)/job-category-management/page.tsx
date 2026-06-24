import JobCategoryClient from '@/components/job-category-management/JobCategoryClient';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';

export default async function JobCategoryManagementPage() {
    const categories = await getJobCategoriesAction();

    return <JobCategoryClient categories={categories} />;
}
