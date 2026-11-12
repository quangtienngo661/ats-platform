'use client';

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { Breadcrumbs, IconButton } from '@/components/ui';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import type { INotification } from '@/types/interfaces/notification.interface';
import type { Crumb } from './staff-nav';

export type StaffTopBarProps = {
    crumbs: Crumb[];
    onMenuOpen: () => void;
    initialNotifications: INotification[];
    initialUnreadCount: number;
    /** The command palette trigger (`CommandPalette`) goes here. */
    commandSlot?: ReactNode;
};

/** The 56 px sticky bar above staff pages: menu button (under 1024 px), breadcrumbs, command slot, notifications. */
export function StaffTopBar({
    crumbs,
    onMenuOpen,
    initialNotifications,
    initialUnreadCount,
    commandSlot,
}: StaffTopBarProps) {
    const current = crumbs.at(-1)?.label;
    return (
        <header className="sticky top-0 z-header flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 lg:px-6">
            {/*
              The frosted glass is its own layer. backdrop-filter on the header itself would make the header the
              containing block of the notification panel's fixed click-catcher, shrinking it to these 56 px.
            */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-canvas/80 backdrop-blur-md backdrop-saturate-150" />
            <IconButton aria-label="Mở menu" onClick={onMenuOpen} className="-ml-2 lg:hidden">
                <Menu aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <div className="min-w-0 flex-1">
                {crumbs.length > 0 ? (
                    <div className="hidden sm:block">
                        <Breadcrumbs items={crumbs} />
                    </div>
                ) : null}
                {/* Phones get the current page name only; the full trail would wrap out of the bar. */}
                {current ? <p className="truncate text-body-sm font-medium text-ink sm:hidden">{current}</p> : null}
            </div>
            {commandSlot}
            <NotificationDropdown
                initialNotifications={initialNotifications}
                initialUnreadCount={initialUnreadCount}
                panelVariant="compact"
            />
        </header>
    );
}
