'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui';
import { cn } from '@/components/ui/cn';

/** One colour family per criterion; blue (the AI colour) leads, the rest stay in ink. Dot, slider and bar share it. */
export const WEIGHT_TONES = {
    skills: { dot: 'bg-accent', slider: 'accent-accent' },
    experience: { dot: 'bg-ink', slider: 'accent-ink' },
    education: { dot: 'bg-ink-3', slider: 'accent-ink-3' },
    threshold: { dot: 'bg-ink-4', slider: 'accent-ink-2' },
} as const;

export type WeightTone = keyof typeof WEIGHT_TONES;

/** The three weights as one stacked bar. Widths are data, so they stay inline. */
export function WeightBar({ skills, experience, education }: { skills: number; experience: number; education: number }) {
    const segments = [
        { key: 'skills', w: skills },
        { key: 'experience', w: experience },
        { key: 'education', w: education },
    ] as const;
    return (
        <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-surface-2">
            {segments.map(({ key, w }) =>
                w > 0 ? <div key={key} className={cn('h-full', WEIGHT_TONES[key].dot)} style={{ width: `${w}%` }} /> : null,
            )}
        </div>
    );
}

export function WeightRow({
    tone,
    label,
    weight,
    onWeightChange,
    disabled = false,
    unit = '%',
    ariaLabel,
    children,
}: {
    tone: WeightTone;
    label: string;
    weight: number;
    onWeightChange: (v: number) => void;
    disabled?: boolean;
    unit?: string;
    /** Accessible name of both the number box and the slider; defaults to "Trọng số {label} (%)". */
    ariaLabel?: string;
    /** A note under the slider. */
    children?: ReactNode;
}) {
    const name = ariaLabel ?? `Trọng số ${label} (%)`;
    return (
        <div className={cn('space-y-3 rounded-card bg-surface-2 p-4 transition-opacity duration-hover', disabled && 'opacity-70')}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', WEIGHT_TONES[tone].dot)} />
                    <span className="truncate text-body-sm font-medium text-ink">{label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <span className="block w-16">
                        <Input
                            aria-label={name}
                            type="number"
                            min="0"
                            max="100"
                            size="sm"
                            value={weight}
                            disabled={disabled}
                            onChange={(e) => onWeightChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                            className="text-center tabular-nums"
                        />
                    </span>
                    <span className="w-6 text-caption text-ink-3">{unit}</span>
                </div>
            </div>

            <input
                aria-label={name}
                type="range"
                min="0"
                max="100"
                value={weight}
                disabled={disabled}
                onChange={(e) => onWeightChange(parseInt(e.target.value))}
                className={cn('block h-1.5 w-full cursor-pointer disabled:cursor-not-allowed', WEIGHT_TONES[tone].slider)}
            />
            {children}
        </div>
    );
}
