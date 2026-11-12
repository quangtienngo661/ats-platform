import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
            {Icon && (
                <span className="mb-4 flex size-10 items-center justify-center rounded-card bg-surface-2 text-ink-3">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
            )}
            <h2 className="text-title-sm text-ink">{title}</h2>
            {description && <p className="mt-1 max-w-sm text-body-sm text-ink-3">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
