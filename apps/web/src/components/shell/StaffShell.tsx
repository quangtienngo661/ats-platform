'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import type { INotification } from '@/types/interfaces/notification.interface';
import { NavDrawer, NavDrawerClose } from './NavDrawer';
import { isRailCookie, SIDEBAR_COOKIE, sidebarCookie, staffBreadcrumbs } from './staff-nav';
import { StaffSidebar } from './StaffSidebar';
import { CommandPalette } from './CommandPalette';
import { StaffTopBar } from './StaffTopBar';

export type StaffShellProps = {
    children: ReactNode;
    userRole?: string;
    userName?: string;
    userEmail?: string;
    organizationName?: string;
    initialNotifications?: INotification[];
    initialUnreadCount?: number;
    /** From the `talentai-sidebar` cookie, so the server renders the rail without a flash. */
    initialCollapsed: boolean;
};

/**
 * The staff and admin frame.
 *
 * Width: the grid column switches between 248 and 64 px in one step and only the labels animate (opacity and
 * transform). A transition on `grid-template-columns` or `width` would re-lay out every table and Kanban column
 * on the page on every frame; one reflow per click does not. The sidebar is sticky in its column, and the page
 * scrolls the document, so browser scroll restoration and `scroll-padding-top` work as usual.
 */
export function StaffShell({
    children,
    userRole,
    userName,
    userEmail,
    organizationName,
    initialNotifications = [],
    initialUnreadCount = 0,
    initialCollapsed,
}: StaffShellProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const [labelsEntering, setLabelsEntering] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const crumbs = useMemo(() => staffBreadcrumbs(pathname), [pathname]);

    // A prefetched layout can carry an `initialCollapsed` from before a toggle in another layout; the cookie holds
    // the latest choice. Applied before paint and without the label entrance, so nothing flickers. No cookie: keep
    // the prop, which the server read from the same (absent) cookie.
    useLayoutEffect(() => {
        const prefix = `${SIDEBAR_COOKIE}=`;
        const saved = document.cookie
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(prefix));
        if (saved !== undefined) setCollapsed(isRailCookie(saved.slice(prefix.length)));
    }, []);

    // A drawer left open while the window grows past 1024 px would trap focus in hidden content.
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => {
            if (desktop.matches) setDrawerOpen(false);
        };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, []);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        setLabelsEntering(!next);
        document.cookie = sidebarCookie(next);
    };

    const account = { userRole, userName, userEmail, organizationName };

    return (
        <TooltipProvider>
            <div
                data-shell="staff"
                className={cn(
                    'min-h-dvh bg-canvas lg:grid',
                    collapsed ? 'lg:grid-cols-[64px_minmax(0,1fr)]' : 'lg:grid-cols-[248px_minmax(0,1fr)]',
                )}
            >
                <div className="sticky top-0 hidden h-dvh self-start border-r border-line lg:block">
                    <StaffSidebar
                        mode={collapsed ? 'rail' : 'full'}
                        onToggle={toggle}
                        labelsEntering={labelsEntering}
                        {...account}
                    />
                </div>
                <div className="flex min-w-0 flex-col">
                    <StaffTopBar
                        crumbs={crumbs}
                        onMenuOpen={() => setDrawerOpen(true)}
                        initialNotifications={initialNotifications}
                        initialUnreadCount={initialUnreadCount}
                        commandSlot={<CommandPalette userRole={userRole} />}
                    />
                    <main id="main-content" className="min-w-0 flex-1">
                        {children}
                    </main>
                </div>
            </div>
            <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Điều hướng">
                <StaffSidebar
                    mode="drawer"
                    onNavigate={() => setDrawerOpen(false)}
                    headerAction={<NavDrawerClose />}
                    {...account}
                />
            </NavDrawer>
        </TooltipProvider>
    );
}
