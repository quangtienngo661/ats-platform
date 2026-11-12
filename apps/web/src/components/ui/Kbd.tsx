import type { ReactNode } from 'react';
import { cn } from './cn';

/** A key cap for shortcuts ("Ctrl", "K"). */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <kbd
            className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded bg-surface px-1',
                'font-sans text-micro text-ink-3 shadow-e1',
                className,
            )}
        >
            {children}
        </kbd>
    );
}
