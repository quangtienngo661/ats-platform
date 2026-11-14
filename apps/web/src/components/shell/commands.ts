import { staffNav } from './staff-nav';

export type Command = {
    id: string;
    group: 'Đi tới' | 'Giao diện';
    label: string;
    keywords?: string[];
    href?: string;
    run?: () => void;
};

/** Extra search words per page, so "ứng viên" finds the job pages that hold the candidates. */
const KEYWORDS: Record<string, string[]> = {
    '/dashboard': ['tổng quan', 'thống kê'],
    '/jobs': ['ứng viên', 'kanban', 'tuyển'],
    '/interviews': ['hẹn', 'lịch'],
    '/user-management': ['tài khoản', 'user'],
    '/ai-configuration': ['model', 'prompt'],
    '/ai-usage-logs': ['log', 'chi phí'],
};

/** NFD, no combining marks, đ→d, lower case, single spaces. */
export function normalizeVi(s: string): string {
    return s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/** The palette's commands for a role. `ui-legacy` has no `run`: the palette wires it to the variant switch. */
export function buildCommands(role?: string): Command[] {
    const { recruiting, admin } = staffNav(role);
    const go = [...recruiting, ...admin].map(
        (item): Command => ({
            id: `go:${item.href}`,
            group: 'Đi tới',
            label: item.label,
            href: item.href,
            keywords: KEYWORDS[item.href],
        }),
    );
    return [
        ...go,
        { id: 'go:/my-profile', group: 'Đi tới', label: 'Hồ sơ của tôi', href: '/my-profile', keywords: ['tài khoản'] },
        { id: 'ui-legacy', group: 'Giao diện', label: 'Dùng giao diện cũ', keywords: ['legacy', 'classic'] },
    ];
}

/** Every query word must start some word of the label or keywords. Empty query keeps the list as is. */
export function filterCommands(query: string, commands: Command[]): Command[] {
    const words = normalizeVi(query).split(' ').filter(Boolean);
    if (words.length === 0) return commands;
    return commands.filter((command) => {
        const pool = normalizeVi([command.label, ...(command.keywords ?? [])].join(' ')).split(' ');
        return words.every((w) => pool.some((p) => p.startsWith(w)));
    });
}
