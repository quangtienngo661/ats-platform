import { getViewerJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { HomeHero } from '@/legacy/components/public/home/HomeHero';
import { PublicFooter } from '@/legacy/components/public/layout/PublicFooter';
import { HomeStats } from '@/legacy/components/public/home/HomeStats';
import { HomeCategories } from '@/legacy/components/public/home/HomeCategories';
import { HomeFeaturedJobs } from '@/legacy/components/public/home/HomeFeaturedJobs';
import { HomeAIHighlight } from '@/legacy/components/public/home/HomeAIHighlight';

export const metadata = {
    title: 'TalentAI | Tìm việc làm phù hợp với bạn',
    description: 'Khám phá hàng nghìn vị trí việc làm phù hợp. TalentAI sử dụng AI để kết nối bạn với nhà tuyển dụng một cách thông minh.',
};

export default async function HomePage() {
    const categories = await getViewerJobCategoriesAction();

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
