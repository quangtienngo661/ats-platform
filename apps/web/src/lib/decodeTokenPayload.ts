export function decodeTokenPayload(token: string): { exp?: number; role?: string } | null {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}