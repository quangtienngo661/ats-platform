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
