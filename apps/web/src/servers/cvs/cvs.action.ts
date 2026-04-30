'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { ICvDto } from '@/types/interfaces/cv.interface';
import { ICvParsedData } from '@ats-platform/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CvActionState = {
    success: boolean;
    message: string;
    data?: ICvDto;
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

// ─── UPLOAD CV ────────────────────────────────────────────────────────────────

/**
 * POST /cvs/upload
 * Roles: candidate
 * Note: file upload phải dùng FormData với multipart/form-data
 */
export async function uploadCvAction(
    prevState: CvActionState,
    formData: FormData
): Promise<CvActionState> {
    const file = formData.get('file') as File | null;
    // console.log(formData)
    // return { success: false, message: '' }

    if (!file) {
        return { success: false, message: 'Vui lòng chọn file CV' };
    }

    try {
        // Gửi FormData trực tiếp (axios tự set multipart header)
        const response = await http.post('/cvs/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        revalidatePath('/my-cvs');
        return { success: true, message: 'Tải CV lên thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tải CV lên thất bại') };
    }
}

// ─── GET MY CVs ───────────────────────────────────────────────────────────────

/**
 * GET /cvs/me
 * Roles: candidate
 */
export async function getMyCvsAction(): Promise<ICvDto[]> {
    try {
        const response = await http.get('/cvs/me');
        return response.data ?? response;
    } catch {
        return [];
    }
}

// ─── GET CV BY ID ─────────────────────────────────────────────────────────────

/**
 * GET /cvs/:cvId
 * Roles: admin, recruiter, candidate (owner)
 */
export async function getCvByIdAction(cvId: string): Promise<ICvDto | null> {
    if (!cvId) return null;
    try {
        const response = await http.get(`/cvs/${cvId}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── GET PARSED CV DATA ───────────────────────────────────────────────────────

/**
 * GET /cvs/:cvId/parsed-data
 * Roles: admin, recruiter, candidate (owner)
 */
export async function getCvParsedDataAction(cvId: string): Promise<ICvParsedData | null> {
    if (!cvId) return null;
    try {
        const response = await http.get(`/cvs/${cvId}/parsed-data`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── GET CV DOWNLOAD URL ──────────────────────────────────────────────────────

/**
 * GET /cvs/:cvId/download
 * Roles: admin, recruiter, candidate (owner)
 * Returns the download URL to redirect to
 */
export async function getCvDownloadUrlAction(cvId: string): Promise<string> {
    // Trả về URL để client redirect tới — server không xử lý stream file
    const { SERVER_URL } = await import('@/types/constants/urls');
    return `${SERVER_URL}/cvs/${cvId}/download`;
}

// ─── CONFIRM CV ───────────────────────────────────────────────────────────────

/**
 * POST /cvs/:cvId/confirm
 * Roles: candidate (owner)
 */
export async function confirmCvAction(
    prevState: CvActionState,
    formData: FormData
): Promise<CvActionState> {
    const cvId = formData.get('cvId') as string;
    const syncToProfile = formData.get('syncToProfile') === 'true';
    const markAsConfirmed = formData.get('markAsConfirmed') === 'true';


    if (!cvId) return { success: false, message: 'Thiếu ID CV' };

    try {
        const queryParams = new URLSearchParams({
            syncToProfile: String(syncToProfile),
            markAsConfirmed: String(markAsConfirmed)
        }).toString();

        let message: string = '';
        const response = await http.post(`/cvs/${cvId}/confirm?${queryParams}`);

        if (syncToProfile && markAsConfirmed) {
            message = 'Đã đồng bộ CV và xác nhận CV';
        } else if (syncToProfile) {
            message = 'Đã đồng bộ CV với profile';
        } else if (markAsConfirmed) {
            message = 'Đã xác nhận CV';
        }

        revalidatePath('/profile');
        return { success: true, message: message, data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xác nhận CV thất bại') };
    }
}

// ─── DELETE CV ────────────────────────────────────────────────────────────────

/**
 * DELETE /cvs/:cvId
 * Roles: candidate (owner)
 */
export async function deleteCvAction(cvId: string): Promise<CvActionState> {
    if (!cvId) return { success: false, message: 'Thiếu ID CV' };

    try {
        await http.delete(`/cvs/${cvId}`);
        revalidatePath('/profile');
        return { success: true, message: 'Xóa CV thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xóa CV thất bại') };
    }
}
