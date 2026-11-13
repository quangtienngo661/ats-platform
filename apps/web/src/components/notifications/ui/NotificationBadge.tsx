interface NotificationBadgeProps {
    count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
    if (count <= 0) return null;

    return (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-danger-solid px-1 text-micro font-semibold leading-none text-surface motion-safe:animate-pulse">
            {count > 99 ? '99+' : count}
        </span>
    );
}
