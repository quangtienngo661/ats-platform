'use server';

import { actionErrorMessage as extractMessage, rethrowReadError, isMissingResource } from '@/lib/action-error';

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


// ─── GET ME (current logged-in user) ─────────────────────────────────────────
export async function getMeAction(): Promise<IUserResponseDto | null> {
    try {
        const response = await http.get('/users/me');
        return response.data as IUserResponseDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
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
        const payload: { fullName: string; phoneNumber: string } = { fullName, phoneNumber: phone ?? '' };

        const response = await http.patch('/users/me', payload);
        revalidatePath('/my-profile');
        revalidatePath('/profile');
        return { success: true, message: 'Cập nhật thông tin thành công', data: response.data as IUserResponseDto };
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
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
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
    const organizationId = (formData.get('organizationId') as string)?.trim();
    if (role === 'org_admin' && !organizationId) return { success: false, message: 'Vui lòng chọn tổ chức' };

    if (!fullName || !email || !password) {
        return { success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
    }

    const payload: IUserDto = { fullName, email, password, role, status };
    if (role === 'org_admin') payload.organizationId = organizationId;
    if (phoneNumber) payload.phoneNumber = phoneNumber;

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
    const organizationId = (formData.get('organizationId') as string)?.trim();
    if (role === 'org_admin' && !organizationId) return { success: false, message: 'Vui lòng chọn tổ chức' };

    if (!userId) return { success: false, message: 'Thiếu ID người dùng' };
    if (!fullName) return { success: false, message: 'Họ tên không được để trống' };

    const payload: IUserDto = { fullName, email, role, status };
    if (role === 'org_admin') payload.organizationId = organizationId;
    if (password) payload.password = password;
    if (phone) payload.phoneNumber = phone;

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
