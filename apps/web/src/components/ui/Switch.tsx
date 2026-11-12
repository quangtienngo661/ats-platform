'use client';

import * as m from 'motion/react-m';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { spring } from '@/lib/motion';
import { cn } from './cn';

export type SwitchProps = Omit<
    ComponentPropsWithoutRef<'button'>,
    'children' | 'onClick' | 'onChange' | 'role' | 'type' | 'aria-checked'
> & {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** Visible label; it is also the switch's accessible name, and clicking it toggles. */
    label: ReactNode;
};

/** An on/off toggle (`role="switch"`). The thumb moves on the snappy spring (spec §6). */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
    { checked, onCheckedChange, label, className, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'group inline-flex min-h-6 items-center gap-2.5 rounded-ctl text-left text-body-sm text-ink',
                'disabled:cursor-not-allowed disabled:text-ink-4',
                className,
            )}
            {...props}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
                    'transition duration-hover ease-out-expo group-disabled:opacity-50',
                    checked ? 'bg-ink group-hover:bg-ink/90' : 'bg-line-strong group-hover:bg-ink-3',
                )}
            >
                <m.span
                    className="size-4 rounded-full bg-surface shadow-e2"
                    initial={false}
                    animate={{ x: checked ? 16 : 0 }}
                    transition={spring.snappy}
                />
            </span>
            <span className="min-w-0">{label}</span>
        </button>
    );
});
