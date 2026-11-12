import { Briefcase, CalendarCheck, FileText, MessagesSquare, Search } from 'lucide-react';
import type { NavItem } from './staff-nav';

/** The candidate's destinations, shared by the header nav and the mobile tab bar. */
export const CANDIDATE_NAV: readonly NavItem[] = [
    { href: '/job-postings', label: 'Tìm việc', icon: Search },
    { href: '/my-applications', label: 'Đơn của tôi', icon: Briefcase },
    { href: '/my-interviews', label: 'Lịch phỏng vấn', icon: CalendarCheck },
    { href: '/my-cvs', label: 'CV của tôi', icon: FileText },
    { href: '/mock-interview', label: 'Phỏng vấn thử', icon: MessagesSquare },
];

/** What a guest or a staff member sees in the public header. */
export const PUBLIC_NAV: readonly NavItem[] = CANDIDATE_NAV.slice(0, 1);

const STAFF_ROLES = new Set(['recruiter', 'org_admin', 'admin']);

export function isStaffRole(role?: string): boolean {
    return STAFF_ROLES.has(role ?? '');
}
