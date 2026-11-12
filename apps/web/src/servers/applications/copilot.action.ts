'use server';

import { actionErrorMessage } from '@/lib/action-error';
import http from '@/lib/http';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ICopilotSuggestion } from '@/types/interfaces/copilot.interface';

export type CopilotActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** Suggestions for the job's Kanban, keyed by application id. A failure shows no suggestions, not an error page. */
export async function getCopilotSuggestionsAction(jobId: string): Promise<Record<string, ICopilotSuggestion>> {
    try {
        const response = await http.get(`/applications/job/${jobId}/copilot`);
        return (response.data as unknown as Record<string, ICopilotSuggestion>) ?? {};
    } catch (error) {
        actionErrorMessage(error);
        return {};
    }
}

export async function applyCopilotSuggestionAction(
    applicationId: string,
    key: string,
): Promise<CopilotActionResult<{ application: IApplicationDto | null }>> {
    try {
        const response = await http.post(`/applications/${applicationId}/copilot/apply`, { key });
        const data = response.data as unknown as { application: IApplicationDto | null };
        return { ok: true, data: { application: data?.application ?? null } };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Không áp dụng được gợi ý. Thử lại sau.') };
    }
}

export async function dismissCopilotSuggestionAction(
    applicationId: string,
    key: string,
): Promise<CopilotActionResult<null>> {
    try {
        await http.post(`/applications/${applicationId}/copilot/dismiss`, { key });
        return { ok: true, data: null };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Không bỏ qua được gợi ý. Thử lại sau.') };
    }
}

export async function explainCopilotSuggestionAction(
    applicationId: string,
): Promise<CopilotActionResult<{ explanation: string }>> {
    try {
        const response = await http.post(`/applications/${applicationId}/copilot/explain`);
        return { ok: true, data: response.data as unknown as { explanation: string } };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Chưa tạo được giải thích, hãy dùng các lý do bên dưới.') };
    }
}
