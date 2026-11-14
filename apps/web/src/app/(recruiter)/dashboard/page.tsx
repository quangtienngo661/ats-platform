import { getUiVariant } from '@/lib/ui-variant';
import LegacyHRDashboard from '@/legacy/app/(recruiter)/dashboard/page';
import { ArrowRight } from 'lucide-react';
import { ButtonLink, PageToolbar, Reveal } from '@/components/ui';
import { getDashboardStatsAction } from '@/servers/applications/dashboard.action';
import { buildApplicationsTrend, buildPipelineData } from '@/lib/dashboard.utils';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import ApplicationsTrendChart from '@/components/dashboard/ApplicationsTrendChart';
import RecruitmentPipeline from '@/components/dashboard/RecruitmentPipeline';
import RecentCandidates from '@/components/dashboard/RecentCandidates';
import OpenJobsList from '@/components/dashboard/OpenJobsList';

export const dynamic = 'force-dynamic';

export default async function HRDashboard() {
    if ((await getUiVariant()) === 'legacy') return <LegacyHRDashboard />;
    const stats = await getDashboardStatsAction();

    const allApps = stats.recentApplications; // top 6 đã sort
    const trendData = buildApplicationsTrend(stats.recentApplications);
    const pipelineData = buildPipelineData(stats.recentApplications);
    const maxPipelineCount = Math.max(...pipelineData.map(d => d.count), 1);

    // Ứng viên đã tuyển trong tháng hiện tại
    const now = new Date();
    const hiredThisMonth = stats.recentApplications.filter(app => {
        const isHired = app.status?.toLowerCase() === 'hired';
        if (!isHired || !app.appliedAt) return false;
        const d = new Date(app.appliedAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <PageToolbar title="Bảng điều khiển">
                <ButtonLink href="/jobs" variant="secondary">
                    Quản lý tuyển dụng <ArrowRight size={14} aria-hidden="true" />
                </ButtonLink>
            </PageToolbar>

            <DashboardKpiCards
                totalApplications={stats.totalApplications}
                openJobs={stats.openJobs}
                hiredThisMonth={hiredThisMonth}
            />

            <Reveal delay={0.12} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ApplicationsTrendChart data={trendData} />
                </div>
                <RecruitmentPipeline data={pipelineData} maxCount={maxPipelineCount} />
            </Reveal>

            <Reveal delay={0.18} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RecentCandidates applications={allApps} />
                </div>
                <OpenJobsList jobs={stats.jobPostings} />
            </Reveal>
        </div>
    );
}
