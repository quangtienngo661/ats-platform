import { Briefcase, CalendarCheck, Settings } from 'lucide-react';
import { INotification } from '@/types/interfaces/notification.interface';

// Map notification type → icon + token classes (icon tile, unread dot)
const typeConfig: Record<string, { icon: typeof Briefcase; tile: string; dot: string }> = {
    application: { icon: Briefcase, tile: 'bg-accent-soft text-accent-text', dot: 'bg-accent' },
    interview: { icon: CalendarCheck, tile: 'bg-warning-soft text-warning', dot: 'bg-warning' },
    system: { icon: Settings, tile: 'bg-success-soft text-success', dot: 'bg-success' },
};

// Relative time format
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}

interface NotificationItemProps {
    notification: INotification;
    onMarkRead?: () => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
    const config = typeConfig[notification.type] || typeConfig.system;
    const Icon = config.icon;

    return (
        <button
            onClick={onMarkRead}
            className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 ${
                notification.isRead ? 'hover:bg-surface-2' : 'bg-accent-soft/30 hover:bg-accent-soft/50'
            }`}
        >
            {/* Unread dot */}
            {!notification.isRead && (
                <div className="mt-2 shrink-0">
                    <div className={`size-2 rounded-full ${config.dot}`} />
                </div>
            )}

            {/* Icon */}
            <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-ctl ${config.tile}`}>
                <Icon className="size-3.5" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className={`text-caption ${notification.isRead ? 'text-ink-3' : 'font-medium text-ink'}`}>
                    {notification.message}
                </p>
                <p className="mt-0.5 text-micro font-normal text-ink-4">{timeAgo(notification.createdAt)}</p>
            </div>
        </button>
    );
}
