/** True only for an absolute http(s) URL — the one kind of meeting link safe to send and to render as a link. */
export function isHttpUrl(value: string | null | undefined): boolean {
    if (!value) return false;
    try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

/** The page of the built-in room of one interview (GĐ4). */
export function interviewRoomPath(interviewId: string): string {
    return `/interview-room/${interviewId}`;
}

/**
 * True when the stored meeting link is this interview's built-in room. The API stores it
 * with its own CLIENT_URL origin, so only the path is compared.
 */
export function isBuiltInRoomLink(link: string | null | undefined, interviewId: string): boolean {
    if (!isHttpUrl(link)) return false;
    return new URL(link as string).pathname === interviewRoomPath(interviewId);
}
