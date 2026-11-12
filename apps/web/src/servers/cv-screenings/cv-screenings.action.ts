'use server';

import { revalidatePath } from 'next/cache';
import { actionErrorMessage, rethrowReadError, isMissingResource } from '@/lib/action-error';

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

// ─── REVIEW SCREENING SCORES (HR) ────────────────────────────────────────────
export interface ReviewScreeningInput {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    note?: string;
}

export interface ReviewScreeningActionState {
    success: boolean;
    message: string;
}

/** Confirms or corrects the AI sub-scores. A note is required by the API when any score changes. */
export async function reviewScreeningAction(
    applicationId: string,
    input: ReviewScreeningInput,
): Promise<ReviewScreeningActionState> {
    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };

    const note = input.note?.trim();
    try {
        await http.patch(`/screening/${applicationId}/review`, {
            skillsScore: input.skillsScore,
            experienceScore: input.experienceScore,
            educationScore: input.educationScore,
            ...(note ? { note } : {}),
        });
        revalidatePath('/', 'layout');
        return { success: true, message: 'Đã lưu điểm duyệt' };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, 'Duyệt điểm thất bại. Vui lòng thử lại.') };
    }
}
