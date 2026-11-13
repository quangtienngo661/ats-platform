'use client';

import * as m from 'motion/react-m';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { hasModifier } from '@/lib/keyboard';
import { spring } from '@/lib/motion';
import { cn } from './cn';

export type TabsProps = {
    tabs: { value: string; label: string; content: ReactNode }[];
    value?: string;
    onValueChange?: (value: string) => void;
};

/** ARIA tabs with roving tabindex. Arrow keys, Home and End move and select. */
export function Tabs({ tabs, value, onValueChange }: TabsProps) {
    const id = useId();
    const [inner, setInner] = useState(tabs[0]?.value);
    const refs = useRef<Array<HTMLButtonElement | null>>([]);
    const current = value ?? inner;
    const activeIndex = Math.max(
        0,
        tabs.findIndex((t) => t.value === current),
    );

    function select(index: number) {
        const next = tabs[index].value;
        if (value === undefined) setInner(next);
        onValueChange?.(next);
        refs.current[index]?.focus();
    }

    function onKeyDown(e: KeyboardEvent, index: number) {
        if (hasModifier(e)) return;
        const last = tabs.length - 1;
        let target: number | null = null;
        if (e.key === 'ArrowRight') target = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') target = 0;
        else if (e.key === 'End') target = last;
        if (target === null) return;
        e.preventDefault();
        select(target);
    }

    const active = tabs[activeIndex];

    return (
        <div>
            <div role="tablist" className="flex gap-1 border-b border-line">
                {tabs.map((t, i) => {
                    const selected = i === activeIndex;
                    return (
                        <button
                            key={t.value}
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            id={`${id}-tab-${i}`}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-controls={selected ? `${id}-panel-${i}` : undefined}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => select(i)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            className={cn(
                                'relative h-9 px-3 text-body-sm transition-colors duration-hover ease-out-expo',
                                selected ? 'text-ink' : 'text-ink-3 hover:text-ink',
                            )}
                        >
                            {t.label}
                            {selected ? (
                                <m.span
                                    layoutId={`${id}-tabs`}
                                    transition={spring.snappy}
                                    className="absolute inset-x-0 -bottom-px h-0.5 bg-ink"
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>
            {active ? (
                <div
                    role="tabpanel"
                    id={`${id}-panel-${activeIndex}`}
                    aria-labelledby={`${id}-tab-${activeIndex}`}
                    tabIndex={0}
                    className="pt-4"
                >
                    {active.content}
                </div>
            ) : null}
        </div>
    );
}
