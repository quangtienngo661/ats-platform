import { describe, expect, it } from 'vitest';
import {
    isNavActive,
    isRailCookie,
    SIDEBAR_COOKIE,
    sidebarCookie,
    staffBreadcrumbs,
    staffNav,
    staffRoleLabel,
} from './staff-nav';

const pairs = (items: { href: string; label: string }[]) => items.map(({ href, label }) => [href, label]);

describe('staffNav', () => {
    it('gives every staff role the three recruiting items in their current order', () => {
        for (const role of [undefined, 'recruiter', 'org_admin', 'admin']) {
            expect(pairs(staffNav(role).recruiting)).toEqual([
                ['/dashboard', 'Bảng điều khiển'],
                ['/jobs', 'Tin tuyển dụng'],
                ['/interviews', 'Lịch phỏng vấn'],
            ]);
        }
    });

    it('gives a recruiter, a candidate and an unknown role no admin items', () => {
        expect(staffNav('recruiter').admin).toEqual([]);
        expect(staffNav('candidate').admin).toEqual([]);
        expect(staffNav(undefined).admin).toEqual([]);
        expect(staffNav('').admin).toEqual([]);
    });

    it('gives an organization admin only the three organization pages', () => {
        expect(staffNav('org_admin').admin.map((i) => i.href)).toEqual([
            '/department-management',
            '/recruiter-management',
            '/ai-configuration',
        ]);
    });

    it('gives a platform admin all eight admin items in the current order, with "Nhật ký AI"', () => {
        expect(pairs(staffNav('admin').admin)).toEqual([
            ['/user-management', 'Quản lý người dùng'],
            ['/department-management', 'Phòng ban'],
            ['/recruiter-management', 'Nhà tuyển dụng'],
            ['/job-category-management', 'Danh mục ngành nghề'],
            ['/skill-management', 'Kỹ năng'],
            ['/interview-topic-management', 'Chủ đề phỏng vấn'],
            ['/ai-configuration', 'Cấu hình AI'],
            ['/ai-usage-logs', 'Nhật ký AI'],
        ]);
    });

    it('uses a different icon for every item, so the rail can be read by icon alone', () => {
        const { recruiting, admin } = staffNav('admin');
        const icons = [...recruiting, ...admin].map((i) => i.icon);
        expect(new Set(icons).size).toBe(icons.length);
    });

    it('returns fresh arrays, so a caller cannot change the next caller’s nav', () => {
        staffNav('admin').recruiting.pop();
        expect(staffNav('admin').recruiting).toHaveLength(3);
    });
});

describe('isNavActive', () => {
    it.each([
        ['/jobs', '/jobs', true],
        ['/jobs/abc/kanban', '/jobs', true],
        ['/jobs/', '/jobs', true],
        ['/jobsite', '/jobs', false],
        ['/dashboard', '/jobs', false],
        ['/', '/dashboard', false],
        ['/ai-usage-logs', '/ai-configuration', false],
    ])('%s under %s → %s', (pathname, href, expected) => {
        expect(isNavActive(pathname, href)).toBe(expected);
    });
});

describe('staffBreadcrumbs', () => {
    it('names a top-level page by its nav label', () => {
        expect(staffBreadcrumbs('/dashboard')).toEqual([{ label: 'Bảng điều khiển', href: '/dashboard' }]);
        expect(staffBreadcrumbs('/ai-usage-logs')).toEqual([{ label: 'Nhật ký AI', href: '/ai-usage-logs' }]);
        expect(staffBreadcrumbs('/my-profile')).toEqual([{ label: 'Hồ sơ của tôi', href: '/my-profile' }]);
        expect(staffBreadcrumbs('/company-profile')).toEqual([{ label: 'Hồ sơ công ty', href: '/company-profile' }]);
    });

    it('shows a job id as "Chi tiết" without a link, because /jobs/[jobId] has no page', () => {
        expect(staffBreadcrumbs('/jobs/abc/kanban')).toEqual([
            { label: 'Tin tuyển dụng', href: '/jobs' },
            { label: 'Chi tiết' },
            { label: 'Kanban', href: '/jobs/abc/kanban' },
        ]);
        expect(staffBreadcrumbs('/jobs/abc/compare').map((c) => c.label)).toEqual([
            'Tin tuyển dụng',
            'Chi tiết',
            'So sánh',
        ]);
    });

    it('walks a candidate detail path with both dynamic segments', () => {
        expect(staffBreadcrumbs('/jobs/j-1/candidates/c-9')).toEqual([
            { label: 'Tin tuyển dụng', href: '/jobs' },
            { label: 'Chi tiết' },
            { label: 'Ứng viên', href: '/jobs/j-1/candidates' },
            { label: 'Chi tiết' },
        ]);
    });

    it('does not read a sub-page name as a top-level page or the reverse', () => {
        expect(staffBreadcrumbs('/kanban')).toEqual([{ label: 'Chi tiết' }]);
        expect(staffBreadcrumbs('/jobs/constructor/toString')).toEqual([
            { label: 'Tin tuyển dụng', href: '/jobs' },
            { label: 'Chi tiết' },
            { label: 'Chi tiết' },
        ]);
        expect(staffBreadcrumbs('/jobs/dashboard').map((c) => c.label)).toEqual(['Tin tuyển dụng', 'Chi tiết']);
    });

    it('ignores empty segments and returns nothing for the root', () => {
        expect(staffBreadcrumbs('/')).toEqual([]);
        expect(staffBreadcrumbs('')).toEqual([]);
        expect(staffBreadcrumbs('/jobs/')).toEqual([{ label: 'Tin tuyển dụng', href: '/jobs' }]);
    });
});

describe('staffRoleLabel', () => {
    it.each([
        ['org_admin', 'Quản trị tổ chức'],
        ['admin', 'Quản trị hệ thống'],
        ['recruiter', 'Nhà tuyển dụng'],
        [undefined, 'Nhà tuyển dụng'],
    ])('%s → %s', (role, label) => {
        expect(staffRoleLabel(role)).toBe(label);
    });
});

describe('sidebar cookie', () => {
    it('is collapsed only for the exact value "rail"', () => {
        expect(SIDEBAR_COOKIE).toBe('talentai-sidebar');
        expect(isRailCookie('rail')).toBe(true);
        expect(isRailCookie('full')).toBe(false);
        expect(isRailCookie('RAIL')).toBe(false);
        expect(isRailCookie('')).toBe(false);
        expect(isRailCookie(undefined)).toBe(false);
    });

    it('writes rail or full for the whole site for one year', () => {
        expect(sidebarCookie(true)).toBe('talentai-sidebar=rail; path=/; max-age=31536000; samesite=lax');
        expect(sidebarCookie(false)).toBe('talentai-sidebar=full; path=/; max-age=31536000; samesite=lax');
    });
});
