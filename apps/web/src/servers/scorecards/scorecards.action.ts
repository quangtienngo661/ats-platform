'use server';

import { actionErrorMessage as extractMessage, rethrowReadError } from '@/lib/action-error';
import http from '@/lib/http';
import type { IScorecard, IScorecardInput, IScorecardListItem } from '@/types/interfaces/evaluation.interface';
import { revalidatePath } from 'next/cache';

export type ScorecardActionState = {
    success: boolean;
    message: string;
    data?: IScorecard;
};

export async function getApplicationScorecardsAction(applicationId: string): Promise<IScorecardListItem[]> {
    try {
        const response = await http.get(`/interview-scorecards/application/${applicationId}`);
        return response.data as IScorecardListItem[];
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

export async function submitScorecardAction(
    interviewId: string,
    input: IScorecardInput,
): Promise<ScorecardActionState> {
    if (!interviewId) return { success: false, message: 'Thiếu ID lịch phỏng vấn' };

    const payload: IScorecardInput = {
        technicalSkills: input.technicalSkills,
        problemSolving: input.problemSolving,
        communication: input.communication,
        cultureFit: input.cultureFit,
        recommendation: input.recommendation,
    };
    const comment = input.comment?.trim();
    if (comment) payload.comment = comment;

    try {
        const response = await http.put(`/interviews/schedules/${interviewId}/scorecard`, payload);
        revalidatePath('/interviews');
        revalidatePath('/jobs', 'layout');
        return { success: true, message: 'Đã lưu đánh giá', data: response.data as IScorecard };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Lưu đánh giá thất bại') };
    }
}
