'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import type { IUserDto } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';


// ─── State type ───────────────────────────────────────────────────────────────
export type UserActionState = {
    success: boolean;
    message: string;
    data?: IUserResponseDto;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return Array.isArray(msg) ? msg[0] : msg;
    }
    if (error instanceof Error) return error.message;
    return 'Đã xảy ra lỗi không xác định';
}

// ─── GET ME (current logged-in user) ─────────────────────────────────────────
export async function getMeAction(): Promise<IUserResponseDto | null> {
    try {
        const response = await http.get('/users/me');
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── UPDATE ME ────────────────────────────────────────────────────────────────
export async function updateMeAction(
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    const fullName = (formData.get('fullName') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || undefined;

    if (!fullName) return { success: false, message: 'Họ tên không được để trống' };

    try {
        const payload: { fullName: string; phone?: string } = { fullName };
        if (phone) payload.phone = phone;

        const response = await http.patch('/users/me', payload);
        return { success: true, message: 'Cập nhật thông tin thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err) };
    }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
export async function changePasswordAction(
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentPassword) return { success: false, message: 'Vui lòng nhập mật khẩu hiện tại' };
    if (!newPassword) return { success: false, message: 'Vui lòng nhập mật khẩu mới' };

    try {
        await http.post('/users/me/change-password', { currentPassword, newPassword });
        return { success: true, message: 'Đổi mật khẩu thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err) };
    }
}

// ─── GET USERS (server-side fetch, used in page.tsx) ─────────────────────────
// API returns array directly (axios interceptor unwraps response.data)
export async function getUsersAction(): Promise<IUserResponseDto[]> {
    try {
        const response = await http.get('/users');
        return response.data;
    } catch {
        return [];
    }
}

// ─── CREATE USER ─────────────────────────────────────────────────────────────
export async function createUserAction(
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    const fullName = (formData.get('fullName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const phoneNumber = (formData.get('phone') as string)?.trim() || undefined;
    const role = formData.get('role') as IUserDto['role'];
    const status = formData.get('status') as IUserDto['status'];

    if (!fullName || !email || !password) {
        return { success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
    }

    const payload: IUserDto = { fullName, email, password, role, status };
    if (phoneNumber) (payload as any).phoneNumber = phoneNumber;

    try {
        // API returns the created user object directly
        const created = await http.post('/users', payload);
        revalidatePath('/user-management');
        return { success: true, message: 'Tạo người dùng thành công', data: created.data };
    } catch (err) {
        return { success: false, message: extractMessage(err) };
    }
}

// ─── UPDATE USER ─────────────────────────────────────────────────────────────
export async function updateUserAction(
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    const userId = formData.get('userId') as string;
    const fullName = (formData.get('fullName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const phone = (formData.get('phone') as string)?.trim() || undefined;
    const role = formData.get('role') as IUserDto['role'];
    const status = formData.get('status') as IUserDto['status'];

    if (!userId) return { success: false, message: 'Thiếu ID người dùng' };
    if (!fullName) return { success: false, message: 'Họ tên không được để trống' };

    const payload: IUserDto = { fullName, email, role, status };
    if (password) payload.password = password;
    if (phone) (payload as any).phone = phone;

    try {
        // API returns the updated user object directly
        const updated = await http.patch(`/users/${userId}`, payload);
        revalidatePath('/user-management');
        return { success: true, message: 'Cập nhật người dùng thành công', data: updated.data };
    } catch (err) {
        return { success: false, message: extractMessage(err) };
    }
}

// ─── DELETE USER ─────────────────────────────────────────────────────────────
export async function deleteUserAction(userId: string): Promise<UserActionState> {
    if (!userId) return { success: false, message: 'Thiếu ID người dùng' };

    try {
        await http.delete(`/users/${userId}`);
        revalidatePath('/user-management');
        return { success: true, message: 'Xóa người dùng thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err) };
    }
}
