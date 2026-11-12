/** A candidate waiting for the interviewer to let them in (shown to the interviewer). */
export interface IWaitingCandidate {
    name: string;
    /** When the candidate first asked to join (ISO). */
    since: string;
}

/** What POST /interviews/schedules/:id/join returns when the caller may enter now. */
export interface IInterviewRoomAccess {
    status: 'admitted';
    serverUrl: string;
    token: string;
    roomName: string;
    identity: string;
    displayName: string;
    role: 'candidate' | 'interviewer';
    /** When the room's join window, and the token, end (ISO). */
    expiresAt: string;
    waitingCandidate: IWaitingCandidate | null;
}

/** What it returns to a candidate the interviewer has not let in yet: no token. */
export interface IInterviewRoomWaiting {
    status: 'waiting';
    displayName: string;
    since: string;
    closesAt: string;
}

export type IInterviewRoomJoin = IInterviewRoomAccess | IInterviewRoomWaiting;

/** Socket.IO payloads of the waiting room. */
export interface IRoomWaitingEvent {
    interviewId: string;
    candidateName: string;
    since: string;
}

export interface IRoomAdmittedEvent {
    interviewId: string;
}
