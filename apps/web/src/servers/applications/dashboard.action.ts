'use server';

import { rethrowReadError } from '@/lib/action-error';

import http from '@/lib/http';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IDashboardStats {
    totalApplications: number;
    openJobs: number;
    recentApplications: IApplicationDto[];
    jobPostings: IJobPostingDto[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
export async function getDashboardStatsAction(): Promise<IDashboardStats> {
    try {
        const [allAppsRes, jobPostingsRes] = await Promise.all([
            http.get('/applications/board/all'),
            http.get('/job-postings', { params: { status: 'active', limit: 100 } }),
        ]);

        // Flatten board columns → flat array
        const boardData: Record<string, IApplicationDto[]> = allAppsRes?.data ?? {};
        const allApps: IApplicationDto[] = Object.values(boardData).flat();

        const jobPostings: IJobPostingDto[] = jobPostingsRes?.data?.items ?? [];
        const openJobs = jobPostings.length;

        // Sắp xếp theo ngày nộp gần nhất
        const recentApplications = [...allApps]
            .sort((a, b) => new Date(b.appliedAt ?? 0).getTime() - new Date(a.appliedAt ?? 0).getTime())
            .slice(0, 6);

        return {
            totalApplications: allApps.length,
            openJobs,
            recentApplications,
            jobPostings,
        };
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}
