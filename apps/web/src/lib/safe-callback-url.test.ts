import { describe, expect, it } from 'vitest';
import { safeCallbackPath, signInRedirectUrl } from './safe-callback-url';

describe('post-login destinations', () => {
    it.each([
        'https://evil.example/path', '//evil.example/path', '/\\evil.example/path',
        '/%2f%2fevil.example/path', '/%5cevil.example/path', '/jobs\nSet-Cookie: x=y',
        '/jobs\u0000', 'javascript:alert(1)', '', null,
    ])('rejects unsafe callback %j', (path) => {
        expect(safeCallbackPath(path)).toBeNull();
    });
    it('preserves a local path with its query and fragment', () => {
        expect(safeCallbackPath('/job-postings?q=React%20Native&page=2#results')).toBe('/job-postings?q=React%20Native&page=2#results');
    });
    it('encodes the original internal path once, keeping all search parameters together', () => {
        const url = signInRedirectUrl('https://talentai.example/jobs?page=2&locationType=remote', '/sign-in/admin', true);
        expect(url.searchParams.get('callbackUrl')).toBe('/jobs?page=2&locationType=remote');
        expect(url.searchParams.get('session_expired')).toBe('true');
    });
});
