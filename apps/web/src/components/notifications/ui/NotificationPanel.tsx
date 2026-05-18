'use client';

import { motion } from 'motion/react';
import { Bell, CheckCheck } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
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
            <div className="fixed inset-0 z-40" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`${isCompact ? 'w-[360px] rounded-xl' : 'w-[340px] rounded-2xl'} absolute right-0 top-full mt-2 bg-white shadow-xl shadow-black/10 border border-[#E5E5EA] z-50 overflow-hidden`}
            >
                {!isCompact && (
                    <div className="px-4 py-3 border-b border-[#F2F2F7] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Thông báo
                            </span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-[#0071E3] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center" style={{ fontWeight: 600 }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                className="flex items-center gap-1 text-[11px] text-[#0071E3] hover:text-[#0060C0] transition-colors"
                                style={{ fontWeight: 500 }}
                            >
                                <CheckCheck className="w-3 h-3" />
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
                            <Bell className="w-8 h-8 text-[#AEAEB2] mb-2" />
                            <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                                Không có thông báo
                            </p>
                        </div>
                    )}
                </div>

                {isCompact && unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="w-full h-10 border-t border-[#F2F2F7] bg-white hover:bg-[#F5F5F7] flex items-center justify-center gap-2 text-[12px] text-[#0071E3] transition-colors"
                        style={{ fontWeight: 600 }}
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </motion.div>
        </>
    );
}
