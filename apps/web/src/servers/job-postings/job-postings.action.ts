'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import {
    IJobPostingDto,
    IFindJobPostingsQuery,
    IPaginatedJobPostings,
} from '@/types/interfaces/job-posting.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobPostingActionState = {
    success: boolean;
    message: string;
    data?: IJobPostingDto;
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

// ─── GET ALL JOB POSTINGS ─────────────────────────────────────────────────────

/**
 * GET /job-postings
 * Roles: public (no auth required)
 */
export async function getJobPostingsAction(query?: IFindJobPostingsQuery): Promise<IPaginatedJobPostings> {
    try {
        const params: Record<string, string | number> = {};
        if (query?.status) params.status = query.status;
        if (query?.departmentId) params.departmentId = query.departmentId;
        if (query?.categoryId) params.categoryId = query.categoryId;
        if (query?.search) params.search = query.search;
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;

        const response = await http.get('/job-postings');
        return {
            data: response.data.items,
            total: response.data.pagination.total,
            page: query?.page ?? 1,
            limit: query?.limit ?? 20,
        };
    } catch {
        return { data: [], total: 0, page: 1, limit: 20 };
    }
}

// ─── GET JOB POSTING BY ID ────────────────────────────────────────────────────

/**
 * GET /job-postings/:id
 * Roles: public (no auth required)
 */
export async function getJobPostingByIdAction(id: string): Promise<IJobPostingDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/job-postings/${id}`);
        return response.data ?? response;
    } catch {
        return null;
    }
}

// ─── CREATE JOB POSTING ───────────────────────────────────────────────────────

/**
 * POST /job-postings
 * Roles: admin, recruiter
 */
export async function createJobPostingAction(
    prevState: JobPostingActionState,
    formData: FormData
): Promise<JobPostingActionState> {
    const departmentId = (formData.get('departmentId') as string)?.trim();
    const title = (formData.get('title') as string)?.trim();
    const locationType = (formData.get('locationType') as string)?.trim();
    const categoryId = (formData.get('categoryId') as string)?.trim() || undefined;
    const salaryMinRaw = formData.get('salaryMin');
    const salaryMaxRaw = formData.get('salaryMax');
    const description = (formData.get('description') as string)?.trim() || undefined;
    const parsedRequirements = (formData.get('parsedRequirements') as string)?.trim() || undefined;
    const status = (formData.get('status') as string)?.trim() || undefined;
    const publishedAt = (formData.get('publishedAt') as string)?.trim() || undefined;

    if (!departmentId) return { success: false, message: 'Vui lòng chọn phòng ban' };
    if (!title) return { success: false, message: 'Vui lòng nhập tiêu đề công việc' };
    if (!locationType) return { success: false, message: 'Vui lòng chọn hình thức làm việc' };

    try {
        const payload: Record<string, unknown> = { departmentId, title, locationType };
        if (categoryId) payload.categoryId = categoryId;
        if (salaryMinRaw) payload.salaryMin = parseFloat(salaryMinRaw as string);
        if (salaryMaxRaw) payload.salaryMax = parseFloat(salaryMaxRaw as string);
        if (description) payload.description = description;
        if (parsedRequirements) payload.parsedRequirements = parsedRequirements;
        if (status) payload.status = status;
        if (publishedAt) payload.publishedAt = publishedAt;

        // Skills được xử lý riêng (JSON string từ hidden input)
        const skillsRaw = formData.get('skills') as string | null;
        if (skillsRaw) {
            try { payload.skills = JSON.parse(skillsRaw); } catch { /* bỏ qua */ }
        }

        const response = await http.post('/job-postings', payload);
        revalidatePath('/job-management');
        return { success: true, message: 'Tạo tin tuyển dụng thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tạo tin tuyển dụng thất bại') };
    }
}

// ─── UPDATE JOB POSTING ───────────────────────────────────────────────────────

/**
 * PATCH /job-postings/:id
 * Roles: admin, recruiter (owner)
 */
export async function updateJobPostingAction(
    prevState: JobPostingActionState,
    formData: FormData
): Promise<JobPostingActionState> {
    const jobId = formData.get('jobId') as string;

    if (!jobId) return { success: false, message: 'Thiếu ID tin tuyển dụng' };

    try {
        const payload: Record<string, unknown> = {};

        const departmentId = (formData.get('departmentId') as string)?.trim();
        const title = (formData.get('title') as string)?.trim();
        const locationType = (formData.get('locationType') as string)?.trim();
        const categoryId = (formData.get('categoryId') as string)?.trim() || undefined;
        const salaryMinRaw = formData.get('salaryMin');
        const salaryMaxRaw = formData.get('salaryMax');
        const description = (formData.get('description') as string)?.trim() || undefined;
        const parsedRequirements = (formData.get('parsedRequirements') as string)?.trim() || undefined;
        const status = (formData.get('status') as string)?.trim() || undefined;
        const publishedAt = (formData.get('publishedAt') as string)?.trim() || undefined;

        if (departmentId) payload.departmentId = departmentId;
        if (title) payload.title = title;
        if (locationType) payload.locationType = locationType;
        if (categoryId !== undefined) payload.categoryId = categoryId;
        if (salaryMinRaw) payload.salaryMin = parseFloat(salaryMinRaw as string);
        if (salaryMaxRaw) payload.salaryMax = parseFloat(salaryMaxRaw as string);
        if (description !== undefined) payload.description = description;
        if (parsedRequirements !== undefined) payload.parsedRequirements = parsedRequirements;
        if (status) payload.status = status;
        if (publishedAt) payload.publishedAt = publishedAt;

        const skillsRaw = formData.get('skills') as string | null;
        if (skillsRaw) {
            try { payload.skills = JSON.parse(skillsRaw); } catch { /* bỏ qua */ }
        }

        const response = await http.patch(`/job-postings/${jobId}`, payload);
        revalidatePath('/job-management');
        return { success: true, message: 'Cập nhật tin tuyển dụng thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật tin tuyển dụng thất bại') };
    }
}

// ─── DELETE JOB POSTING ───────────────────────────────────────────────────────

/**
 * DELETE /job-postings/:id
 * Roles: admin, recruiter (owner)
 */
export async function deleteJobPostingAction(jobId: string): Promise<JobPostingActionState> {
    if (!jobId) return { success: false, message: 'Thiếu ID tin tuyển dụng' };

    try {
        await http.delete(`/job-postings/${jobId}`);
        revalidatePath('/job-management');
        return { success: true, message: 'Xóa tin tuyển dụng thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xóa tin tuyển dụng thất bại') };
    }
}
