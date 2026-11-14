'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Tooltip } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { AccountList, AccountMenu } from './AccountMenu';
import { BrandMark } from './BrandMark';
import { isNavActive, staffNav, staffRoleLabel, type NavItem } from './staff-nav';

export type SidebarMode = 'full' | 'rail' | 'drawer';

export type StaffSidebarProps = {
    mode: SidebarMode;
    userRole?: string;
    userName?: string;
    userEmail?: string;
    organizationName?: string;
    /** Collapse / expand; the button only renders when this is given (not in the drawer). */
    onToggle?: () => void;
    /** Labels slide in once after the user expands the rail (never on first paint). */
    labelsEntering?: boolean;
    /** Runs on client-side navigation from a nav link (the drawer closes itself). */
    onNavigate?: () => void;
    /** Rendered at the end of the brand row (the drawer's close button). */
    headerAction?: ReactNode;
};

function NavLink({
    item,
    active,
    rail,
    onNavigate,
}: {
    item: NavItem;
    active: boolean;
    rail: boolean;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    const link = (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onNavigate={onNavigate}
            className={cn(
                'group flex items-center rounded-ctl text-body-sm transition-colors duration-hover',
                rail ? 'size-11 justify-center' : 'h-9 gap-2.5 px-2.5',
                active ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2 hover:bg-surface-2/70 hover:text-ink',
            )}
        >
            <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn('size-[18px] shrink-0', active ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2')}
            />
            <span data-label="" className={rail ? 'sr-only' : 'min-w-0 truncate'}>
                {item.label}
            </span>
        </Link>
    );
    // In the rail the label is visually hidden, so the tooltip is how a sighted user reads it.
    return rail ? (
        <Tooltip content={item.label} side="right">
            {link}
        </Tooltip>
    ) : (
        link
    );
}

function NavGroup({
    label,
    items,
    rail,
    pathname,
    divider,
    onNavigate,
}: {
    label: string;
    items: NavItem[];
    rail: boolean;
    pathname: string;
    divider?: boolean;
    onNavigate?: () => void;
}) {
    const id = useId();
    return (
        <div>
            {divider ? (
                <div aria-hidden="true" className={rail ? 'mx-auto my-3 h-px w-6 bg-line' : 'mx-2.5 my-3 h-px bg-line'} />
            ) : null}
            <p id={id} data-label="" className={rail ? 'sr-only' : 'px-2.5 pb-1.5 pt-1 text-caption text-ink-3'}>
                {label}
            </p>
            <ul aria-labelledby={id} className={cn('flex flex-col gap-0.5', rail && 'items-center')}>
                {items.map((item) => (
                    <li key={item.href}>
                        <NavLink
                            item={item}
                            active={isNavActive(pathname, item.href)}
                            rail={rail}
                            onNavigate={onNavigate}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * The staff navigation: brand, the "Tuyển dụng" and "Quản trị" groups, then the account and the collapse button.
 * The same tree renders the 248 px sidebar, the 64 px rail and the mobile drawer; switching between sidebar and
 * rail only swaps classes, so the collapse button keeps focus. The drawer lists the account actions inline.
 */
export function StaffSidebar({
    mode,
    userRole,
    userName,
    userEmail,
    organizationName,
    onToggle,
    labelsEntering = false,
    onNavigate,
    headerAction,
}: StaffSidebarProps) {
    const pathname = usePathname();
    const navId = useId();
    const rail = mode === 'rail';
    const { recruiting, admin } = staffNav(userRole);
    const roleLabel = staffRoleLabel(userRole);
    const accountName = userName || userEmail || roleLabel;
    const subtitle = organizationName ?? roleLabel;
    const toggleLabel = rail ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
    const ToggleIcon = rail ? PanelLeftOpen : PanelLeftClose;

    return (
        <div
            data-labels={labelsEntering && !rail ? 'enter' : undefined}
            className="flex h-full flex-col bg-surface [&[data-labels=enter]_[data-label]]:animate-label-in"
        >
            <div className={cn('flex h-14 shrink-0 items-center', rail ? 'justify-center' : 'justify-between gap-2 px-5')}>
                <BrandMark compact={rail} className={rail ? 'p-1' : undefined} />
                {headerAction}
            </div>

            <nav
                id={navId}
                aria-label="Điều hướng chính"
                className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2', rail ? 'px-2.5' : 'px-3')}
            >
                <NavGroup label="Tuyển dụng" items={recruiting} rail={rail} pathname={pathname} onNavigate={onNavigate} />
                {admin.length > 0 ? (
                    <NavGroup
                        label="Quản trị"
                        items={admin}
                        rail={rail}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        divider
                    />
                ) : null}
            </nav>

            <div
                className={cn(
                    'flex shrink-0 gap-1 border-t border-line',
                    // The drawer's action rows line their icons up with the nav icons above (same 12 px inset).
                    mode === 'drawer' ? 'px-3 py-2' : 'p-2',
                    rail ? 'flex-col items-center' : 'items-center',
                )}
            >
                {mode === 'drawer' ? (
                    <AccountList
                        name={accountName}
                        subtitle={subtitle}
                        profileHref="/my-profile"
                        logoutRedirect="/sign-in/admin"
                        onNavigate={onNavigate}
                    />
                ) : (
                    <AccountMenu
                        variant={rail ? 'rail' : 'sidebar'}
                        name={accountName}
                        email={userEmail}
                        subtitle={subtitle}
                        profileHref="/my-profile"
                        logoutRedirect="/sign-in/admin"
                    />
                )}
                {onToggle ? (
                    <Tooltip content={toggleLabel} side={rail ? 'right' : 'top'}>
                        <button
                            type="button"
                            aria-label={toggleLabel}
                            aria-expanded={!rail}
                            aria-controls={navId}
                            onClick={onToggle}
                            className={cn(
                                'inline-flex shrink-0 items-center justify-center rounded-ctl text-ink-3',
                                'transition duration-press ease-out-expo hover:bg-surface-2 hover:text-ink active:scale-[.97]',
                                rail ? 'size-11' : 'size-9',
                            )}
                        >
                            <ToggleIcon aria-hidden="true" strokeWidth={1.75} className="size-[18px]" />
                        </button>
                    </Tooltip>
                ) : null}
            </div>
        </div>
    );
}
