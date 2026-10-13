'use server';

import { actionErrorMessage as extractMessage, rethrowReadError, isMissingResource } from '@/lib/action-error';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { cookies } from 'next/headers';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobCategoryActionState = {
    success: boolean;
    message: string;
    data?: IJobCategoryDto;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────



// ─── GET ALL JOB CATEGORIES ───────────────────────────────────────────────────
/** The category API is staff-only. Public pages must not issue an unauthorized read. */
export async function getViewerJobCategoriesAction(): Promise<IJobCategoryDto[]> {
    const token = (await cookies()).get('accessToken')?.value;
    const role = token ? decodeTokenPayload(token)?.role : undefined;
    if (!role || !['admin', 'recruiter', 'org_admin'].includes(role)) return [];
    return getJobCategoriesAction();
}

export async function getJobCategoriesAction(): Promise<IJobCategoryDto[]> {
    try {
        const response = await http.get('/job-categories');
        return response.data as IJobCategoryDto[];
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET JOB CATEGORY BY ID ───────────────────────────────────────────────────
export async function getJobCategoryByIdAction(id: string): Promise<IJobCategoryDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/job-categories/${id}`);
        return response.data as IJobCategoryDto;
    } catch (error) {
        if (isMissingResource(error)) return null;
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
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
        return { success: true, message: 'Tạo danh mục thành công', data: response.data as IJobCategoryDto };
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
        return { success: true, message: 'Cập nhật danh mục thành công', data: response.data as IJobCategoryDto };
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
