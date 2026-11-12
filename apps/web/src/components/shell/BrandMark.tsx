import Link from 'next/link';
import { cn } from '@/components/ui/cn';

/**
 * The TalentAI logo: a 22 px ink square with a window cut out of it (no Sparkles), and the wordmark. The cut-out
 * is a hole in the path, not a painted square, so the mark sits on any surface. Links to `/`.
 * `compact` keeps the wordmark for screen readers only (the staff rail).
 */
export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
    return (
        <Link
            href="/"
            className={cn('inline-flex min-w-0 items-center gap-2 rounded-ctl text-ink', className)}
        >
            <svg aria-hidden="true" viewBox="0 0 22 22" className="size-[22px] shrink-0" fill="currentColor">
                <path
                    fillRule="evenodd"
                    d="M6 0h10a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Zm2 6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H8Z"
                />
            </svg>
            <span className={compact ? 'sr-only' : 'truncate text-body font-semibold tracking-tight'}>
                TalentAI
            </span>
        </Link>
    );
}
