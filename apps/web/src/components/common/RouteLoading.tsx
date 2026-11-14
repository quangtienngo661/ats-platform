import { Skeleton } from '@/components/ui';
import { cn } from '@/components/ui/cn';

type Tone = 'canvas' | 'night';

/** Title and meta widths per row, varied so the list reads as content rather than as stripes. */
const ROWS = [
    ['w-2/5', 'w-1/4'],
    ['w-1/3', 'w-1/5'],
    ['w-1/2', 'w-1/4'],
    ['w-2/5', 'w-1/6'],
    ['w-1/3', 'w-1/5'],
] as const;

/**
 * `Skeleton` on light surfaces; inside the mock interview the same block as a 7% veil of the night ink, which shows
 * on both `night` and the `night-2` card (a `night-3` fill would vanish on the card).
 */
function Block({ tone, className }: { tone: Tone; className: string }) {
    if (tone === 'night') {
        return <div aria-hidden="true" className={cn('animate-pulse rounded-ctl bg-night-ink/[.07]', className)} />;
    }
    return <Skeleton className={className} />;
}

/**
 * The fallback of every route group's `loading.tsx`: a skeleton of an app page (toolbar, filters, list) under a
 * status that screen readers announce as "Đang tải…". `tone="night"` is for the mock interview's dark shell.
 */
export default function RouteLoading({ tone = 'canvas' }: { tone?: Tone }) {
    const night = tone === 'night';
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Đang tải…"
            className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6"
        >
            <span className="sr-only">Đang tải…</span>

            <div className="flex items-center justify-between gap-4">
                <Block tone={tone} className="h-7 w-44 max-w-[50%]" />
                <Block tone={tone} className="h-9 w-32" />
            </div>

            <div className="mt-5 flex gap-2">
                <Block tone={tone} className="h-9 w-full max-w-xs" />
                <Block tone={tone} className="hidden h-9 w-28 sm:block" />
            </div>

            <div
                className={cn(
                    'mt-5 overflow-hidden rounded-card',
                    night ? 'border border-night-line bg-night-2' : 'bg-surface shadow-e1',
                )}
            >
                {ROWS.map(([title, meta], index) => (
                    <div
                        key={index}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3.5',
                            index > 0 && (night ? 'border-t border-night-line' : 'border-t border-line'),
                        )}
                    >
                        <Block tone={tone} className="size-8 shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <Block tone={tone} className={cn('h-3.5', title)} />
                            <Block tone={tone} className={cn('h-3', meta)} />
                        </div>
                        <Block tone={tone} className="hidden h-6 w-20 sm:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}
