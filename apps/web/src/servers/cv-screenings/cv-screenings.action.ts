'use server';

import { rethrowReadError, isMissingResource } from '@/lib/action-error';

import http from '@/lib/http';
import { IScreeningResultDto, IScreeningStats, ICandidateScreeningResult } from '@/types/interfaces/cv-screening.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────



// ─── GET SCREENING STATS ──────────────────────────────────────────────────────
export async function getScreeningStatsAction(jobId: string): Promise<IScreeningStats | null> {
    if (!jobId) return null;
    try {
        const response = await http.get('/screening/stats', { params: { jobId } });
        return response.data as IScreeningStats;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET MY SCREENING RESULT (Candidate) ──────────────────────────────────────
export async function getMyScreeningResultAction(applicationId: string): Promise<ICandidateScreeningResult | null> {
    if (!applicationId) return null;
    try {
        const response = await http.get(`/screening/me/${applicationId}`);
        return response.data as ICandidateScreeningResult;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET FULL SCREENING RESULT (HR) ──────────────────────────────────────────
export async function getScreeningResultAction(applicationId: string): Promise<IScreeningResultDto | null> {
    if (!applicationId) return null;
    try {
        const response = await http.get(`/screening/${applicationId}`);
        return response.data as IScreeningResultDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}
