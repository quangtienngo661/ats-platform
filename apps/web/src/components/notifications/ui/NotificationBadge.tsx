interface NotificationBadgeProps {
    count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
    if (count <= 0) return null;

    return (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-[#FF3B30] text-white text-[9px] px-1 border-2 border-white animate-pulse"
            style={{ fontWeight: 700 }}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}
