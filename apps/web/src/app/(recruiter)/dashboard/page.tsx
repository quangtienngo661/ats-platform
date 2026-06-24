import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { getDashboardStatsAction } from '@/servers/applications/dashboard.action';
import { buildApplicationsTrend, buildPipelineData } from '@/lib/dashboard.utils';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import ApplicationsTrendChart from '@/components/dashboard/ApplicationsTrendChart';
import RecruitmentPipeline from '@/components/dashboard/RecruitmentPipeline';
import RecentCandidates from '@/components/dashboard/RecentCandidates';
import OpenJobsList from '@/components/dashboard/OpenJobsList';

export const dynamic = 'force-dynamic';

export default async function HRDashboard() {
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

    const monthLabel = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    return (
        <div className="p-4 lg:p-6" style={{ fontFamily: SFT }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Bảng điều khiển</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Bảng điều khiển
                    </h1>
                    <p className="text-[13px] text-[#6E6E73] mt-0.5">
                        Tổng quan tuyển dụng — {monthLabel}
                    </p>
                </div>
                <Link
                    href="/jobs"
                    className="hidden sm:flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-4 py-2.5 text-[13px] transition-all shadow-sm shadow-[#0071E3]/20"
                    style={{ fontFamily: SFT, fontWeight: 500 }}
                >
                    Quản lý tuyển dụng <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* KPI Cards */}
            <DashboardKpiCards
                totalApplications={stats.totalApplications}
                openJobs={stats.openJobs}
                hiredThisMonth={hiredThisMonth}
            />

            {/* Trend Chart */}
            <ApplicationsTrendChart data={trendData} />

            {/* Pipeline + Recent Candidates */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <RecruitmentPipeline data={pipelineData} maxCount={maxPipelineCount} />
                <RecentCandidates applications={allApps} />
            </div>

            {/* Open Jobs */}
            <OpenJobsList jobs={stats.jobPostings} />
        </div>
    );
}
