'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import {
    IInterviewTopic,
    IInterviewResult,
    IInterviewSession,
    ISessionSummary,
    IResumeSession,
    IInterviewScheduleQuery,
    IPaginatedInterviewSchedules,
    IInterviewSchedule,
} from '@/types/interfaces/interview.interface';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { ApplicationStatus, DifficultyLevel, InterviewType, ScheduleStatus } from '@ats-platform/types';

export type StartSessionActionState = {
    success: boolean;
    message: string;
    sessionId?: string;
};

export type InterviewScheduleActionState = {
    success: boolean;
    message: string;
    data?: IInterviewSchedule;
};

export type InterviewTopicActionState = {
    success: boolean;
    message: string;
    data?: IInterviewTopic;
};

type SchedulePayload = {
    applicationId: string;
    interviewerId: string;
    interviewType: InterviewType;
    scheduledDate: string;
    scheduledTime: string;
};

type NormalizedSchedulePayload =
    | { ok: false; error: string }
    | { ok: true; payload: SchedulePayload };

function extractMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return Array.isArray(msg) ? msg[0] : msg;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

function getString(formData: FormData, key: string) {
    return (formData.get(key) as string | null)?.trim() ?? '';
}

function toLocalDateIso(date: string) {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

function toLocalDateTimeIso(date: string, time: string) {
    const source = time.includes('T') ? time : `${date}T${time}:00`;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

function normalizeSchedulePayload(formData: FormData): NormalizedSchedulePayload {
    const applicationId = getString(formData, 'applicationId');
    const interviewerId = getString(formData, 'interviewerId');
    const scheduledDate = getString(formData, 'scheduledDate');
    const scheduledTime = getString(formData, 'scheduledTime');

    if (!applicationId) return { ok: false, error: 'Vui lòng chọn ứng viên cần phỏng vấn' };
    if (!interviewerId) return { ok: false, error: 'Vui lòng chọn người phỏng vấn' };
    if (!scheduledDate) return { ok: false, error: 'Vui lòng chọn ngày phỏng vấn' };
    if (!scheduledTime) return { ok: false, error: 'Vui lòng chọn giờ phỏng vấn' };

    const scheduledDateIso = toLocalDateIso(scheduledDate);
    const scheduledTimeIso = toLocalDateTimeIso(scheduledDate, scheduledTime);

    if (!scheduledDateIso || !scheduledTimeIso) {
        return { ok: false, error: 'Ngày hoặc giờ phỏng vấn không hợp lệ' };
    }

    return {
        ok: true,
        payload: {
            applicationId,
            interviewerId,
            interviewType: InterviewType.onsite,
            scheduledDate: scheduledDateIso,
            scheduledTime: scheduledTimeIso,
        },
    };
}


export async function getInterviewTopicsAction(): Promise<IInterviewTopic[]> {
    try {
        const response = await http.get('/interviews/topics');
        return response.data as unknown as IInterviewTopic[];
    } catch {
        return [];
    }
}

export async function createInterviewTopicAction(
    prevState: InterviewTopicActionState,
    formData: FormData,
): Promise<InterviewTopicActionState> {
    const name = getString(formData, 'name');
    const categoryId = getString(formData, 'categoryId') || null;

    if (!name) return { success: false, message: 'Vui lòng nhập tên chủ đề phỏng vấn' };

    try {
        const response = await http.post('/interviews/topics', {
            name,
            categoryId,
        });
        revalidatePath('/interview-topic-management');
        revalidatePath('/mock-interview');
        return { success: true, message: 'Tạo chủ đề phỏng vấn thành công', data: response.data ?? response };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Tạo chủ đề phỏng vấn thất bại') };
    }
}

export async function updateInterviewTopicAction(
    prevState: InterviewTopicActionState,
    formData: FormData,
): Promise<InterviewTopicActionState> {
    const topicId = getString(formData, 'topicId');
    const name = getString(formData, 'name');
    const categoryId = getString(formData, 'categoryId') || null;

    if (!topicId) return { success: false, message: 'Thiếu ID chủ đề phỏng vấn' };
    if (!name) return { success: false, message: 'Tên chủ đề phỏng vấn không được để trống' };

    try {
        const response = await http.patch(`/interviews/topics/${topicId}`, {
            name,
            categoryId,
        });
        revalidatePath('/interview-topic-management');
        revalidatePath('/mock-interview');
        return { success: true, message: 'Cập nhật chủ đề phỏng vấn thành công', data: response.data ?? response };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Cập nhật chủ đề phỏng vấn thất bại') };
    }
}

export async function deleteInterviewTopicAction(
    prevState: InterviewTopicActionState,
    formData: FormData,
): Promise<InterviewTopicActionState> {
    const topicId = getString(formData, 'topicId');
    if (!topicId) return { success: false, message: 'Thiếu ID chủ đề phỏng vấn' };

    try {
        await http.delete(`/interviews/topics/${topicId}`);
        revalidatePath('/interview-topic-management');
        revalidatePath('/mock-interview');
        return { success: true, message: 'Xóa chủ đề phỏng vấn thành công' };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Xóa chủ đề phỏng vấn thất bại') };
    }
}



export async function getMyInterviewSchedulesAction(
    query?: IInterviewScheduleQuery,
): Promise<IPaginatedInterviewSchedules> {
    try {
        const params: Record<string, string | number> = {};
        if (query?.applicationId) params.applicationId = query.applicationId;
        if (query?.status) params.status = query.status;
        if (query?.fromDate) params.fromDate = query.fromDate;
        if (query?.toDate) params.toDate = query.toDate;
        if (query?.page) params.page = query.page;
        if (query?.limit) params.limit = query.limit;

        const response = await http.get('/interviews/schedules/my', { params });
        return response.data as IPaginatedInterviewSchedules;
    } catch {
        return { items: [], pagination: { total: 0, page: 1, limit: query?.limit ?? 20, totalPages: 0 } };
    }
}

export async function createInterviewScheduleAction(
    prevState: InterviewScheduleActionState,
    formData: FormData,
): Promise<InterviewScheduleActionState> {
    const normalized = normalizeSchedulePayload(formData);
    if (!normalized.ok) return { success: false, message: normalized.error };

    try {
        const response = await http.post('/interviews/schedules', normalized.payload);
        revalidatePath('/interviews');
        return { success: true, message: 'Đặt lịch phỏng vấn thành công', data: response.data ?? response };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Đặt lịch phỏng vấn thất bại') };
    }
}

export async function updateInterviewScheduleAction(
    prevState: InterviewScheduleActionState,
    formData: FormData,
): Promise<InterviewScheduleActionState> {
    const interviewId = getString(formData, 'interviewId');
    if (!interviewId) return { success: false, message: 'Thiếu ID lịch phỏng vấn' };

    const normalized = normalizeSchedulePayload(formData);
    if (!normalized.ok) return { success: false, message: normalized.error };

    const { applicationId, ...payload } = normalized.payload;

    try {
        const response = await http.patch(`/interviews/schedules/${interviewId}`, payload);
        revalidatePath('/interviews');
        return { success: true, message: 'Đổi lịch phỏng vấn thành công', data: response.data ?? response };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Đổi lịch phỏng vấn thất bại') };
    }
}

async function updateInterviewScheduleStatusAction(
    interviewId: string,
    status: ScheduleStatus,
    successMessage: string,
    fallbackMessage: string,
): Promise<InterviewScheduleActionState> {
    if (!interviewId) return { success: false, message: 'Thiếu ID lịch phỏng vấn' };

    try {
        const response = await http.patch(`/interviews/schedules/${interviewId}`, { status });
        revalidatePath('/interviews');
        return { success: true, message: successMessage, data: response.data ?? response };
    } catch (error) {
        return { success: false, message: extractMessage(error, fallbackMessage) };
    }
}

export async function cancelInterviewScheduleAction(interviewId: string): Promise<InterviewScheduleActionState> {
    return updateInterviewScheduleStatusAction(
        interviewId,
        ScheduleStatus.cancelled,
        'Hủy lịch phỏng vấn thành công',
        'Hủy lịch phỏng vấn thất bại',
    );
}

export async function completeInterviewScheduleAction(interviewId: string): Promise<InterviewScheduleActionState> {
    return updateInterviewScheduleStatusAction(
        interviewId,
        ScheduleStatus.completed,
        'Cập nhật lịch phỏng vấn thành công',
        'Cập nhật lịch phỏng vấn thất bại',
    );
}

export async function getSchedulableInterviewApplicationsAction(): Promise<IApplicationDto[]> {
    try {
        const response = await http.get('/applications/board/all');
        const board = response.data ?? response;
        return (board?.[ApplicationStatus.interview] ?? []) as IApplicationDto[];
    } catch {
        return [];
    }
}

export async function startInterviewSessionAction(
    topicId: string,
    difficultyLevel: DifficultyLevel,
    candidateContext?: string,
): Promise<StartSessionActionState> {
    try {
        const response = await http.post('/interviews/sessions', {
            topicId,
            difficultyLevel,
            candidateContext,
        });
        const data = response.data as unknown as { sessionId: string };
        return { success: true, message: 'Phiên phỏng vấn đã được tạo', sessionId: data.sessionId };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Không thể tạo phiên phỏng vấn') };
    }
}

export async function resumeInterviewSessionAction(): Promise<IResumeSession | null> {
    try {
        const response = await http.get('/interviews/sessions/resume');
        return response.data as unknown as IResumeSession;
    } catch {
        return null;
    }
}

export async function getInterviewResultAction(sessionId: string): Promise<IInterviewResult | null> {
    try {
        const response = await http.get(`/interviews/sessions/${sessionId}/result`);
        return response.data;
    } catch {
        return null;
    }
}

export async function getInterviewById(sessionId: string): Promise<IInterviewSession | null> {
    try {
        const response = await http.get(`/interviews/sessions/${sessionId}`);
        return response.data;
    } catch {
        return null;
    }
}

export async function abandonInterviewSessionAction(sessionId: string): Promise<boolean> {
    try {
        await http.patch(`/interviews/sessions/${sessionId}/abandon`);
        return true;
    } catch {
        return false;
    }
}

export async function getMySessionsAction(): Promise<ISessionSummary[]> {
    try {
        const response = await http.get('/interviews/sessions/my');
        return response.data as unknown as ISessionSummary[];
    } catch {
        return [];
    }
}
