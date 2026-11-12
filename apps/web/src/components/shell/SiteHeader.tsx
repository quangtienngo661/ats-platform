'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ButtonLink } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { landingForRole } from '@/lib/role-policy';
import { useSocketStore } from '@/stores/useSocketStore';
import type { INotification } from '@/types/interfaces/notification.interface';
import { AccountMenu } from './AccountMenu';
import { BrandMark } from './BrandMark';
import { CANDIDATE_NAV, PUBLIC_NAV, isStaffRole } from './site-nav';
import { isNavActive, staffRoleLabel, type NavItem } from './staff-nav';

export type SiteHeaderProps = {
    userInfo: { fullName?: string; role?: string } | null;
    initialNotifications?: INotification[];
    initialUnreadCount?: number;
};

/** One shared empty list: a fresh `[]` per render would make the bell reset its store on every navigation. */
const NO_NOTIFICATIONS: INotification[] = [];

function SiteNavLink({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            data-label={item.label}
            className={cn(
                'inline-flex h-8 flex-col items-center justify-center whitespace-nowrap rounded-ctl px-2.5 text-body-sm lg:px-3',
                'transition-[color,background-color,transform] duration-hover ease-out-expo',
                'active:scale-[.97] active:duration-press',
                // A hidden medium-weight copy reserves the width, so the row does not shift when the current page
                // changes. `/ ''` gives the copy an empty alternative text: screen readers read the label once.
                "after:invisible after:h-0 after:overflow-hidden after:font-medium after:content-[attr(data-label)_/_'']",
                active ? 'bg-ink/[.06] font-medium text-ink' : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
            )}
        >
            {item.label}
        </Link>
    );
}

/**
 * The sticky 60 px glass header of public and candidate pages: brand, the nav (centred from 768 px) and the
 * account actions. Guests get sign-in and registration; candidates their five destinations, the bell and the
 * account menu; staff visiting public pages a way back to their workspace. Under 768 px the candidate nav moves to
 * `CandidateTabBar`, which the layout renders.
 */
export function SiteHeader({
    userInfo,
    initialNotifications = NO_NOTIFICATIONS,
    initialUnreadCount = 0,
}: SiteHeaderProps) {
    const pathname = usePathname();
    const disconnectSocket = useSocketStore((state) => state.disconnect);
    const staff = isStaffRole(userInfo?.role);
    const candidate = !!userInfo && !staff;
    const items = candidate ? CANDIDATE_NAV : PUBLIC_NAV;

    return (
        <header data-shell="site" className="sticky top-0 z-header h-[60px] border-b border-line">
            {/*
              The frosted glass is its own layer. backdrop-filter on the header itself would make the header the
              containing block of the notification panel's fixed click-catcher, shrinking it to these 60 px.
            */}
            <div
                aria-hidden="true"
                className={cn(
                    'absolute inset-0 -z-10 bg-canvas/95',
                    'supports-[backdrop-filter]:bg-canvas/75 supports-[backdrop-filter]:backdrop-blur-xl',
                    'supports-[backdrop-filter]:backdrop-saturate-150',
                )}
            />
            <div className="mx-auto flex h-full max-w-[1200px] items-center gap-3 px-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6 lg:px-6">
                <BrandMark className="justify-self-start" />
                {/* Phones: the candidate nav lives in the tab bar; a guest's single link would crowd the buttons. */}
                <nav
                    aria-label="Điều hướng chính"
                    className={cn('min-w-0 md:col-start-2', candidate ? 'hidden md:block' : 'hidden sm:block')}
                >
                    <ul className="flex items-center gap-0.5 lg:gap-1">
                        {items.map((item) => (
                            <li key={item.href}>
                                <SiteNavLink item={item} active={isNavActive(pathname, item.href)} />
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="ml-auto flex shrink-0 items-center gap-2 md:col-start-3 md:justify-self-end">
                    {userInfo ? (
                        <>
                            {staff ? (
                                <ButtonLink href={landingForRole(userInfo.role)} variant="secondary" size="sm">
                                    Trang quản lý
                                </ButtonLink>
                            ) : null}
                            <NotificationDropdown
                                initialNotifications={initialNotifications}
                                initialUnreadCount={initialUnreadCount}
                            />
                            <AccountMenu
                                variant="header"
                                name={userInfo.fullName || 'Tài khoản'}
                                subtitle={staff ? staffRoleLabel(userInfo.role) : 'Ứng viên'}
                                profileHref={staff ? '/my-profile' : '/profile'}
                                profileLabel={staff ? 'Hồ sơ của tôi' : 'Hồ sơ'}
                                logoutRedirect={staff ? '/sign-in/admin' : '/sign-in'}
                                onBeforeLogout={disconnectSocket}
                            />
                        </>
                    ) : (
                        <>
                            <ButtonLink href="/sign-in" variant="ghost" size="sm">
                                Đăng nhập
                            </ButtonLink>
                            <ButtonLink href="/register" size="sm">
                                Đăng ký
                            </ButtonLink>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
