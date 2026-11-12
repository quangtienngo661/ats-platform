'use client';

import { useRouter } from 'next/navigation';

export const DASHBOARD_PERIODS = [7, 30, 90] as const;

interface DashboardFiltersProps {
    days: number;
    jobId?: string;
    jobs: { jobId: string; title: string }[];
}

const selectClass =
    'rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-[13px] text-[#1D1D1F] outline-none focus:border-[#0071E3]';

/** The dashboard's period and job live in the address, so a view can be shared and reloaded. */
export function DashboardFilters({ days, jobId, jobs }: DashboardFiltersProps) {
    const router = useRouter();
    const go = (nextDays: number, nextJobId?: string) => {
        const params = new URLSearchParams({ days: String(nextDays) });
        if (nextJobId) params.set('jobId', nextJobId);
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="dashboard-period">Khoảng thời gian</label>
            <select
                id="dashboard-period"
                value={String(days)}
                onChange={event => go(Number(event.target.value), jobId)}
                className={selectClass}
            >
                {DASHBOARD_PERIODS.map(period => (
                    <option key={period} value={period}>{period} ngày gần nhất</option>
                ))}
            </select>
            <label className="sr-only" htmlFor="dashboard-job">Tin tuyển dụng</label>
            <select
                id="dashboard-job"
                value={jobId ?? ''}
                onChange={event => go(days, event.target.value || undefined)}
                className={`${selectClass} max-w-[240px]`}
            >
                <option value="">Tất cả tin tuyển dụng</option>
                {jobs.map(job => (
                    <option key={job.jobId} value={job.jobId}>{job.title}</option>
                ))}
            </select>
        </div>
    );
}
