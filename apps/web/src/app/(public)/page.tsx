import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { HomeHero } from '@/components/public/home/HomeHero';
import { PublicFooter } from '@/components/public/layout/PublicFooter';
import { HomeStats } from '@/components/public/home/HomeStats';
import { HomeCategories } from '@/components/public/home/HomeCategories';
import { HomeFeaturedJobs } from '@/components/public/home/HomeFeaturedJobs';
import { HomeAIHighlight } from '@/components/public/home/HomeAIHighlight';

export const metadata = {
    title: 'TalentAI | Tìm việc làm phù hợp với bạn',
    description: 'Khám phá hàng nghìn vị trí việc làm phù hợp. TalentAI sử dụng AI để kết nối bạn với nhà tuyển dụng một cách thông minh.',
};

export default async function HomePage() {
    const categories = await getJobCategoriesAction();

    return (
        <>
            {/* Hero Section */}
            <HomeHero />

            {/* AI Highlight Section */}
            <HomeAIHighlight />

            {/* Stats */}
            <HomeStats />

            {/* Job Categories */}
            <HomeCategories categories={categories} />

            {/* Featured Jobs CTA */}
            <HomeFeaturedJobs />

            <PublicFooter />
        </>
    );
}
