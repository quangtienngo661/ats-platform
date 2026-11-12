'use client';

import Link from 'next/link';
import { History, LogOut, UserRound } from 'lucide-react';
import { useTransition } from 'react';
import {
    Avatar,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { useSwitchUiVariant } from '@/components/ui-variant/useSwitchUiVariant';
import { logoutAction } from '@/servers/auth/auth.action';

export type AccountMenuProps = {
    name: string;
    email?: string;
    /** Second line under the name in the sidebar (organization or role). */
    subtitle?: string;
    profileHref: string;
    profileLabel?: string;
    logoutRedirect: string;
    /** Runs before sign-out, e.g. to close a socket. */
    onBeforeLogout?: () => void;
    /** `sidebar`: avatar, name and subtitle. `rail` and `header`: avatar only, the name stays for screen readers. */
    variant?: 'sidebar' | 'rail' | 'header';
};

const PLACEMENT = {
    sidebar: { side: 'top', align: 'start' },
    rail: { side: 'right', align: 'end' },
    header: { side: 'bottom', align: 'end' },
} as const;

const TRIGGER = {
    sidebar: 'h-11 min-w-0 flex-1 gap-2.5 px-2 text-left',
    rail: 'size-11 justify-center',
    header: 'size-9 justify-center',
} as const;

const iconClasses = 'size-4 shrink-0 text-ink-3';

/** Sign-out and the switch back to the legacy UI, shared by the menu and the inline list. */
function useAccountActions(logoutRedirect: string, onBeforeLogout?: () => void) {
    const { switchTo, pending: switching } = useSwitchUiVariant();
    const [signingOut, startSignOut] = useTransition();
    return {
        switching,
        switchToLegacy: () => switchTo('legacy'),
        signingOut,
        signOut: () =>
            startSignOut(async () => {
                onBeforeLogout?.();
                await logoutAction(logoutRedirect);
            }),
    };
}

/**
 * The signed-in account and its menu: profile, back to the legacy UI, sign out. Selecting the last two keeps the
 * menu open with the item disabled until the server answers, so the click visibly did something.
 * Not for use inside a `Dialog`/`Sheet`: use `AccountList` there (see its note).
 */
export function AccountMenu({
    name,
    email,
    subtitle,
    profileHref,
    profileLabel = 'Hồ sơ của tôi',
    logoutRedirect,
    onBeforeLogout,
    variant = 'sidebar',
}: AccountMenuProps) {
    const { switching, switchToLegacy, signingOut, signOut } = useAccountActions(logoutRedirect, onBeforeLogout);
    const textOnlyForReaders = variant !== 'sidebar';
    const detail = email ?? subtitle;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'flex shrink-0 items-center rounded-ctl transition-colors duration-hover',
                    'hover:bg-surface-2 data-[state=open]:bg-surface-2',
                    TRIGGER[variant],
                )}
            >
                {/* The name is text below; the avatar would only repeat it. */}
                <span aria-hidden="true" className="flex">
                    <Avatar name={name} size={28} />
                </span>
                <span data-label="" className={textOnlyForReaders ? 'sr-only' : 'min-w-0 flex-1'}>
                    <span className="block truncate text-body-sm font-medium text-ink" title={name}>
                        {name}
                    </span>
                    {subtitle ? (
                        <span className="block truncate text-caption text-ink-3" title={subtitle}>
                            {subtitle}
                        </span>
                    ) : null}
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent {...PLACEMENT[variant]} className="w-60">
                <div className="px-2 pb-2 pt-1.5">
                    <p className="truncate text-body-sm font-medium text-ink" title={name}>
                        {name}
                    </p>
                    {detail ? (
                        <p className="truncate text-caption text-ink-3" title={detail}>
                            {detail}
                        </p>
                    ) : null}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={profileHref}>
                        <UserRound aria-hidden="true" strokeWidth={1.75} className={iconClasses} />
                        {profileLabel}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={switching}
                    onSelect={(event) => {
                        event.preventDefault();
                        switchToLegacy();
                    }}
                >
                    <History aria-hidden="true" strokeWidth={1.75} className={iconClasses} />
                    {switching ? 'Đang chuyển…' : 'Dùng giao diện cũ'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    destructive
                    disabled={signingOut}
                    onSelect={(event) => {
                        event.preventDefault();
                        signOut();
                    }}
                >
                    <LogOut aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                    {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const rowClasses =
    'flex h-9 w-full items-center gap-2.5 rounded-ctl px-2.5 text-left text-body-sm transition-colors duration-hover ' +
    'hover:bg-surface-2/70 disabled:pointer-events-none disabled:text-ink-4';

/**
 * The account and its actions as a plain list, for the mobile navigation drawer. A Radix menu cannot live inside
 * a Radix dialog here: `react-dialog` and `react-dropdown-menu` pin different copies of focus-scope and
 * dismissable-layer, so the dialog's focus trap pulls focus out of the menu and one Esc closes both.
 */
export function AccountList({
    name,
    subtitle,
    profileHref,
    profileLabel = 'Hồ sơ của tôi',
    logoutRedirect,
    onBeforeLogout,
    onNavigate,
}: Omit<AccountMenuProps, 'variant' | 'email'> & { onNavigate?: () => void }) {
    const { switching, switchToLegacy, signingOut, signOut } = useAccountActions(logoutRedirect, onBeforeLogout);
    return (
        <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                <span aria-hidden="true" className="flex">
                    <Avatar name={name} size={28} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-medium text-ink" title={name}>
                        {name}
                    </span>
                    {subtitle ? (
                        <span className="block truncate text-caption text-ink-3" title={subtitle}>
                            {subtitle}
                        </span>
                    ) : null}
                </span>
            </div>
            <ul aria-label="Tài khoản" className="mt-1 flex flex-col gap-0.5">
                <li>
                    <Link href={profileHref} onNavigate={onNavigate} className={cn(rowClasses, 'text-ink-2 hover:text-ink')}>
                        <UserRound aria-hidden="true" strokeWidth={1.75} className={iconClasses} />
                        {profileLabel}
                    </Link>
                </li>
                <li>
                    <button
                        type="button"
                        disabled={switching}
                        onClick={switchToLegacy}
                        className={cn(rowClasses, 'text-ink-2 hover:text-ink')}
                    >
                        <History aria-hidden="true" strokeWidth={1.75} className={iconClasses} />
                        {switching ? 'Đang chuyển…' : 'Dùng giao diện cũ'}
                    </button>
                </li>
                <li>
                    <button type="button" disabled={signingOut} onClick={signOut} className={cn(rowClasses, 'text-danger')}>
                        <LogOut aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                        {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
                    </button>
                </li>
            </ul>
        </div>
    );
}
