import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CandidateLayout from './(candidate)/layout';
import PublicLayout from './(public)/layout';

const state = vi.hoisted(() => ({ cookies: new Map<string, string>(), headerProps: [] as Record<string, unknown>[] }));

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
vi.mock('@/servers/notifications/notifications.action', () => ({
    getNotificationsAction: vi.fn(async () => ({ items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } })),
    getUnreadCountAction: vi.fn(async () => 2),
}));
vi.mock('@/legacy/app/(public)/layout', () => ({ default: () => null }));
vi.mock('@/legacy/app/(candidate)/layout', () => ({ default: () => null }));
vi.mock('@/components/shell/SiteHeader', () => ({
    SiteHeader: (props: Record<string, unknown>) => {
        state.headerProps.push(props);
        return <header>Header</header>;
    },
}));
vi.mock('@/components/shell/SiteFooter', () => ({ SiteFooter: () => <footer>Footer</footer> }));
vi.mock('@/components/shell/CandidateTabBar', () => ({
    CandidateTabBar: () => <nav aria-label="Thanh tab ứng viên" />,
}));

function signIn(payload: Record<string, unknown>) {
    const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    state.cookies.set('accessToken', `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.signature`);
}

const tabBar = () => screen.queryByRole('navigation', { name: 'Thanh tab ứng viên' });

beforeEach(() => {
    state.cookies.clear();
    state.headerProps.length = 0;
});

describe('(public) layout, modern variant', () => {
    it('frames the page with the header, one main and the footer, without the fixed-header offset', async () => {
        render(await PublicLayout({ children: <p>Trang</p> }));
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('id', 'main-content');
        expect(main).toHaveTextContent('Trang');
        expect(main.className).not.toMatch(/pt-\[60px\]/);
        expect(screen.getAllByRole('main')).toHaveLength(1);
        expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer');
        expect(state.headerProps.at(-1)).toMatchObject({ userInfo: null });
    });

    it('gives a guest no candidate tab bar', async () => {
        render(await PublicLayout({ children: null }));
        expect(tabBar()).toBeNull();
    });

    it('gives a signed-in candidate the tab bar and their name in the header', async () => {
        signIn({ sub: 'u1', fullName: 'Nguyễn Văn A', role: 'candidate' });
        render(await PublicLayout({ children: null }));
        expect(tabBar()).toBeInTheDocument();
        expect(state.headerProps.at(-1)).toMatchObject({ userInfo: { fullName: 'Nguyễn Văn A', role: 'candidate' } });
    });

    it.each(['recruiter', 'org_admin', 'admin'])('gives %s no candidate tab bar', async (role) => {
        signIn({ sub: 'u2', fullName: 'Trần Thị B', role });
        render(await PublicLayout({ children: null }));
        expect(tabBar()).toBeNull();
    });
});

describe('(candidate) layout, modern variant', () => {
    it('sends a visitor without a session to sign in', async () => {
        await expect(CandidateLayout({ children: null })).rejects.toThrow('redirect:/sign-in');
    });

    it('frames a candidate page with the header, one main and the tab bar, without the fixed-header offset', async () => {
        signIn({ userId: 'u1', fullName: 'Nguyễn Văn A', role: 'candidate' });
        render(await CandidateLayout({ children: <p>Trang</p> }));
        const main = screen.getByRole('main');
        expect(main).toHaveAttribute('id', 'main-content');
        expect(main).toHaveTextContent('Trang');
        expect(main.className).not.toMatch(/pt-\[60px\]/);
        expect(tabBar()).toBeInTheDocument();
        expect(state.headerProps.at(-1)).toMatchObject({ initialNotifications: [], initialUnreadCount: 2 });
    });
});
