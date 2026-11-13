import { getUiVariant } from '@/lib/ui-variant';
import LegacyHomePage from '@/legacy/app/(public)/page';
import { getViewerJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { HomeHero } from '@/components/public/home/HomeHero';
import { HomeSteps } from '@/components/public/home/HomeSteps';
import { HomeCategories } from '@/components/public/home/HomeCategories';
import { HomeFeaturedJobs } from '@/components/public/home/HomeFeaturedJobs';
import { HomeAIHighlight } from '@/components/public/home/HomeAIHighlight';

export const metadata = {
    title: 'TalentAI | Tìm việc làm phù hợp với bạn',
    description: 'Tìm việc làm phù hợp với kỹ năng của bạn. TalentAI dùng AI đọc CV và so với yêu cầu của từng tin tuyển dụng.',
};

/** The footer comes from the (public) layout. Order: search, how it works, what the AI does, categories, all jobs. */
export default async function HomePage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyHomePage />;
    const categories = await getViewerJobCategoriesAction();

    return (
        <>
            <HomeHero />
            <HomeSteps />
            <HomeAIHighlight />
            <HomeCategories categories={categories} />
            <HomeFeaturedJobs />
        </>
    );
}
