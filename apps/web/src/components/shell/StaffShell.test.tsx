import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logoutAction } from '@/servers/auth/auth.action';
import { StaffShell } from './StaffShell';

const nav = vi.hoisted(() => ({ pathname: '/jobs/abc/kanban', refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
    usePathname: () => nav.pathname,
    useRouter: () => ({ refresh: nav.refresh, push: nav.push }),
}));
vi.mock('@/servers/auth/auth.action', () => ({ logoutAction: vi.fn() }));
vi.mock('@/servers/ui/ui-variant.action', () => ({ setUiVariantAction: vi.fn() }));
vi.mock('@/components/notifications/NotificationDropdown', () => ({
    NotificationDropdown: () => <button type="button">Notifications</button>,
}));

function stubViewport(desktop: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: desktop,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }));
}

function renderShell(props: Partial<ComponentProps<typeof StaffShell>> = {}) {
    return render(
        <StaffShell
            userRole="recruiter"
            userName="Nguyễn Thị Lan"
            userEmail="lan@acme.vn"
            organizationName="Công ty Acme"
            initialCollapsed={false}
            {...props}
        >
            <p>Nội dung trang</p>
        </StaffShell>,
    );
}

const sidebar = () => screen.getByRole('navigation', { name: 'Điều hướng chính' });

beforeEach(() => {
    nav.pathname = '/jobs/abc/kanban';
    stubViewport(true);
    document.cookie = 'talentai-sidebar=; path=/; max-age=0';
});

describe('StaffShell', () => {
    it('marks the nav item that owns the current path as the current page, and only that one', () => {
        renderShell();
        expect(within(sidebar()).getByRole('link', { name: 'Tin tuyển dụng' })).toHaveAttribute('aria-current', 'page');
        expect(within(sidebar()).getByRole('link', { name: 'Bảng điều khiển' })).not.toHaveAttribute('aria-current');
        expect(within(sidebar()).getByRole('link', { name: 'Lịch phỏng vấn' })).not.toHaveAttribute('aria-current');
    });

    it('collapses to the rail and back from one button that reports its state', async () => {
        const user = userEvent.setup();
        renderShell();
        const toggle = screen.getByRole('button', { name: 'Thu gọn thanh bên' });
        expect(toggle).toHaveAttribute('aria-expanded', 'true');

        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).toHaveAccessibleName('Mở rộng thanh bên');
        expect(toggle).toHaveFocus();
        expect(document.cookie).toContain('talentai-sidebar=rail');

        await user.click(toggle);
        expect(screen.getByRole('button', { name: 'Thu gọn thanh bên' })).toHaveAttribute('aria-expanded', 'true');
        expect(document.cookie).toContain('talentai-sidebar=full');
    });

    it('keeps every nav link named in the rail, and names it in a tooltip on focus', async () => {
        renderShell({ initialCollapsed: true });
        expect(screen.getByRole('button', { name: 'Mở rộng thanh bên' })).toHaveAttribute('aria-expanded', 'false');
        const link = within(sidebar()).getByRole('link', { name: 'Bảng điều khiển' });
        expect(link).toHaveAttribute('href', '/dashboard');

        act(() => link.focus());
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Bảng điều khiển');
    });

    it('shows no nav tooltip while the sidebar is expanded', () => {
        renderShell();
        act(() => within(sidebar()).getByRole('link', { name: 'Bảng điều khiển' }).focus());
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders exactly one main landmark with the skip-link target id', () => {
        const { container } = renderShell();
        expect(screen.getAllByRole('main')).toHaveLength(1);
        expect(container.querySelectorAll('main#main-content')).toHaveLength(1);
        expect(screen.getByRole('main')).toHaveTextContent('Nội dung trang');
    });

    it('builds the breadcrumb trail from the path', () => {
        renderShell();
        const trail = screen.getByRole('navigation', { name: 'Đường dẫn' });
        expect(within(trail).getByRole('link', { name: 'Tin tuyển dụng' })).toHaveAttribute('href', '/jobs');
        expect(within(trail).queryByRole('link', { name: 'Chi tiết' })).not.toBeInTheDocument();
        expect(within(trail).getByText('Kanban')).toHaveAttribute('aria-current', 'page');
    });

    it('hides the admin group from a recruiter and shows the filtered one to an organization admin', () => {
        const { unmount } = renderShell();
        expect(within(sidebar()).queryByRole('list', { name: 'Quản trị' })).not.toBeInTheDocument();
        unmount();

        renderShell({ userRole: 'org_admin' });
        const admin = within(sidebar()).getByRole('list', { name: 'Quản trị' });
        expect(within(admin).getAllByRole('link').map((a) => a.textContent)).toEqual([
            'Phòng ban',
            'Nhà tuyển dụng',
            'Cấu hình AI',
        ]);
    });

    it('opens the navigation drawer on small screens, closes it on Esc and returns focus to the menu button', async () => {
        stubViewport(false);
        const user = userEvent.setup();
        renderShell();
        const menu = screen.getByRole('button', { name: 'Mở menu' });

        await user.click(menu);
        const drawer = screen.getByRole('dialog', { name: 'Điều hướng' });
        expect(within(drawer).getByRole('link', { name: 'Tin tuyển dụng' })).toHaveAttribute('aria-current', 'page');
        expect(within(drawer).queryByRole('button', { name: /thanh bên/ })).not.toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(menu).toHaveFocus();
    });

    // The drawer lists the account actions inline instead of nesting a second popup menu in the dialog.
    it('lists the account actions inline in the drawer, without a nested menu', async () => {
        stubViewport(false);
        const user = userEvent.setup();
        renderShell();
        await user.click(screen.getByRole('button', { name: 'Mở menu' }));
        const drawer = screen.getByRole('dialog', { name: 'Điều hướng' });

        expect(within(drawer).queryByRole('button', { name: /Nguyễn Thị Lan/ })).not.toBeInTheDocument();
        const actions = within(drawer).getByRole('list', { name: 'Tài khoản' });
        expect(within(actions).getByRole('link', { name: 'Hồ sơ của tôi' })).toHaveAttribute('href', '/my-profile');
        expect(within(actions).getByRole('button', { name: 'Dùng giao diện cũ' })).toBeInTheDocument();

        await user.click(within(actions).getByRole('button', { name: 'Đăng xuất' }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalledWith('/sign-in/admin'));
    });

    it('shows the account with the organization name in the sidebar footer', () => {
        renderShell();
        expect(screen.getByRole('button', { name: /Nguyễn Thị Lan/ })).toHaveTextContent('Công ty Acme');
    });

    it('falls back to the role label when there is no organization', () => {
        renderShell({ userRole: 'admin', organizationName: undefined });
        expect(screen.getByRole('button', { name: /Nguyễn Thị Lan/ })).toHaveTextContent('Quản trị hệ thống');
    });
});
