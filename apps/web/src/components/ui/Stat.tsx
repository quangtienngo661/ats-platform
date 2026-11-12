'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from './cn';

const COUNT_MS = 600;
const noop = () => undefined;
const subscribe = () => noop;

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
    // Server and hydration render use the server snapshot (false): show the final value, no animation.
    // A client-only mount (in-app navigation) sees true and counts up once, unless motion is reduced.
    const isClientMount = useSyncExternalStore(subscribe, () => true, () => false);
    const [animate] = useState(
        () => isClientMount && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const [shown, setShown] = useState(animate ? 0 : value);
    const initialValue = useRef(value);
    const finished = useRef(false);

    useEffect(() => {
        if (!animate || finished.current || value !== initialValue.current) {
            setShown(value);
            return;
        }
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / COUNT_MS);
            setShown(value * (1 - Math.pow(1 - t, 3)));
            if (t < 1) frame = requestAnimationFrame(tick);
            else finished.current = true;
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [animate, value]);

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
