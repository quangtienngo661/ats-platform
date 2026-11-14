import { cn } from '@/components/ui/cn';

const DOT_DELAYS = ['0ms', '160ms', '320ms'];

/**
 * Three dots that breathe in turn: the one infinite animation the interview allows (design brief, Motion).
 * Opacity only; under reduced motion global.css stops the loop after a single, instant cycle.
 */
export function TypingDots({ className }: { className?: string }) {
    return (
        <span aria-hidden="true" className={cn('inline-flex items-center gap-1', className)}>
            {DOT_DELAYS.map((delay) => (
                <span
                    key={delay}
                    className="size-1.5 animate-pulse rounded-full bg-current"
                    style={{ animationDelay: delay, animationDuration: '1.2s' }}
                />
            ))}
        </span>
    );
}

export function TypingIndicator() {
    return (
        <div className="flex justify-start">
            <div
                role="status"
                aria-label="AI đang trả lời"
                className="flex h-10 items-center rounded-card bg-night-2 px-4 text-night-ink-3"
            >
                <TypingDots />
            </div>
        </div>
    );
}
