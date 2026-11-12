'use server';

import { revalidatePath } from 'next/cache';
import { actionErrorMessage, rethrowReadError } from '@/lib/action-error';
import http from '@/lib/http';
import type {
    InterviewQuestionInput,
    IPaginatedInterviewQuestions,
} from '@/types/interfaces/interview-question.interface';

export type InterviewQuestionActionState = { success: boolean; message: string };

/** One page of up to 100 questions of a topic, hidden ones included (the panel groups them itself). */
export async function getTopicQuestionsAction(topicId: string): Promise<IPaginatedInterviewQuestions> {
    try {
        const response = await http.get(`/interviews/topics/${topicId}/questions`, {
            params: { includeInactive: true, limit: 100 },
        });
        return response.data as IPaginatedInterviewQuestions;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

export async function createTopicQuestionAction(
    topicId: string,
    input: InterviewQuestionInput,
): Promise<InterviewQuestionActionState> {
    if (!topicId) return { success: false, message: 'Thiếu ID chủ đề phỏng vấn' };

    try {
        await http.post(`/interviews/topics/${topicId}/questions`, input);
        revalidatePath('/interview-topic-management');
        return { success: true, message: 'Đã thêm câu hỏi' };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, 'Thêm câu hỏi thất bại. Vui lòng thử lại.') };
    }
}

/** Edits a question, or hides / shows it with `{ isActive }`. Only the fields given are sent. */
export async function updateTopicQuestionAction(
    questionId: string,
    changes: Partial<InterviewQuestionInput> & { isActive?: boolean },
): Promise<InterviewQuestionActionState> {
    if (!questionId) return { success: false, message: 'Thiếu ID câu hỏi' };

    try {
        await http.patch(`/interviews/questions/${questionId}`, changes);
        revalidatePath('/interview-topic-management');
        return { success: true, message: 'Đã cập nhật câu hỏi' };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, 'Cập nhật câu hỏi thất bại. Vui lòng thử lại.') };
    }
}
