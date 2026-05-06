'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import {
    IApplicationDto,
    IApplicationHistoryItem,
    IGetApplicationsByJobQuery,
    IPaginatedApplications,
    IApplicationCard,
} from '@/types/interfaces/application.interface';
import { AiRecommendation, ApplicationStatus } from '@ats-platform/database';
import { IKanbanDto } from '@/types/interfaces/kanban.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationActionState = {
    success: boolean;
    message: string;
    data?: IApplicationDto;
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

function mapDtoToCard(dto: IApplicationDto): IApplicationCard {
    return {
        applicationId: dto.applicationId,
        candidateName: dto.candidate?.user?.fullName || '',
        jobTitle: dto.jobPosting?.title || '',
        appliedAt: dto.appliedAt || '',
        departmentName: dto.jobPosting?.department?.name || "",
        locationType: dto.jobPosting?.locationType || "",
        // currentStageSince: string,
        status: dto.status,
        cvId: dto.cvId || '',
        aiScore: dto.screening?.overallScore || 0,
        aiRecommendation: dto.screening?.aiRecommendation || '',
    }
}

// ─── APPLY FOR JOB ────────────────────────────────────────────────────────────

/**
 * POST /applications
 * Roles: candidate
 */
export async function applyForJobAction(
    prevState: ApplicationActionState,
    formData: FormData
): Promise<ApplicationActionState> {
    const jobId = (formData.get('jobId') as string)?.trim();
    const cvId = (formData.get('cvId') as string)?.trim();

    if (!jobId) return { success: false, message: 'Thiếu ID công việc' };
    if (!cvId) return { success: false, message: 'Vui lòng chọn CV để ứng tuyển' };

    try {
        const response = await http.post('/applications', { jobId, cvId });
        revalidatePath('/my-applications');
        return { success: true, message: 'Ứng tuyển thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Ứng tuyển thất bại') };
    }
}

// ─── GET MY APPLICATIONS ──────────────────────────────────────────────────────

/**
 * GET /applications/my
 * Roles: candidate
 */
export async function getMyApplicationsAction(): Promise<IApplicationCard[]> {
    try {
        const response = await http.get('/applications/my');
        const result = response.data.map((item: IApplicationDto) => mapDtoToCard(item));
        return result;
    } catch {
        return [];
    }
}

// ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────────

/**
 * POST /applications/:id/withdraw
 * Roles: candidate
 */
export async function withdrawApplicationAction(applicationId: string): Promise<ApplicationActionState> {
    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };
    try {
        const response = await http.post(`/applications/${applicationId}/withdraw`);
        revalidatePath('/my-applications');
        return { success: true, message: 'Rút đơn ứng tuyển thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Rút đơn ứng tuyển thất bại') };
    }
}

// ─── GET KANBAN BOARD ─────────────────────────────────────────────────────────

/**
 * GET /applications/board/:jobId
 * Roles: recruiter, admin
 */
export async function getKanbanBoardAction(jobId: string): Promise<IKanbanDto> {
    if (!jobId) return {} as IKanbanDto;
    try {
        const response = await http.get(`/applications/board/${jobId}`);
        return response.data ?? response;
    } catch {
        return {} as IKanbanDto;
    }
}

// ─── GET APPLICATIONS BY JOB ──────────────────────────────────────────────────

/**
 * GET /applications/job/:jobId
 * Roles: recruiter, admin
 */
export async function getApplicationsByJobAction(
    jobId: string,
    query?: IGetApplicationsByJobQuery
): Promise<IPaginatedApplications> {
    if (!jobId) return { data: [], total: 0, page: 1, limit: 10 };
    try {
        const params: Record<string, string | number | boolean> = {};
        if (query?.includeCancelled !== undefined) params.includeCancelled = query.includeCancelled;
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;

        const response = await http.get(`/applications/job/${jobId}`, { params });
        const payload = {
            data: response.data.items,
            total: response.data.pagination.total,
            page: response.data.pagination.page,
            limit: response.data.pagination.limit
        }

        return payload
    } catch {
        return { data: [], total: 0, page: 1, limit: 10 };
    }
}

// ─── UPDATE APPLICATION STATUS ────────────────────────────────────────────────

/**
 * PATCH /applications/:id/status
 * Roles: recruiter, admin
 */
export async function updateApplicationStatusAction(
    applicationId: string,
    status: string,
    isReverted?: boolean,
    notes?: string,
    rejectionReason?: string
): Promise<ApplicationActionState> {
    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };
    if (!status) return { success: false, message: 'Thiếu trạng thái mới' };
    if (isReverted === null || isReverted === undefined) isReverted = false;

    try {
        const payload: { status: string; isReverted: boolean; notes?: string; rejectionReason?: string } = { status, isReverted };
        if (notes) payload.notes = notes;
        if (rejectionReason) payload.rejectionReason = rejectionReason;

        const response = await http.patch(`/applications/${applicationId}/status`, payload);
        revalidatePath('/', 'layout');
        return { success: true, message: 'Cập nhật trạng thái thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật trạng thái thất bại') };
    }
}

// ─── TRIGGER CV SCREENING ─────────────────────────────────────────────────────

/**
 * POST /applications/:id/trigger-screening
 * Roles: recruiter, admin
 */
export async function triggerCvScreeningAction(
    prevState: ApplicationActionState,
    formData: FormData
): Promise<ApplicationActionState> {
    const applicationId = formData.get('applicationId') as string;
    const configId = formData.get('configId') as string;

    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };

    try {
        const response = await http.post(`/applications/${applicationId}/trigger-screening`, { configId });
        return { success: true, message: 'Kích hoạt sàng lọc CV thành công', data: response.data ?? response };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Kích hoạt sàng lọc CV thất bại') };
    }
}

// ─── GET APPLICATION HISTORY ──────────────────────────────────────────────────

/**
 * GET /applications/:id/history
 * Roles: recruiter, admin, candidate
 */
export async function getApplicationHistoryAction(applicationId: string): Promise<IApplicationHistoryItem[]> {
    if (!applicationId) return [];
    try {
        const response = await http.get(`/applications/${applicationId}/history`);
        return response.data ?? response;
    } catch {
        return [];
    }
}

// ─── GET APPLICATION BY ID ────────────────────────────────────────────────────

/**
 * GET /applications/:id
 * Roles: recruiter, admin, candidate (owner)
 */
export async function getApplicationByIdAction(applicationId: string): Promise<IApplicationDto> {
    if (!applicationId) return {} as IApplicationDto;
    try {
        const response = await http.get(`/applications/${applicationId}`);
        return response.data ?? response;
    } catch {
        return {} as IApplicationDto;
    }
}
