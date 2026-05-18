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
            className="relative p-2 rounded-xl text-[#6E6E73] hover:bg-[#F5F5F7] transition-all"
        >
            <Bell className="w-[18px] h-[18px]" />
            <NotificationBadge count={unreadCount} />
        </button>
    );
}
