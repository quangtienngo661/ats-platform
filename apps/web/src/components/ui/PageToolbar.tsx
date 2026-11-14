import type { ReactNode } from 'react';
import { cn } from './cn';

export function PageToolbar({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-3', className)}>
            <h1 className="min-w-0 break-words text-title font-semibold text-ink">{title}</h1>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}
