'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecruiterActionState = {
    success: boolean;
    message: string;
    data?: IRecruiterDto;
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

// ─── GET MY RECRUITER PROFILE ─────────────────────────────────────────────────

/**
 * GET /recruiters/me
 * Roles: recruiter
 */
export async function getMyRecruiterProfileAction(): Promise<IRecruiterDto | null> {
    try {
        const response = await http.get('/recruiters/me');
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── UPDATE MY RECRUITER PROFILE ─────────────────────────────────────────────

/**
 * PATCH /recruiters/me
 * Roles: recruiter
 */
export async function updateMyRecruiterProfileAction(
    prevState: RecruiterActionState,
    formData: FormData
): Promise<RecruiterActionState> {
    const position = (formData.get('position') as string)?.trim() || undefined;
    const departmentId = (formData.get('departmentId') as string)?.trim() || undefined;

    try {
        const payload: { position?: string; departmentId?: string } = {};
        if (position !== undefined) payload.position = position;
        if (departmentId !== undefined) payload.departmentId = departmentId;

        const response = await http.patch('/recruiters/me', payload);
        return { success: true, message: 'Cập nhật hồ sơ thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật hồ sơ thất bại') };
    }
}

// ─── GET ALL RECRUITERS ───────────────────────────────────────────────────────

/**
 * GET /recruiters
 * Roles: admin, recruiter
 */
export async function getRecruitersAction(): Promise<IRecruiterDto[]> {
    try {
        const response = await http.get('/recruiters');
        return response.data ?? response;
    } catch {
        return [];
    }
}

// ─── GET RECRUITER BY ID ──────────────────────────────────────────────────────

/**
 * GET /recruiters/:id
 * Roles: admin, recruiter
 */
export async function getRecruiterByIdAction(id: string): Promise<IRecruiterDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/recruiters/${id}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── CREATE RECRUITER ─────────────────────────────────────────────────────────

/**
 * POST /recruiters
 * Roles: admin
 */
export async function createRecruiterAction(
    prevState: RecruiterActionState,
    formData: FormData
): Promise<RecruiterActionState> {
    const userId = (formData.get('userId') as string)?.trim();
    const departmentId = (formData.get('departmentId') as string)?.trim();
    const position = (formData.get('position') as string)?.trim();

    if (!userId) return { success: false, message: 'Thiếu ID người dùng' };
    if (!departmentId) return { success: false, message: 'Thiếu ID phòng ban' };
    if (!position) return { success: false, message: 'Vui lòng nhập chức vụ' };

    try {
        const response = await http.post('/recruiters', { userId, departmentId, position });
        revalidatePath('/recruiter-management');
        return { success: true, message: 'Tạo nhà tuyển dụng thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tạo nhà tuyển dụng thất bại') };
    }
}

// ─── UPDATE RECRUITER (ADMIN) ─────────────────────────────────────────────────

/**
 * PATCH /recruiters/:id
 * Roles: admin
 */
export async function updateRecruiterAction(
    prevState: RecruiterActionState,
    formData: FormData
): Promise<RecruiterActionState> {
    const recruiterId = formData.get('recruiterId') as string;
    const position = (formData.get('position') as string)?.trim() || undefined;
    const departmentId = (formData.get('departmentId') as string)?.trim() || undefined;

    if (!recruiterId) return { success: false, message: 'Thiếu ID nhà tuyển dụng' };

    try {
        const payload: { position?: string; departmentId?: string } = {};
        if (position !== undefined) payload.position = position;
        if (departmentId !== undefined) payload.departmentId = departmentId;

        const response = await http.patch(`/recruiters/${recruiterId}`, payload);
        revalidatePath('/recruiter-management');
        return { success: true, message: 'Cập nhật nhà tuyển dụng thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật nhà tuyển dụng thất bại') };
    }
}

// ─── DELETE RECRUITER ─────────────────────────────────────────────────────────

/**
 * DELETE /recruiters/:id
 * Roles: admin
 */
export async function deleteRecruiterAction(recruiterId: string): Promise<RecruiterActionState> {
    if (!recruiterId) return { success: false, message: 'Thiếu ID nhà tuyển dụng' };

    try {
        await http.delete(`/recruiters/${recruiterId}`);
        revalidatePath('/recruiter-management');
        return { success: true, message: 'Xóa nhà tuyển dụng thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xóa nhà tuyển dụng thất bại') };
    }
}
