'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { NotificationBellButton } from './ui/NotificationBellButton';
import { NotificationPanel } from './ui/NotificationPanel';
import { INotification } from '@/types/interfaces/notification.interface';
import {
    markAllAsReadAction,
    markAsReadAction,
} from '@/servers/notifications/notifications.action';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { toast } from '@/lib/toast';

interface NotificationDropdownProps {
    initialNotifications?: INotification[];
    initialUnreadCount?: number;
    panelVariant?: 'default' | 'compact';
}

export function NotificationDropdown({
    initialNotifications = [],
    initialUnreadCount = 0,
    panelVariant = 'default',
}: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const setInitialNotifications = useNotificationStore((state) => state.setInitialNotifications);
    const prependNotification = useNotificationStore((state) => state.prependNotification);
    const markRead = useNotificationStore((state) => state.markRead);
    const markAllRead = useNotificationStore((state) => state.markAllRead);

    const status = useSocketStore((state) => state.status);
    const onEvent = useSocketStore((state) => state.onEvent);
    const offEvent = useSocketStore((state) => state.offEvent);

    useEffect(() => {
        setInitialNotifications(initialNotifications, initialUnreadCount);
    }, [initialNotifications, initialUnreadCount, setInitialNotifications]);

    useEffect(() => {
        if (status !== 'connected') return;

        const handleNewNotification = (notification: INotification) => {
            prependNotification(notification);
            toast.info(notification.title, notification.message);
        };

        onEvent<INotification>('notification:new', handleNewNotification);
        return () => {
            offEvent<INotification>('notification:new', handleNewNotification);
        };
    }, [status, onEvent, offEvent, prependNotification]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        markAllRead();

        const result = await markAllAsReadAction();
        if (!result.success) {
            toast.error('Thông báo', result.message);
        }
    };

    const handleMarkRead = async (notificationId: string) => {
        const notification = notifications.find((item) => item.notificationId === notificationId);
        if (!notification || notification.isRead) return;

        markRead(notificationId);
        const result = await markAsReadAction(notificationId);
        if (!result.success) {
            toast.error('Thông báo', result.message);
        }
    };

    return (
        <div className="relative">
            <NotificationBellButton
                unreadCount={unreadCount}
                isOpen={isOpen}
                onToggle={() => setIsOpen((open) => !open)}
            />

            <AnimatePresence>
                {isOpen && (
                    <NotificationPanel
                        notifications={notifications}
                        unreadCount={unreadCount}
                        variant={panelVariant}
                        onClose={() => setIsOpen(false)}
                        onMarkAllRead={handleMarkAllRead}
                        onMarkRead={handleMarkRead}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
