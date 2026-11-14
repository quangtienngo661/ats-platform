import { cn } from './cn';

/** Placeholder block while data loads. Pass size classes via `className`. */
export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden="true" className={cn('animate-pulse rounded-ctl bg-surface-2', className)} />;
}
