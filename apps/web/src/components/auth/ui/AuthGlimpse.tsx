import { Avatar } from '@/components/ui';

/** A purely decorative sample, drawn for the night panel: it says what the product shows, and is marked as an example. */
function Meter({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-line">
                <div className="h-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${value / 100})` }} />
            </div>
            <span className="text-caption font-medium tabular-nums text-night-ink">{value}</span>
        </div>
    );
}

/** The Badge look, in night colours (Badge cannot be recoloured: classes are not merged). */
function Example() {
    return (
        <span className="inline-flex h-5 shrink-0 items-center rounded-ctl bg-night-line px-1.5 text-micro text-night-ink-2">Ví dụ</span>
    );
}

function GlimpseCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            aria-hidden="true"
            className="mx-auto w-full max-w-[320px] rounded-card border border-night-line bg-night-2 p-4 motion-safe:animate-rise"
            style={{ animationDuration: '420ms', animationDelay: '100ms' }}
        >
            {children}
        </div>
    );
}

/** Staff: one candidate row with the AI's suggested score. */
export function StaffGlimpse() {
    return (
        <GlimpseCard>
            <div className="flex items-center gap-3">
                <Avatar name="Phạm Thu Hà" size={40} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium text-night-ink">Phạm Thu Hà</p>
                    <p className="truncate text-caption text-night-ink-3">Frontend Developer</p>
                </div>
                <Example />
            </div>
            <div className="mt-4">
                <p className="mb-1.5 text-caption text-night-ink-3">Gợi ý AI</p>
                <Meter value={86} />
            </div>
        </GlimpseCard>
    );
}

/** Candidate: one job with how well it matches. */
export function CandidateGlimpse() {
    return (
        <GlimpseCard>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-body-sm font-medium text-night-ink">Kỹ sư Backend (NestJS)</p>
                    <p className="mt-0.5 text-caption text-night-ink-3">Sao Mai Fintech</p>
                </div>
                <Example />
            </div>
            <div className="mt-4">
                <p className="mb-1.5 text-caption text-night-ink-3">Độ phù hợp</p>
                <Meter value={92} />
            </div>
        </GlimpseCard>
    );
}
