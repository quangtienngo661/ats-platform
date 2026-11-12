import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterviewSessionLayout from './(interview-session)/layout';

const state = vi.hoisted(() => ({ cookies: new Map<string, string>() }));

vi.mock('next/headers', () => ({
    cookies: async () => ({
        get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name) } : undefined),
    }),
}));
vi.mock('next/navigation', () => ({
    redirect: (to: string) => {
        throw new Error(`redirect:${to}`);
    },
}));
vi.mock('@/lib/ui-variant', () => ({ getUiVariant: async () => 'modern' }));
vi.mock('@/legacy/app/(interview-session)/layout', () => ({ default: () => null }));

function signIn(payload: Record<string, unknown>) {
    const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    state.cookies.set('accessToken', `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.signature`);
}

beforeEach(() => {
    state.cookies.clear();
});

describe('(interview-session) layout, modern variant', () => {
    it('sends a visitor without a session to sign in', async () => {
        await expect(InterviewSessionLayout({ children: null })).rejects.toThrow('redirect:/sign-in');
    });

    it('frames the session full screen on the night surface, in one main', async () => {
        signIn({ userId: 'u1', fullName: 'Nguyễn Văn A', role: 'candidate' });
        render(await InterviewSessionLayout({ children: <p>Câu 1/8</p> }));

        const mains = screen.getAllByRole('main');
        expect(mains).toHaveLength(1);
        expect(mains[0]).toHaveAttribute('id', 'main-content');
        expect(mains[0]).toHaveTextContent('Câu 1/8');
        expect(mains[0]).toHaveClass('min-h-dvh', 'bg-night', 'text-night-ink');
        expect(mains[0].className).not.toMatch(/h-screen|w-screen|\[#/);
    });
});
