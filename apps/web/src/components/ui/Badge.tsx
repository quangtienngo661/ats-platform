import type { ReactNode } from 'react';
import type { Tone } from '@/lib/status-tones';
import { cn } from './cn';

const TONE_CLASSES: Record<Tone, string> = {
    neutral: 'bg-surface-2 text-ink-2',
    accent: 'bg-accent-soft text-accent-text',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex h-5 items-center whitespace-nowrap rounded-ctl px-1.5 text-micro',
                TONE_CLASSES[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}
