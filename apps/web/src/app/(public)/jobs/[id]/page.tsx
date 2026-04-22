import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PublicFooter } from '../../../../components/public/layout/PublicFooter';
import { JobDetailHero } from '@/components/public/jobs/detail/JobDetailHero';
import { JobDetailBody } from '@/components/public/jobs/detail/JobDetailBody';
import { JobDetailSidebar } from '@/components/public/jobs/detail/JobDetailSidebar';
import { ApplyButton } from '@/components/public/jobs/detail/ApplyButton';
import { getJobPostingByIdAction } from '@/servers/job-postings/job-postings.action';
import { SFT } from '@/types/fonts/fonts';

interface JobDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps) {
    const { id } = await params;
    const job = await getJobPostingByIdAction(id);
    if (!job) return { title: 'Không tìm thấy việc làm | TalentAI' };
    return {
        title: `${job.title} | TalentAI`,
        description: job.description?.slice(0, 160),
    };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
    const { id } = await params;
    const [job, cookieStore] = await Promise.all([
        getJobPostingByIdAction(id),
        cookies(),
    ]);

    if (!job) notFound();

    const isLoggedIn = !!cookieStore.get('accessToken')?.value;

    return (
        <>
            <div className="max-w-[1200px] mx-auto px-6 py-6" style={{ fontFamily: SFT }}>
                {/* Breadcrumb */}
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại tìm kiếm
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main */}
                    <div className="lg:col-span-2 space-y-5">
                        <JobDetailHero job={job} isLoggedIn={isLoggedIn} />
                        <JobDetailBody job={job} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <JobDetailSidebar job={job} />
                        {/* Mobile Apply Button */}
                        <div className="lg:hidden">
                            <ApplyButton job={job} isLoggedIn={isLoggedIn} />
                        </div>
                    </div>
                </div>
            </div>
            <PublicFooter />
        </>
    );
}
