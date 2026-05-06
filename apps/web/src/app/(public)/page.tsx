import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { HomeHero } from '@/components/public/home/HomeHero';
import { PublicFooter } from '@/components/public/layout/PublicFooter';
import { HomeStats } from '@/components/public/home/HomeStats';
import { HomeCategories } from '@/components/public/home/HomeCategories';
import { HomeFeaturedJobs } from '@/components/public/home/HomeFeaturedJobs';

export const metadata = {
    title: 'TalentAI | Tìm việc làm phù hợp với bạn',
    description: 'Khám phá hàng nghìn vị trí việc làm phù hợp. TalentAI sử dụng AI để kết nối bạn với nhà tuyển dụng một cách thông minh.',
};

export default async function HomePage() {
    const [{ data: featuredJobs }, categories] = await Promise.all([
        getJobPostingsAction({ status: 'active', limit: 6 }),
        getJobCategoriesAction(),
    ]);

    return (
        <>
            {/* Hero Section */}
            <HomeHero />

            {/* Stats */}
            <HomeStats />

            {/* Job Categories */}
            <HomeCategories categories={categories} />

            {/* Featured Jobs */}
            <HomeFeaturedJobs jobs={featuredJobs} />

            <PublicFooter />
        </>
    );
}
