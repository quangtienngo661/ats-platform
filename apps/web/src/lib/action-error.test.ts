import { describe, expect, it } from 'vitest';
import { actionErrorMessage } from './action-error';
import { redirect, notFound } from 'next/navigation';

describe('Server Action error handling', () => {
    it('normalizes API validation arrays and keeps internal exception details out of form feedback', () => {
        expect(actionErrorMessage({ response: { data: { message: ['Invalid name', 'Invalid email'] } } }, 'fallback')).toBe('Invalid name');
        expect(actionErrorMessage(new Error('database credentials'), 'fallback')).toBe('fallback');
    });
    it.each([() => redirect('/sign-in'), () => notFound()])('preserves Next.js control flow', (control) => {
        let error: unknown;
        try { control(); } catch (caught) { error = caught; }
        expect(() => actionErrorMessage(error, 'fallback')).toThrow(error as Error);
    });
});
