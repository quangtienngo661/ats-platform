import { cn } from './cn';

export function ScoreBar({ score, label = 'Gợi ý AI', className }: { score: number | null; label?: string; className?: string }) {
    if (score === null || !Number.isFinite(score)) {
        return <span className={cn('text-caption text-ink-3', className)}>Chưa có điểm</span>;
    }
    const value = Math.round(Math.min(100, Math.max(0, score)));
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                role="meter"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-surface-2"
            >
                <div
                    className="h-full origin-left rounded-full bg-accent"
                    style={{ transform: `scaleX(${value / 100})` }}
                />
            </div>
            <span className="text-caption font-medium tabular-nums text-ink">{value}</span>
        </div>
    );
}
