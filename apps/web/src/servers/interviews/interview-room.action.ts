'use server';

import { actionErrorMessage } from '@/lib/action-error';
import http from '@/lib/http';
import type { IInterviewRoomAccess } from '@/types/interfaces/interview-room.interface';

export type JoinInterviewRoomResult =
    | { ok: true; access: IInterviewRoomAccess }
    | { ok: false; message: string };

/**
 * A token for the built-in interview room. Who may enter and when is decided by the API;
 * its refusals (not a participant, outside the window, not configured) come back as text.
 */
export async function joinInterviewRoomAction(interviewId: string): Promise<JoinInterviewRoomResult> {
    try {
        const response = await http.post(`/interviews/schedules/${interviewId}/join`);
        return { ok: true, access: response.data as unknown as IInterviewRoomAccess };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Không vào được phòng phỏng vấn. Thử lại sau.') };
    }
}
