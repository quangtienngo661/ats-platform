'use server';

import { actionErrorMessage } from '@/lib/action-error';
import http from '@/lib/http';
import type { IInterviewRoomJoin } from '@/types/interfaces/interview-room.interface';

export type JoinInterviewRoomResult =
    | { ok: true; room: IInterviewRoomJoin }
    | { ok: false; message: string };

export type AdmitCandidateResult = { ok: true } | { ok: false; message: string };

/**
 * A token for the built-in interview room, or "waiting" for a candidate the interviewer
 * has not let in yet. Who may enter and when is decided by the API; its refusals (not a
 * participant, outside the window, not configured) come back as text.
 */
export async function joinInterviewRoomAction(interviewId: string): Promise<JoinInterviewRoomResult> {
    try {
        const response = await http.post(`/interviews/schedules/${interviewId}/join`);
        return { ok: true, room: response.data as unknown as IInterviewRoomJoin };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Không vào được phòng phỏng vấn. Thử lại sau.') };
    }
}

/** The interviewer lets the waiting candidate into the room. */
export async function admitCandidateAction(interviewId: string): Promise<AdmitCandidateResult> {
    try {
        await http.post(`/interviews/schedules/${interviewId}/admit`);
        return { ok: true };
    } catch (error) {
        return { ok: false, message: actionErrorMessage(error, 'Không cho ứng viên vào được. Thử lại.') };
    }
}
