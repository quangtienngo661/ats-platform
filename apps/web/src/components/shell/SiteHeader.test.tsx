import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logoutAction } from '@/servers/auth/auth.action';
import type { INotification } from '@/types/interfaces/notification.interface';
import { CandidateTabBar } from './CandidateTabBar';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

const state = vi.hoisted(() => ({
    pathname: '/job-postings',
    socket: { disconnect: vi.fn() },
    bellProps: [] as Record<string, unknown>[],
}));

vi.mock('next/navigation', () => ({
    usePathname: () => state.pathname,
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/servers/auth/auth.action', () => ({ logoutAction: vi.fn(async () => undefined) }));
vi.mock('@/servers/ui/ui-variant.action', () => ({ setUiVariantAction: vi.fn(async () => undefined) }));
vi.mock('@/stores/useSocketStore', () => ({
    useSocketStore: (selector?: (s: typeof state.socket) => unknown) =>
        selector ? selector(state.socket) : state.socket,
}));
vi.mock('@/components/notifications/NotificationDropdown', () => ({
    NotificationDropdown: (props: Record<string, unknown>) => {
        state.bellProps.push(props);
        return <button type="button">Notifications</button>;
    },
}));

const candidate = { fullName: 'Nguyễn Văn A', role: 'candidate' };
const CANDIDATE_LINKS = [
    ['Tìm việc', '/job-postings'],
    ['Đơn của tôi', '/my-applications'],
    ['Lịch phỏng vấn', '/my-interviews'],
    ['CV của tôi', '/my-cvs'],
    ['Phỏng vấn thử', '/mock-interview'],
];

const mainNav = () => screen.getByRole('navigation', { name: 'Điều hướng chính' });
const linksOf = (nav: HTMLElement) =>
    within(nav)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]);

/** The trigger reads the name, then the role. */
async function openAccountMenu(name: string) {
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: new RegExp(`^${name}`) });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    return user;
}

beforeEach(() => {
    state.pathname = '/job-postings';
    state.bellProps.length = 0;
});

describe('SiteHeader — guest', () => {
    it('offers job search, sign-in and registration, and nothing that needs an account', () => {
        render(<SiteHeader userInfo={null} />);
        expect(linksOf(mainNav())).toEqual([['Tìm việc', '/job-postings']]);
        expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/sign-in');
        expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/register');
        expect(screen.queryByRole('link', { name: 'Đơn của tôi' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();
    });

    // C6, carried over from PublicHeader.
    it('does not show a guest the interview schedule', () => {
        render(<SiteHeader userInfo={null} />);
        expect(screen.queryByRole('link', { name: 'Lịch phỏng vấn' })).toBeNull();
    });

    it('links the brand home', () => {
        render(<SiteHeader userInfo={null} />);
        expect(screen.getByRole('link', { name: 'TalentAI' })).toHaveAttribute('href', '/');
    });
});

describe('SiteHeader — candidate', () => {
    it('lists the five candidate destinations, in order', () => {
        render(<SiteHeader userInfo={candidate} />);
        expect(linksOf(mainNav())).toEqual(CANDIDATE_LINKS);
    });

    // C6, carried over from PublicHeader.
    it('shows a signed-in candidate the way to their interview schedule', () => {
        render(<SiteHeader userInfo={candidate} />);
        expect(within(mainNav()).getByRole('link', { name: 'Lịch phỏng vấn' })).toHaveAttribute('href', '/my-interviews');
    });

    it.each([
        ['/job-postings', 'Tìm việc'],
        ['/job-postings/9f1c', 'Tìm việc'],
        ['/my-applications/abc', 'Đơn của tôi'],
        ['/my-interviews', 'Lịch phỏng vấn'],
        ['/my-cvs', 'CV của tôi'],
        ['/mock-interview', 'Phỏng vấn thử'],
    ])('on %s marks only "%s" as the current page', (pathname, current) => {
        state.pathname = pathname;
        render(<SiteHeader userInfo={candidate} />);
        const marked = within(mainNav())
            .getAllByRole('link')
            .filter((link) => link.getAttribute('aria-current') === 'page')
            .map((link) => link.textContent);
        expect(marked).toEqual([current]);
    });

    it.each(['/', '/profile', '/my-cvsx'])('on %s marks no nav item as current', (pathname) => {
        state.pathname = pathname;
        render(<SiteHeader userInfo={candidate} />);
        for (const link of within(mainNav()).getAllByRole('link')) {
            expect(link).not.toHaveAttribute('aria-current');
        }
    });

    // Carried over from PublicHeader: five Vietnamese labels must fit at tablet widths without clipping.
    it('keeps every navigation label on one line', () => {
        render(<SiteHeader userInfo={candidate} />);
        for (const link of within(mainNav()).getAllByRole('link')) {
            expect(link).toHaveClass('whitespace-nowrap');
        }
    });

    it('never clips overflowing navigation links', () => {
        render(<SiteHeader userInfo={candidate} />);
        expect(mainNav()).not.toHaveClass('overflow-hidden');
        expect(mainNav()).toHaveClass('min-w-0');
    });

    it('gives the navigation the free width without an empty spacer', () => {
        render(<SiteHeader userInfo={candidate} />);
        const container = mainNav().parentElement;
        if (!container) throw new Error('The navigation must have a parent container');
        const emptySpacers = Array.from(container.children).filter(
            (child) => child !== mainNav() && !child.hasChildNodes(),
        );
        expect(emptySpacers).toHaveLength(0);
    });

    it('shows the bell with the notifications it was given, and no sign-in links', () => {
        const notifications = [{ notificationId: 'n1' }] as INotification[];
        render(<SiteHeader userInfo={candidate} initialNotifications={notifications} initialUnreadCount={3} />);
        expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
        expect(state.bellProps.at(-1)).toMatchObject({ initialNotifications: notifications, initialUnreadCount: 3 });
        expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Đăng ký' })).toBeNull();
    });

    // A fresh [] on every render would make the bell reset its store on each navigation.
    it('hands the bell the same empty list on every render when it has none', () => {
        const { rerender } = render(<SiteHeader userInfo={candidate} />);
        rerender(<SiteHeader userInfo={candidate} />);
        const [first, second] = state.bellProps.slice(-2);
        expect(first.initialNotifications).toEqual([]);
        expect(second.initialNotifications).toBe(first.initialNotifications);
    });

    it('offers the profile, the legacy UI and sign-out in the account menu, under the role', async () => {
        render(<SiteHeader userInfo={candidate} />);
        await openAccountMenu('Nguyễn Văn A');
        expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
            'Hồ sơ',
            'Dùng giao diện cũ',
            'Đăng xuất',
        ]);
        expect(screen.getByRole('menuitem', { name: 'Hồ sơ' })).toHaveAttribute('href', '/profile');
        expect(screen.getByRole('menu')).toHaveTextContent('Ứng viên');
    });

    it('closes the socket, then signs out to the candidate sign-in page', async () => {
        render(<SiteHeader userInfo={candidate} />);
        const user = await openAccountMenu('Nguyễn Văn A');
        await user.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalledWith('/sign-in'));
        expect(logoutAction).toHaveBeenCalledTimes(1);
        expect(state.socket.disconnect).toHaveBeenCalledTimes(1);
        expect(state.socket.disconnect.mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(logoutAction).mock.invocationCallOrder[0],
        );
    });
});

