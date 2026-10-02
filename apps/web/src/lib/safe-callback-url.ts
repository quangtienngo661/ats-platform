/** Only application-relative paths may be used as post-login destinations. */
export function safeCallbackPath(value: FormDataEntryValue | string | null): string | null {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
    for (const character of value) {
        const code = character.charCodeAt(0);
        if (character === '\\' || code < 32 || code === 127) return null;
    }

    const path = value.split(/[?#]/, 1)[0];
    // Reject encoded path separators and controls before Next.js or a proxy decodes them.
    if (/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(path)) return null;

    try {
        const parsed = new URL(value, 'https://talentai.local');
        return parsed.origin === 'https://talentai.local' ? value : null;
    } catch {
        return null;
    }
}

export function signInRedirectUrl(
    requestUrl: string,
    signInPath: '/sign-in' | '/sign-in/admin',
    sessionExpired = false,
): URL {
    const source = new URL(requestUrl);
    const destination = new URL(signInPath, source);
    if (sessionExpired) destination.searchParams.set('session_expired', 'true');
    destination.searchParams.set('callbackUrl', `${source.pathname}${source.search}`);
    return destination;
}
