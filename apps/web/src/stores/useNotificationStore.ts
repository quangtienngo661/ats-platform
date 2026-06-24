import { INotification } from '@/types/interfaces/notification.interface';
import { create } from 'zustand';

interface NotificationState {
    notifications: INotification[];
    unreadCount: number;
    setInitialNotifications: (notifications: INotification[], unreadCount: number) => void;
    prependNotification: (notification: INotification) => void;
    markRead: (notificationId: string) => void;
    markAllRead: () => void;
    removeNotification: (notificationId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    setInitialNotifications: (notifications, unreadCount) => {
        set({ notifications, unreadCount });
    },

    prependNotification: (notification) => {
        const { notifications, unreadCount } = get();
        const exists = notifications.some((item) => item.notificationId === notification.notificationId);
        if (exists) return;

        set({
            notifications: [notification, ...notifications],
            unreadCount: notification.isRead ? unreadCount : unreadCount + 1,
        });
    },

    markRead: (notificationId) => {
        const { notifications, unreadCount } = get();
        const target = notifications.find((item) => item.notificationId === notificationId);
        if (!target || target.isRead) return;

        set({
            notifications: notifications.map((item) =>
                item.notificationId === notificationId ? { ...item, isRead: true } : item,
            ),
            unreadCount: Math.max(0, unreadCount - 1),
        });
    },

    markAllRead: () => {
        const { notifications } = get();
        set({
            notifications: notifications.map((item) => ({ ...item, isRead: true })),
            unreadCount: 0,
        });
    },

    removeNotification: (notificationId) => {
        const { notifications, unreadCount } = get();
        const target = notifications.find((item) => item.notificationId === notificationId);

        set({
            notifications: notifications.filter((item) => item.notificationId !== notificationId),
            unreadCount: target && !target.isRead ? Math.max(0, unreadCount - 1) : unreadCount,
        });
    },
}));
