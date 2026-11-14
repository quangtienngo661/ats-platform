import {
    Activity,
    Briefcase,
    Building2,
    CalendarCheck,
    Cpu,
    FolderTree,
    LayoutDashboard,
    MessagesSquare,
    UserCircle,
    Users2,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { mayVisit } from '@/lib/role-policy';

export type NavItem = { href: string; label: string; icon: LucideIcon };

const RECRUITING: readonly NavItem[] = [
    { href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { href: '/jobs', label: 'Tin tuyển dụng', icon: Briefcase },
    { href: '/interviews', label: 'Lịch phỏng vấn', icon: CalendarCheck },
];

const ADMIN: readonly NavItem[] = [
    { href: '/user-management', label: 'Quản lý người dùng', icon: UserCircle },
    { href: '/department-management', label: 'Phòng ban', icon: Building2 },
    { href: '/recruiter-management', label: 'Nhà tuyển dụng', icon: Users2 },
    { href: '/job-category-management', label: 'Danh mục ngành nghề', icon: FolderTree },
    { href: '/skill-management', label: 'Kỹ năng', icon: Zap },
    // Not CalendarCheck: in the rail the icon is all a sighted user sees, and "Lịch phỏng vấn" already has it.
    { href: '/interview-topic-management', label: 'Chủ đề phỏng vấn', icon: MessagesSquare },
    { href: '/ai-configuration', label: 'Cấu hình AI', icon: Cpu },
    { href: '/ai-usage-logs', label: 'Nhật ký AI', icon: Activity },
];

/** The staff sidebar, per role. Admin items are only navigation hints: the API still decides access. */
export function staffNav(role?: string): { recruiting: NavItem[]; admin: NavItem[] } {
    return {
        recruiting: [...RECRUITING],
        admin: ADMIN.filter((item) => mayVisit(role, item.href)),
    };
}

/** True when `pathname` is `href` or a page below it (segment-aware: `/jobsite` is not under `/jobs`). */
export function isNavActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function staffRoleLabel(role?: string): string {
    if (role === 'org_admin') return 'Quản trị tổ chức';
    if (role === 'admin') return 'Quản trị hệ thống';
    return 'Nhà tuyển dụng';
}

export type Crumb = { label: string; href?: string };

/** First path segment → page name. A Map, so a segment such as `constructor` never hits the prototype. */
const TOP_LEVEL = new Map<string, string>([
    ...[...RECRUITING, ...ADMIN].map((item): [string, string] => [item.href.slice(1), item.label]),
    ['my-profile', 'Hồ sơ của tôi'],
    ['company-profile', 'Hồ sơ công ty'],
]);

/** Static segments below a page. */
const NESTED = new Map<string, string>([
    ['candidates', 'Ứng viên'],
    ['kanban', 'Kanban'],
    ['compare', 'So sánh'],
]);

const DETAIL = 'Chi tiết';

/**
 * Breadcrumbs for a staff path. Any segment that is not a known page is a dynamic one (`[jobId]`, `[id]`) and
 * reads "Chi tiết" with no link: `/jobs/[jobId]` has no page of its own, so linking it would 404.
 */
export function staffBreadcrumbs(pathname: string): Crumb[] {
    const segments = pathname.split('/').filter(Boolean);
    let href = '';
    return segments.map((segment, index) => {
        href += `/${segment}`;
        const label = (index === 0 ? TOP_LEVEL : NESTED).get(segment);
        return label ? { label, href } : { label: DETAIL };
    });
}

export const SIDEBAR_COOKIE = 'talentai-sidebar';

/** The server renders the rail only for the exact value `rail`; anything else is the full sidebar. */
export function isRailCookie(value: string | undefined): boolean {
    return value === 'rail';
}

/** A `document.cookie` assignment that keeps the sidebar state for a year, site-wide. */
export function sidebarCookie(collapsed: boolean): string {
    return `${SIDEBAR_COOKIE}=${collapsed ? 'rail' : 'full'}; path=/; max-age=31536000; samesite=lax`;
}
