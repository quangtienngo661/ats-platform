import { positivePage } from '@/lib/pagination';
import { parseJobFilterParams } from '@/lib/job-filter-params';
import { getJobFilterOptionsAction, getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import { getViewerJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { PublicFooter } from '@/components/public/layout/PublicFooter';
import { JobSearchClient } from '@/components/public/jobs/JobSearchClient';

interface JobsPageProps {
    searchParams: Promise<{
        q?: string;
        categoryId?: string;
        locationType?: string;
        page?: string;
        salaryMin?: string | string[];
        salaryMax?: string | string[];
        skillIds?: string | string[];
    }>;
}

export const metadata = {
    title: 'Tìm việc làm | TalentAI',
    description: 'Tìm kiếm việc làm phù hợp từ hàng trăm doanh nghiệp hàng đầu.',
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
    const params = await searchParams;
    const page = positivePage(params.page);
    const filters = parseJobFilterParams(params);

    const [jobs, categories, filterOptions] = await Promise.all([
        getJobPostingsAction({
            status: 'active',
            search: params.q,
            categoryId: params.categoryId,
            locationType: params.locationType,
            ...filters,
            page,
            limit: 12,
        }),
        getViewerJobCategoriesAction(),
        getJobFilterOptionsAction(),
    ]);

    return (
        <>
            <JobSearchClient
                initialJobs={jobs.items}
                total={jobs.pagination.total}
                categories={categories}
                skills={filterOptions.skills}
                currentPage={page}
                initialQuery={{
                    q: params.q,
                    categoryId: params.categoryId,
                    locationType: params.locationType,
                    ...filters,
                }}
            />
            <PublicFooter />
        </>
    );
}
