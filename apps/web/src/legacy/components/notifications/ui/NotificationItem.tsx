import { Briefcase, CalendarCheck, Settings } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';
import { INotification } from '@/types/interfaces/notification.interface';

// Map notification type → icon + color
const typeConfig: Record<string, { icon: typeof Briefcase; color: string }> = {
    application: { icon: Briefcase, color: '#0071E3' },
    interview: { icon: CalendarCheck, color: '#6366F1' },
    system: { icon: Settings, color: '#34C759' },
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
            className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[#F2F2F7] last:border-0 transition-colors ${notification.isRead ? 'hover:bg-[#F5F5F7]' : 'bg-[#EBF3FD]/30 hover:bg-[#EBF3FD]/50'
                }`}
        >
            {/* Unread dot */}
            {!notification.isRead &&
                (<div className="flex-shrink-0 mt-2">
                    <div
                        className="w-2 h-2 rounded-full transition-opacity"
                        style={{
                            background: notification.isRead ? 'transparent' : config.color,
                            opacity: notification.isRead ? 0 : 1,
                        }}
                    />
                </div>)
            }

            {/* Icon */}
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${config.color}15` }}
            >
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
            </div>

            {/* Content */}     
            <div className="flex-1 min-w-0">
                <p
                    className={`text-[12px] leading-[1.45] ${notification.isRead ? 'text-[#6E6E73]' : 'text-[#1D1D1F]'}`}
                    style={{ fontFamily: SFT, fontWeight: notification.isRead ? 400 : 500 }}
                >
                    {notification.message}
                </p>
                <p className="text-[10px] text-[#AEAEB2] mt-0.5">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>
        </button>
    );
}
