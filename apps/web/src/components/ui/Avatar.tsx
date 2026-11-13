import { avatarInitials, avatarTone } from '@/lib/avatar-tone';
import { cn } from './cn';

const SIZES = {
    24: 'size-6 rounded-lg text-micro',
    28: 'size-7 rounded-lg text-micro',
    32: 'size-8 rounded-lg text-caption',
    40: 'size-10 rounded-lg text-body-sm',
    64: 'size-16 rounded-card text-title',
} as const;

export function Avatar({ name, size = 32, className }: { name: string; size?: 24 | 28 | 32 | 40 | 64; className?: string }) {
    const tone = avatarTone(name);
    return (
        <span
            title={name}
            className={cn(
                'inline-flex shrink-0 select-none items-center justify-center font-medium',
                SIZES[size],
                tone.bg,
                tone.fg,
                className,
            )}
        >
            <span aria-hidden="true">{avatarInitials(name)}</span>
        </span>
    );
}
