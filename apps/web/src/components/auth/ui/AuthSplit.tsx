import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/shell/BrandMark';

export interface AuthValue {
    icon: LucideIcon;
    text: string;
}

/**
 * Film grain for the brand panel: fractal noise, desaturated, tiled. Drawn at 6% opacity so it reads as texture, not
 * as a pattern. `%23` is `#`, so the data URI carries no raw hex colour.
 */
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E" +
    "%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E" +
    "%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E" +
    "%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** One soft light in the top corner of the panel, white at 6%. */
const HIGHLIGHT = 'radial-gradient(closest-side, rgb(255 255 255 / .06), transparent)';

interface AuthSplitProps {
    children: ReactNode;
    /** The line under the form: the terms for candidates, the security notice for staff. */
    note?: ReactNode;
    /** Names the brand panel for screen readers and heads it on screen. */
    panelLabel: string;
    values: readonly AuthValue[];
}

/**
 * The frame of every sign-in and sign-up page (spec §8 Auth). The form sits in a centred column at most 400 px wide,
 * under the logo; from 1024 px a night panel with grain, one soft light and three product values fills the right
 * half. On smaller screens there is only the form.
 */
export function AuthSplit({ children, note, panelLabel, values }: AuthSplitProps) {
    return (
        <div className="grid min-h-dvh bg-canvas text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 lg:px-12">
                <header className="flex h-9 items-center">
                    <BrandMark />
                </header>
                <main id="main-content" className="flex flex-1 flex-col items-center justify-center py-10 sm:py-16">
                    <div className="w-full max-w-[400px]">
                        {children}
                        {note}
                    </div>
                </main>
            </div>

            {/* Sticky, so a long form (sign-up) scrolls past a panel that stays in view. */}
            <aside aria-label={panelLabel} className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start lg:p-3">
                <div className="relative h-full overflow-hidden rounded-panel bg-night text-night-ink">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-[.06]"
                        style={{ backgroundImage: GRAIN, backgroundSize: '200px 200px' }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-56 -top-72 size-[46rem] rounded-full motion-safe:animate-fade-in"
                        style={{ backgroundImage: HIGHLIGHT, animationDuration: '1200ms' }}
                    />
                    <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
                        <p className="text-body-sm text-night-ink-3">{panelLabel}</p>
                        <ul className="flex flex-col gap-7">
                            {values.map(({ icon: Icon, text }, index) => (
                                <li
                                    key={text}
                                    className="flex items-center gap-4 motion-safe:animate-rise"
                                    style={{ animationDuration: '420ms', animationDelay: `${160 + index * 60}ms` }}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-card border border-night-line bg-night-2 text-night-ink-2">
                                        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                                    </span>
                                    {/* 16 px at 1024 px, where the panel is 488 px wide; 20 px from 1280 px. */}
                                    <span className="min-w-0 text-balance text-title-sm font-medium text-night-ink xl:text-title xl:font-medium">
                                        {text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
    );
}
