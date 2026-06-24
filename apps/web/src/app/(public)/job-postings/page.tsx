import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { PublicFooter } from '@/components/public/layout/PublicFooter';
import { JobSearchClient } from '@/components/public/jobs/JobSearchClient';

interface JobsPageProps {
    searchParams: Promise<{
        q?: string;
        categoryId?: string;
        locationType?: string;
        page?: string;
    }>;
}

export const metadata = {
    title: 'Tìm việc làm | TalentAI',
    description: 'Tìm kiếm việc làm phù hợp từ hàng trăm doanh nghiệp hàng đầu.',
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
    const params = await searchParams;
    const page = parseInt(params.page ?? '1', 10);

    const [jobs, categories] = await Promise.all([
        getJobPostingsAction({
            status: 'active',
            search: params.q,
            categoryId: params.categoryId,
            page,
            limit: 12,
        }),
        getJobCategoriesAction(),
    ]);

    return (
        <>
            <JobSearchClient
                initialJobs={jobs.items}
                total={jobs.pagination.total}
                categories={categories}
                currentPage={page}
                initialQuery={{
                    q: params.q,
                    categoryId: params.categoryId,
                    locationType: params.locationType,
                }}
            />
            <PublicFooter />
        </>
    );
}
