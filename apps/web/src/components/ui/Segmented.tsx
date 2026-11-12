'use client';

import * as m from 'motion/react-m';
import { useId, useRef, type KeyboardEvent } from 'react';
import { spring } from '@/lib/motion';
import { cn } from './cn';

export type SegmentedProps = {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    /** Accessible name of the group. */
    label: string;
};

/** A pill switch between a few views (`role="radiogroup"`). Arrow keys move and select. */
export function Segmented({ options, value, onValueChange, label }: SegmentedProps) {
    const id = useId();
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    function onKeyDown(e: KeyboardEvent, index: number) {
        const step =
            e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = (index + step + options.length) % options.length;
        onValueChange(options[next].value);
        refs.current[next]?.focus();
    }

    const activeIndex = Math.max(
        0,
        options.findIndex((o) => o.value === value),
    );

    return (
        <div role="radiogroup" aria-label={label} className="inline-flex rounded-ctl bg-surface-2 p-0.5">
            {options.map((o, i) => {
                const checked = i === activeIndex;
                return (
                    <button
                        key={o.value}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onValueChange(o.value)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        className={cn(
                            'relative h-7 rounded-ctl px-3 text-body-sm transition-colors duration-hover ease-out-expo',
                            checked ? 'text-ink' : 'text-ink-3 hover:text-ink',
                        )}
                    >
                        {checked ? (
                            <m.span
                                layoutId={`${id}-segmented`}
                                transition={spring.snappy}
                                className="absolute inset-0 rounded-ctl bg-surface shadow-e2"
                            />
                        ) : null}
                        <span className="relative">{o.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
