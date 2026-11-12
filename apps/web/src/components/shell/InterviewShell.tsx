import type { ReactNode } from 'react';

/**
 * The AI mock interview runs full screen on the night surface (spec §8 Phỏng vấn thử), with no site header.
 * A one-column grid, not a block: its single row stretches to the viewport, so a page that sizes itself with
 * `h-full` (the result page scrolls inside its own `h-full overflow-y-auto` box) fills the screen.
 */
export function InterviewShell({ children }: { children: ReactNode }) {
    return (
        <main
            id="main-content"
            data-shell="interview"
            className="grid min-h-dvh grid-cols-[minmax(0,1fr)] bg-night text-night-ink"
        >
            {children}
        </main>
    );
}
