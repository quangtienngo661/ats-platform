'use client';

import { Bell } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';

interface NotificationBellButtonProps {
    unreadCount: number;
    isOpen: boolean;
    onToggle: () => void;
}

export function NotificationBellButton({
    unreadCount,
    isOpen,
    onToggle,
}: NotificationBellButtonProps) {
    return (
        <button
            type="button"
            aria-label="Notifications"
            aria-expanded={isOpen}
            onClick={onToggle}
            className="relative p-2 rounded-card text-ink-3 transition hover:bg-surface-2"
        >
            <Bell className="w-[18px] h-[18px]" />
            <NotificationBadge count={unreadCount} />
        </button>
    );
}
