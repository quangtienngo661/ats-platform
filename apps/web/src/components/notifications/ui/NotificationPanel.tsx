'use client';

import { motion } from 'motion/react';
import { Bell, CheckCheck } from 'lucide-react';
import { INotification } from '@/types/interfaces/notification.interface';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
    notifications: INotification[];
    unreadCount: number;
    variant?: 'default' | 'compact';
    onClose: () => void;
    onMarkAllRead: () => void;
    onMarkRead: (notificationId: string) => void;
}

export function NotificationPanel({
    notifications,
    unreadCount,
    variant = 'default',
    onClose,
    onMarkAllRead,
    onMarkRead,
}: NotificationPanelProps) {
    const isCompact = variant === 'compact';

    return (
        <>
            <button type="button" tabIndex={-1} aria-label="Đóng menu" className="fixed inset-0 z-overlay" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`${isCompact ? 'w-[360px] rounded-card' : 'w-[340px] rounded-panel'} absolute right-0 top-full z-popover mt-2 overflow-hidden bg-surface shadow-e4`}
            >
                {!isCompact && (
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-body-sm font-semibold text-ink">
                                Thông báo
                            </span>
                            {unreadCount > 0 && (
                                <span className="min-w-[18px] rounded-full bg-accent px-1.5 py-0.5 text-center text-micro font-semibold text-surface">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                className="flex items-center gap-1 text-micro text-accent-text transition-colors hover:underline"
                            >
                                <CheckCheck className="size-3" />
                                Đọc tất cả
                            </button>
                        )}
                    </div>
                )}

                <div className={`${isCompact ? 'max-h-[420px]' : 'max-h-[380px]'} overflow-y-auto`}>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.notificationId}
                                notification={notification}
                                onMarkRead={() => onMarkRead(notification.notificationId)}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Bell className="mb-2 size-8 text-ink-4" />
                            <p className="text-caption font-medium text-ink-3">
                                Không có thông báo
                            </p>
                        </div>
                    )}
                </div>

                {isCompact && unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="flex h-10 w-full items-center justify-center gap-2 border-t border-line bg-surface text-caption font-semibold text-accent-text transition-colors hover:bg-surface-2"
                    >
                        <CheckCheck className="size-3.5" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </motion.div>
        </>
    );
}
