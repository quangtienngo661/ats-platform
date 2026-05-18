'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobCategoryActionState = {
    success: boolean;
    message: string;
    data?: IJobCategoryDto;
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

// ─── GET ALL JOB CATEGORIES ───────────────────────────────────────────────────
export async function getJobCategoriesAction(): Promise<IJobCategoryDto[]> {
    try {
        const response = await http.get('/job-categories');
        return response.data ?? response;
    } catch {
        return [];
    }
}

// ─── GET JOB CATEGORY BY ID ───────────────────────────────────────────────────
export async function getJobCategoryByIdAction(id: string): Promise<IJobCategoryDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/job-categories/${id}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── CREATE JOB CATEGORY ──────────────────────────────────────────────────────
export async function createJobCategoryAction(
    prevState: JobCategoryActionState,
    formData: FormData
): Promise<JobCategoryActionState> {
    const name = (formData.get('name') as string)?.trim();
    const parentCategoryId = (formData.get('parentCategoryId') as string)?.trim() || undefined;

    if (!name) {
        return { success: false, message: 'Vui lòng nhập tên danh mục' };
    }

    try {
        const payload: { name: string; parentCategoryId?: string } = { name };
        if (parentCategoryId) payload.parentCategoryId = parentCategoryId;

        const response = await http.post('/job-categories', payload);
        revalidatePath('/job-category-management');
        return { success: true, message: 'Tạo danh mục thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tạo danh mục thất bại') };
    }
}

// ─── UPDATE JOB CATEGORY ──────────────────────────────────────────────────────
export async function updateJobCategoryAction(
    prevState: JobCategoryActionState,
    formData: FormData
): Promise<JobCategoryActionState> {
    const categoryId = formData.get('categoryId') as string;
    const name = (formData.get('name') as string)?.trim();
    const parentCategoryId = (formData.get('parentCategoryId') as string)?.trim() || undefined;

    if (!categoryId) return { success: false, message: 'Thiếu ID danh mục' };
    if (!name) return { success: false, message: 'Tên danh mục không được để trống' };

    try {
        const payload: { name: string; parentCategoryId?: string } = { name };
        if (parentCategoryId !== undefined) payload.parentCategoryId = parentCategoryId;

        const response = await http.patch(`/job-categories/${categoryId}`, payload);
        revalidatePath('/job-category-management');
        return { success: true, message: 'Cập nhật danh mục thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật danh mục thất bại') };
    }
}

// ─── DELETE JOB CATEGORY ──────────────────────────────────────────────────────
export async function deleteJobCategoryAction(categoryId: string): Promise<JobCategoryActionState> {
    if (!categoryId) return { success: false, message: 'Thiếu ID danh mục' };

    try {
        await http.delete(`/job-categories/${categoryId}`);
        revalidatePath('/job-category-management');
        return { success: true, message: 'Xóa danh mục thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xóa danh mục thất bại') };
    }
}
