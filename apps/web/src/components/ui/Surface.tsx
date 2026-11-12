import type { ElementType, HTMLAttributes } from 'react';
import { cn } from './cn';

const VARIANTS = {
    plain: 'bg-surface shadow-e1',
    raised: 'bg-surface shadow-e2',
    inset: 'bg-surface-2',
} as const;

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
    variant?: keyof typeof VARIANTS;
    as?: ElementType;
}

export function Surface({ variant = 'plain', as: Tag = 'div', className, ...rest }: SurfaceProps) {
    return <Tag className={cn('rounded-card', VARIANTS[variant], className)} {...rest} />;
}