describe('SiteHeader — signed in without a known role', () => {
    // The layouts give the tab bar to role "candidate" only; candidate links here would vanish under 768 px.
    it('gets the guest nav and the account menu, without candidate links', () => {
        render(<SiteHeader userInfo={{ fullName: 'Ẩn Danh' }} />);
        expect(linksOf(mainNav())).toEqual([['Tìm việc', '/job-postings']]);
        expect(screen.queryByRole('link', { name: 'Đơn của tôi' })).toBeNull();
        expect(screen.getByRole('button', { name: /^Ẩn Danh/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
    });
});

describe('SiteHeader — staff visiting public pages', () => {
    it.each([
        ['recruiter', '/dashboard', 'Nhà tuyển dụng'],
        ['org_admin', '/department-management', 'Quản trị tổ chức'],
        ['admin', '/department-management', 'Quản trị hệ thống'],
    ])('%s gets job search and a way back to %s', (role, landing) => {
        render(<SiteHeader userInfo={{ fullName: 'Trần Thị B', role }} />);
        expect(linksOf(mainNav())).toEqual([['Tìm việc', '/job-postings']]);
        expect(screen.getByRole('link', { name: 'Trang quản lý' })).toHaveAttribute('href', landing);
        expect(screen.queryByRole('link', { name: 'Đơn của tôi' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Đăng nhập' })).toBeNull();
    });

    it('opens the staff profile from the account menu and signs out to the staff sign-in page', async () => {
        render(<SiteHeader userInfo={{ fullName: 'Trần Thị B', role: 'org_admin' }} />);
        const user = await openAccountMenu('Trần Thị B');
        expect(screen.getByRole('menuitem', { name: 'Hồ sơ của tôi' })).toHaveAttribute('href', '/my-profile');
        expect(screen.getByRole('menu')).toHaveTextContent('Quản trị tổ chức');
        await user.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalledWith('/sign-in/admin'));
    });
});

describe('CandidateTabBar', () => {
    it('lists the same five destinations as the header', () => {
        render(<CandidateTabBar />);
        expect(linksOf(mainNav())).toEqual(CANDIDATE_LINKS);
    });

    it('marks the tab that owns the current path, and only that one', () => {
        state.pathname = '/my-interviews/2026-11';
        render(<CandidateTabBar />);
        const marked = within(mainNav())
            .getAllByRole('link')
            .filter((link) => link.getAttribute('aria-current') === 'page')
            .map((link) => link.textContent);
        expect(marked).toEqual(['Lịch phỏng vấn']);
    });
});

describe('SiteFooter', () => {
    it('keeps the old footer links that lead somewhere, and none that lead nowhere', () => {
        render(<SiteFooter />);
        const footer = screen.getByRole('contentinfo');
        expect(linksOf(footer)).toEqual([
            ['Tìm việc', '/job-postings'],
            ['Đơn của tôi', '/my-applications'],
            ['Hồ sơ', '/profile'],
            ['Đăng nhập HR', '/sign-in/admin'],
        ]);
        expect(footer).toHaveTextContent('© 2026 TalentAI');
    });
});
