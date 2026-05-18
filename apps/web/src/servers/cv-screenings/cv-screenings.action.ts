'use server';

import http from '@/lib/http';
import {
    IScreeningResultDto,
    IScreeningStats,
    ICandidateScreeningResult,
} from '@/types/interfaces/cv-screening.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return Array.isArray(msg) ? msg[0] : msg;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

// ─── GET SCREENING STATS ──────────────────────────────────────────────────────
export async function getScreeningStatsAction(jobId: string): Promise<IScreeningStats | null> {
    if (!jobId) return null;
    try {
        const response = await http.get('/screening/stats', { params: { jobId } });
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── GET MY SCREENING RESULT (Candidate) ──────────────────────────────────────
export async function getMyScreeningResultAction(applicationId: string): Promise<ICandidateScreeningResult | null> {
    if (!applicationId) return null;
    try {
        const response = await http.get(`/screening/me/${applicationId}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── GET FULL SCREENING RESULT (HR) ──────────────────────────────────────────
export async function getScreeningResultAction(applicationId: string): Promise<IScreeningResultDto | null> {
    if (!applicationId) return null;
    try {
        const response = await http.get(`/screening/${applicationId}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}
