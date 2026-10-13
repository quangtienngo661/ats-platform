'use server';

import { actionErrorMessage as extractMessage, rethrowReadError, isMissingResource } from '@/lib/action-error';

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



// ─── UPLOAD CV ────────────────────────────────────────────────────────────────
export async function uploadCvAction(
    prevState: CvActionState,
    formData: FormData
): Promise<CvActionState> {
    const file = formData.get('file') as File | null;

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
export async function getMyCvsAction(): Promise<ICvDto[]> {
    try {
        const response = await http.get('/cvs/me');
        return response.data as ICvDto[];
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET CV BY ID ─────────────────────────────────────────────────────────────
export async function getCvByIdAction(cvId: string): Promise<ICvDto | null> {
    if (!cvId) return null;
    try {
        const response = await http.get(`/cvs/${cvId}`);
        return response.data as ICvDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET PARSED CV DATA ───────────────────────────────────────────────────────
export async function getCvParsedDataAction(cvId: string): Promise<ICvParsedData | null> {
    if (!cvId) return null;
    try {
        const response = await http.get(`/cvs/${cvId}/parsed-data`);
        return response.data as ICvParsedData;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET CV DOWNLOAD URL ──────────────────────────────────────────────────────

// ─── CONFIRM CV ───────────────────────────────────────────────────────────────
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

        let message = '';
        const response = await http.post(`/cvs/${cvId}/confirm?${queryParams}`);

        if (syncToProfile && markAsConfirmed) {
            message = 'Đã đồng bộ CV và xác nhận CV';
        } else if (syncToProfile) {
            message = 'Đã đồng bộ CV với profile';
        } else if (markAsConfirmed) {
            message = 'Đã xác nhận CV';
        }

        revalidatePath('/profile');
        return { success: true, message: message, data: response.data as ICvDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xác nhận CV thất bại') };
    }
}

// ─── DELETE CV ────────────────────────────────────────────────────────────────
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
