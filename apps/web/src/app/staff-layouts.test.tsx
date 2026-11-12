import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLayout from './(admin)/layout';
import HRRouteLayout from './(recruiter)/layout';

const state = vi.hoisted(() => ({ cookies: new Map<string, string>(), shellProps: [] as Record<string, unknown>[] }));

vi.mock('next/headers', () => ({
    cookies: async () => ({
        get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name) } : undefined),
    }),
}));
vi.mock('@/lib/ui-variant', () => ({ getUiVariant: async () => 'modern' }));
vi.mock('@/servers/users/users.action', () => ({ getMeAction: vi.fn(async () => null) }));
vi.mock('@/servers/organizations/organizations.action', () => ({ getCurrentOrganizationAction: vi.fn() }));
vi.mock('@/servers/notifications/notifications.action', () => ({
    getNotificationsAction: vi.fn(),
    getUnreadCountAction: vi.fn(),
}));
vi.mock('@/legacy/app/(recruiter)/layout', () => ({ default: () => null }));
vi.mock('@/legacy/app/(admin)/layout', () => ({ default: () => null }));
vi.mock('@/components/shell/StaffShell', () => ({
    StaffShell: ({ children, ...props }: { children: ReactNode }) => {
        state.shellProps.push(props);
        return <div data-testid="staff-shell">{children}</div>;
    },
}));

beforeEach(() => {
    state.cookies.clear();
    state.shellProps.length = 0;
});

describe.each([
    ['(recruiter)', HRRouteLayout],
    ['(admin)', AdminLayout],
])('%s layout, modern variant', (_group, Layout) => {
    it.each([
        ['rail', true],
        ['full', false],
        [undefined, false],
        ['bogus', false],
    ])('talentai-sidebar=%s → initialCollapsed %s', async (cookie, collapsed) => {
        if (cookie !== undefined) state.cookies.set('talentai-sidebar', cookie);
        render(await Layout({ children: <p>Trang</p> }));
        expect(screen.getByTestId('staff-shell')).toHaveTextContent('Trang');
        expect(state.shellProps.at(-1)).toMatchObject({ initialCollapsed: collapsed, initialUnreadCount: 0 });
    });
});
