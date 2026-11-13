interface NotificationBadgeProps {
    count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
    if (count <= 0) return null;

    // A 16 px pill: round for one digit, wider for "99+". The white edge is a ring outside it, so all 16 px hold the digits.
    return (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-micro font-semibold leading-none tabular-nums text-surface ring-2 ring-surface motion-safe:animate-pulse">
            {count > 99 ? '99+' : count}
        </span>
    );
}
