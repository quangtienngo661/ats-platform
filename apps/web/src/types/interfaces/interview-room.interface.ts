/** What POST /interviews/schedules/:id/join returns: how to connect to the LiveKit room. */
export interface IInterviewRoomAccess {
    serverUrl: string;
    token: string;
    roomName: string;
    identity: string;
    displayName: string;
    role: 'candidate' | 'interviewer';
    /** When the room's join window, and the token, end (ISO). */
    expiresAt: string;
}
