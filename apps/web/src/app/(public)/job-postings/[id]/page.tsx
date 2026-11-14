import { getUiVariant } from '@/lib/ui-variant';
import LegacyJobDetailPage from '@/legacy/app/(public)/job-postings/[id]/page';
import { notFound } from 'next/navigation';
import { getJobPostingByIdAction } from '@/servers/job-postings/job-postings.action';
import { JobDetailHero } from '@/components/public/jobs/detail/JobDetailHero';
import { JobDetailBody } from '@/components/public/jobs/detail/JobDetailBody';
import { JobDetailSidebar } from '@/components/public/jobs/detail/JobDetailSidebar';
import { ApplyButton } from '@/components/public/jobs/detail/ApplyButton';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/ui';

interface JobDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps) {
    const { id } = await params;
    const result = await getJobPostingByIdAction(id);
    if (!result) return { title: 'Không tìm thấy việc làm | TalentAI' };
    const { job } = result;
    return {
        title: `${job.title} | TalentAI`,
        description: job.description?.slice(0, 160),
    };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
    if ((await getUiVariant()) === 'legacy') return <LegacyJobDetailPage params={params} />;
    const { id } = await params;
    const [result, cookieStore] = await Promise.all([
        getJobPostingByIdAction(id),
        cookies(),
    ]);

    if (!result) notFound();
    const { job, available } = result;

    const isLoggedIn = !!cookieStore.get('accessToken')?.value;

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
            <Link
                href="/job-postings"
                className="mb-6 inline-flex items-center gap-1.5 rounded-ctl text-body-sm text-ink-3 transition-colors duration-hover hover:text-ink"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Quay lại tìm kiếm
            </Link>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
                <div className="min-w-0 space-y-10">
                    <Reveal>
                        <JobDetailHero job={job} isLoggedIn={isLoggedIn} available={available} />
                    </Reveal>
                    <JobDetailBody job={job} />
                </div>

                <Reveal delay={0.08} className="min-w-0 lg:sticky lg:top-[76px] lg:self-start">
                    <JobDetailSidebar job={job} apply={{ isLoggedIn, available }} />
                </Reveal>
            </div>

            {/* Phones: the apply action is a bar above the candidate tab bar (when there is one). */}
            <div
                data-apply-bar=""
                className="fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-surface/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden max-md:[html:has([data-tab-bar])_&]:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-md:[html:has([data-tab-bar])_&]:pb-3"
            >
                <ApplyButton job={job} isLoggedIn={isLoggedIn} available={available} />
            </div>
        </div>
    );
}
