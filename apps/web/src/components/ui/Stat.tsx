'use client';

import { useEffect, useState } from 'react';
import { cn } from './cn';

const COUNT_MS = 600;

function format(n: number): string {
    return Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** KPI figure. Counts up once on mount; assistive tech always gets the final value. */
export function Stat({
    label,
    value,
    suffix = '',
    delta,
    className,
}: {
    label: string;
    value: number;
    suffix?: string;
    delta?: string;
    className?: string;
}) {
    // First render (server and client) shows the final value; the count-up starts after mount.
    const [shown, setShown] = useState(value);

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || value === 0) {
            setShown(value);
            return;
        }
        let frame = 0;
        const start = performance.now();
        setShown(0);
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / COUNT_MS);
            setShown(value * (1 - Math.pow(1 - t, 3)));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value]);

    return (
        <div className={cn('min-w-0', className)}>
            <p className="text-caption text-ink-3">{label}</p>
            <p className="mt-1 text-display-sm tabular-nums text-ink">
                <span className="sr-only">{`${format(value)}${suffix}`}</span>
                <span aria-hidden="true">
                    {format(shown)}
                    <span>{suffix}</span>
                </span>
            </p>
            {delta && <p className="mt-1 text-caption tabular-nums text-ink-3">{delta}</p>}
        </div>
    );
}
