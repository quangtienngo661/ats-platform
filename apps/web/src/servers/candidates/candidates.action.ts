'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import {
    ICandidateDto,
    IFindCandidatesQuery,
    IPaginatedCandidates,
} from '@/types/interfaces/candidate.interface';
import { IUserDto } from '@ats-platform/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CandidateActionState = {
    success: boolean;
    message: string;
    data?: ICandidateDto;
};

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

// ─── GET MY CANDIDATE PROFILE ─────────────────────────────────────────────────

/**
 * GET /candidates/me
 * Roles: candidate
 */
export async function getMyCandidateProfileAction(): Promise<ICandidateDto | null> {
    try {
        const response = await http.get('/candidates/me');
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── UPDATE MY CANDIDATE PROFILE ─────────────────────────────────────────────

/**
 * PATCH /candidates/me
 * Roles: candidate
 */
export async function updateMyCandidateProfileAction(
    prevState: CandidateActionState,
    formData: FormData
): Promise<CandidateActionState> {
    const currentTitle = (formData.get('currentTitle') as string)?.trim() || undefined;
    const yearsOfExperienceRaw = formData.get('yearsOfExperience');
    const yearsOfExperience = yearsOfExperienceRaw ? parseInt(yearsOfExperienceRaw as string, 10) : undefined;
    const phoneNumber = (formData.get('phoneNumber') as string)?.trim() || undefined;
    const fullName = (formData.get('fullName') as string)?.trim() || undefined;
    const summary = (formData.get('summary') as string)?.trim() || undefined;
    const location = (formData.get('location') as string)?.trim() || undefined;
    // const linkedin = (formData.get('linkedin') as string)?.trim() || undefined;
    // const github = (formData.get('github') as string)?.trim() || undefined;
    // const website = (formData.get('website') as string)?.trim() || undefined;

    try {
        const payload: {
            currentTitle?: string;
            yearsOfExperience?: number;
            profileData: Record<string, unknown>;
            userInfo: IUserDto;
        } = {
            userInfo: {},
            profileData: {}
        };

        if (currentTitle !== undefined) payload.currentTitle = currentTitle;
        if (yearsOfExperience !== undefined && !isNaN(yearsOfExperience)) {
            payload.yearsOfExperience = yearsOfExperience;
        }

        if (phoneNumber) {
            payload.userInfo.phoneNumber = phoneNumber ?? "";
        }

        if (fullName) {
            payload.userInfo.fullName = fullName ?? "";
        }

        if (summary) {
            payload.profileData.summary = summary ?? "";
        }

        if (location) {
            payload.profileData.location = location ?? "";
        }

        console.log(payload)

        // if (linkedin) {
        //     payload.profileData.linkedin = linkedin ?? "";
        // }

        // if (github) {
        //     payload.profileData.github = github ?? "";
        // }

        // if (website) {
        //     payload.profileData.website = website ?? "";
        // }

        const response = await http.patch('/candidates/me', payload);
        revalidatePath("/profile");
        return { success: true, message: 'Cập nhật hồ sơ thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật hồ sơ thất bại') };
    }
}

// ─── GET ALL CANDIDATES ───────────────────────────────────────────────────────

/**
 * GET /candidates
 * Roles: recruiter, admin
 */
export async function getCandidatesAction(query?: IFindCandidatesQuery): Promise<IPaginatedCandidates> {
    try {
        const params: Record<string, string | number> = {};
        if (query?.search) params.search = query.search;
        if (query?.status) params.status = query.status;
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;

        const response = await http.get('/candidates', { params });
        return response.data ?? response;
    } catch {
        return { data: [], total: 0, page: 1, limit: 10 };
    }
}

// ─── GET CANDIDATE BY ID ──────────────────────────────────────────────────────

/**
 * GET /candidates/:id
 * Roles: recruiter, admin
 */
export async function getCandidateByIdAction(id: string): Promise<ICandidateDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/candidates/${id}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}
