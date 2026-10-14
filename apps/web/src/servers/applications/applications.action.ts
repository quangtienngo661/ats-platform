'use server';

import { actionErrorMessage as extractMessage, apiErrorResponse, rethrowReadError } from '@/lib/action-error';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import type { IBulkScreeningResult } from '@ats-platform/types';
import { IApplicationDto, IApplicationHistoryItem, IGetApplicationsByJobQuery, IPaginatedApplications, IApplicationCard } from '@/types/interfaces/application.interface';

import { IKanbanDto } from '@/types/interfaces/kanban.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationActionState = {
    success: boolean;
    message: string;
    data?: IApplicationDto;
};

export type BulkScreeningActionState = {
    success: boolean;
    message: string;
    data?: IBulkScreeningResult;
};

export type ExportCsvActionState =
    | { success: true; filename: string; csv: string }
    | { success: false; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────



function mapDtoToCard(dto: IApplicationDto): IApplicationCard {
    return {
        applicationId: dto.applicationId,
        candidateName: dto.candidate?.user?.fullName || '',
        jobTitle: dto.jobPosting?.title || '',
        appliedAt: dto.appliedAt || '',
        departmentName: dto.jobPosting?.department?.name || "",
        locationType: dto.jobPosting?.locationType || "",
        status: dto.status,
        cvId: dto.cvId || '',
        aiScore: dto.screening?.overallScore || 0,
        aiRecommendation: dto.screening?.aiRecommendation || '',
    }
}

// ─── APPLY FOR JOB ────────────────────────────────────────────────────────────
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
        return { success: true, message: 'Ứng tuyển thành công', data: response.data as IApplicationDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Ứng tuyển thất bại') };
    }
}

// ─── GET MY APPLICATIONS ──────────────────────────────────────────────────────
export async function getMyApplicationsAction(): Promise<IApplicationCard[]> {
    try {
        const response = await http.get('/applications/my');
        const rawItems = (response.data ?? []) as IApplicationDto[];
        const result = rawItems.map((item: IApplicationDto) => mapDtoToCard(item));
        return result;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────────
export async function withdrawApplicationAction(applicationId: string): Promise<ApplicationActionState> {
    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };
    try {
        const response = await http.post(`/applications/${applicationId}/withdraw`);
        revalidatePath('/my-applications');
        return { success: true, message: 'Rút đơn ứng tuyển thành công', data: response.data as IApplicationDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Rút đơn ứng tuyển thất bại') };
    }
}

export async function withdrawApplicationFormAction(
    prevState: ApplicationActionState,
    formData: FormData,
): Promise<ApplicationActionState> {
    const applicationId = (formData.get('applicationId') as string)?.trim();
    return withdrawApplicationAction(applicationId);
}

// ─── GET KANBAN BOARD ─────────────────────────────────────────────────────────
export async function getKanbanBoardAction(jobId: string): Promise<IKanbanDto> {
    if (!jobId) return {} as IKanbanDto;
    try {
        const response = await http.get(`/applications/board/${jobId}`);
        return response.data as IKanbanDto;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

export async function getApplicationsByJobAction(
    jobId: string,
    query?: IGetApplicationsByJobQuery
): Promise<IPaginatedApplications> {
    if (!jobId) return { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    try {
        const params: Record<string, string | number | boolean> = {};
        if (query?.includeCancelled !== undefined) params.includeCancelled = query.includeCancelled;
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;

        const response = await http.get(`/applications/job/${jobId}`, { params });
        return response.data as IPaginatedApplications;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── UPDATE APPLICATION STATUS ────────────────────────────────────────────────
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
        return { success: true, message: 'Cập nhật trạng thái thành công', data: response.data as IApplicationDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật trạng thái thất bại') };
    }
}

// ─── TRIGGER CV SCREENING ─────────────────────────────────────────────────────
export async function triggerCvScreeningAction(
    prevState: ApplicationActionState,
    formData: FormData
): Promise<ApplicationActionState> {
    const applicationId = formData.get('applicationId') as string;
    const configId = formData.get('configId') as string;

    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };

    try {
        const response = await http.post(`/applications/${applicationId}/trigger-screening`, { configId });
        return { success: true, message: 'Kích hoạt sàng lọc CV thành công', data: response.data as IApplicationDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Kích hoạt sàng lọc CV thất bại') };
    }
}

// ─── BULK CV SCREENING ────────────────────────────────────────────────────────
export async function bulkScreenApplicationsAction(
    jobId: string,
    input: { applicationIds?: string[]; moveAppliedToScreening: boolean; configId?: string }
): Promise<BulkScreeningActionState> {
    try {
        const body: typeof input = { moveAppliedToScreening: input.moveAppliedToScreening };
        if (input.applicationIds !== undefined) body.applicationIds = input.applicationIds;
        if (input.configId !== undefined) body.configId = input.configId;

        const response = await http.post(`/applications/job/${jobId}/bulk-screening`, body);
        const data = response.data as IBulkScreeningResult;
        revalidatePath(`/jobs/${jobId}/candidates`);
        return { success: true, message: `Đã đưa ${data.queued.length} đơn vào hàng đợi`, data };
    } catch (err) {
        unstable_rethrow(err);
        if (apiErrorResponse(err)?.status === 429) {
            return {
                success: false,
                message: 'Bạn vừa gửi quá nhiều yêu cầu chấm hàng loạt. Vui lòng thử lại sau một phút.',
            };
        }
        return { success: false, message: extractMessage(err, 'Chấm CV hàng loạt thất bại') };
    }
}

// ─── EXPORT CANDIDATES CSV ────────────────────────────────────────────────────
export async function exportCandidatesCsvAction(jobId: string): Promise<ExportCsvActionState> {
    try {
        const csv = await http.get<string, string>(`/applications/job/${jobId}/export`, { responseType: 'text' });
        const { year, month, day } = Object.fromEntries(
            new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).formatToParts(new Date()).map(({ type, value }) => [type, value])
        );
        return { success: true, filename: `ung-vien-${jobId.slice(0, 8)}-${year}${month}${day}.csv`, csv };
    } catch (err) {
        unstable_rethrow(err);
        const response = apiErrorResponse(err);
        let data: unknown = response?.data;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                data = undefined;
            }
        }
        return {
            success: false,
            message: extractMessage({ response: { ...response, data } }, 'Xuất CSV thất bại'),
        };
    }
}

// ─── GET APPLICATION HISTORY ──────────────────────────────────────────────────
export async function getApplicationHistoryAction(applicationId: string): Promise<IApplicationHistoryItem[]> {
    if (!applicationId) return [];
    try {
        const response = await http.get(`/applications/${applicationId}/history`);
        return response.data as IApplicationHistoryItem[];
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

// ─── GET APPLICATION BY ID ────────────────────────────────────────────────────
export async function getApplicationByIdAction(applicationId: string): Promise<IApplicationDto> {
    if (!applicationId) return {} as IApplicationDto;
    try {
        const response = await http.get(`/applications/${applicationId}`);
        return response.data as IApplicationDto;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}
