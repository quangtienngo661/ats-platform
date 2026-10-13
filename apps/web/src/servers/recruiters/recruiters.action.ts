'use server';

import { actionErrorMessage as extractMessage, rethrowReadError, isMissingResource } from '@/lib/action-error';

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




// ─── GET MY RECRUITER PROFILE ─────────────────────────────────────────────────
export async function getMyRecruiterProfileAction(): Promise<IRecruiterDto | null> {
    try {
        const response = await http.get('/recruiters/me');
        return response.data as IRecruiterDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── UPDATE MY RECRUITER PROFILE ─────────────────────────────────────────────
export async function updateMyRecruiterProfileAction(
    prevState: RecruiterActionState,
    formData: FormData
): Promise<RecruiterActionState> {
    const position = (formData.get('position') as string)?.trim() || undefined;

    try {
        const payload: { position?: string } = {};
        if (position !== undefined) payload.position = position;

        const response = await http.patch('/recruiters/me', payload);
        return { success: true, message: 'Cập nhật hồ sơ thành công', data: response.data as IRecruiterDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật hồ sơ thất bại') };
    }
}

// ─── GET ALL RECRUITERS ───────────────────────────────────────────────────────
export async function getRecruitersAction(): Promise<IRecruiterDto[]> {
    try {
        const response = await http.get('/recruiters');
        return response.data as IRecruiterDto[];
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET RECRUITER BY ID ──────────────────────────────────────────────────────
export async function getRecruiterByIdAction(id: string): Promise<IRecruiterDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/recruiters/${id}`);
        return response.data as IRecruiterDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── CREATE RECRUITER ─────────────────────────────────────────────────────────
export async function createRecruiterAction(
    prevState: RecruiterActionState,
    formData: FormData
): Promise<RecruiterActionState> {
    const userId = (formData.get('userId') as string)?.trim();
    const departmentId = (formData.get('departmentId') as string)?.trim();
    const position = (formData.get('position') as string)?.trim();

    const newAccount = formData.get('accountMode') === 'new';
    const fullName = (formData.get('fullName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    if (newAccount && (!fullName || !email || !password)) return { success: false, message: 'Vui lòng nhập họ tên, email và mật khẩu' };
    if (!newAccount && !userId) return { success: false, message: 'Thiếu ID người dùng' };
    if (!departmentId) return { success: false, message: 'Thiếu ID phòng ban' };
    if (!position) return { success: false, message: 'Vui lòng nhập chức vụ' };

    try {
        const response = newAccount
            ? await http.post('/recruiters/accounts', { fullName, email, password, departmentId, position })
            : await http.post('/recruiters', { userId, departmentId, position });
        revalidatePath('/recruiter-management');
        return { success: true, message: 'Tạo nhà tuyển dụng thành công', data: response.data as IRecruiterDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tạo nhà tuyển dụng thất bại') };
    }
}

// ─── UPDATE RECRUITER (ADMIN) ─────────────────────────────────────────────────
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
        return { success: true, message: 'Cập nhật nhà tuyển dụng thành công', data: response.data as IRecruiterDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật nhà tuyển dụng thất bại') };
    }
}

// ─── DELETE RECRUITER ─────────────────────────────────────────────────────────
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
