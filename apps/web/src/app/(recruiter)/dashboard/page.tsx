import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
import { getAiCostAction, getRecruitmentAnalyticsAction } from '@/servers/analytics/analytics.action';
import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import ApplicationsTrendChart from '@/components/dashboard/ApplicationsTrendChart';
import RecentCandidates from '@/components/dashboard/RecentCandidates';
import OpenJobsList from '@/components/dashboard/OpenJobsList';
import { RecruitmentFunnel, TimeInStage } from '@/components/dashboard/RecruitmentFunnel';
import { AiCostPanel } from '@/components/dashboard/AiCostPanel';
import { DASHBOARD_PERIODS, DashboardFilters } from '@/components/dashboard/DashboardFilters';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

interface DashboardPageProps {
    searchParams: Promise<{ days?: string; jobId?: string }>;
}

function dayLabel(isoDate: string) {
    const [, month, day] = isoDate.split('-');
    return `${day}/${month}`;
}

// GĐ4 part 3: every number comes from GET /analytics/recruitment, counted by the API in the
// caller's scope (A-04: the old page sliced the first six cards of a whole board).
export default async function HRDashboard({ searchParams }: DashboardPageProps) {
    const { days: daysParam, jobId } = await searchParams;
    const days = (DASHBOARD_PERIODS as readonly number[]).includes(Number(daysParam)) ? Number(daysParam) : 30;
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY);
    const range = { from: from.toISOString(), to: to.toISOString() };

    const role = decodeTokenPayload((await cookies()).get('accessToken')?.value ?? '')?.role;
    const showCost = role === 'admin' || role === 'org_admin';

    const [analytics, jobs, cost] = await Promise.all([
        getRecruitmentAnalyticsAction({ ...range, jobId }),
        getJobPostingsAction({ status: 'active', limit: 100 }),
        showCost ? getAiCostAction(range) : Promise.resolve(null),
    ]);
    const openJobs = jobs?.items ?? [];

    return (
        <div className="p-4 lg:p-6" style={{ fontFamily: SFT }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Bảng điều khiển</span>
            </div>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <h1 className="sr-only">Bảng điều khiển</h1>
                <DashboardFilters
                    days={days}
                    jobId={jobId}
                    jobs={openJobs.map(job => ({ jobId: job.jobId, title: job.title }))}
                />
                <Link
                    href="/jobs"
                    className="hidden sm:flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-4 py-2.5 text-[13px] transition shadow-sm shadow-[#0071E3]/20"
                    style={{ fontFamily: SFT, fontWeight: 500 }}
                >
                    Quản lý tuyển dụng <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <DashboardKpiCards totals={analytics.totals} />

            <ApplicationsTrendChart
                data={analytics.trend.map(point => ({ month: dayLabel(point.date), value: point.count }))}
                subtitle={`Số đơn mỗi ngày, ${days} ngày gần nhất`}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                <RecruitmentFunnel funnel={analytics.funnel} outcomes={analytics.outcomes} />
                <TimeInStage timeInStage={analytics.timeInStage} />
            </div>

            {cost && <AiCostPanel cost={cost} />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <RecentCandidates applications={analytics.recent} />
            </div>

            <OpenJobsList jobs={openJobs} />
        </div>
    );
}
