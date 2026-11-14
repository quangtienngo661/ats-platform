import { getUiVariant } from '@/lib/ui-variant';
import LegacyJobCategoryManagementPage from '@/legacy/app/(admin)/job-category-management/page';
import JobCategoryClient from '@/components/job-category-management/JobCategoryClient';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';

export default async function JobCategoryManagementPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyJobCategoryManagementPage />;
    const categories = await getJobCategoriesAction();

    return <JobCategoryClient categories={categories} />;
}
