/** The content column of every home section: the 1200 px of the site header and footer, with the same gutters. */
export const HOME_CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 lg:px-6';

/** `Reveal` plays at the base duration; sections of public pages use the slow one (spec §6, `duration.slow`). */
export const SECTION_RISE = '[animation-duration:420ms]';

/**
 * The hero's quiet dot grid, drawn in ink at 12%, every 22 px. Pair it with `dotMask` so it fades out instead of
 * ending in a hard edge. Only tokens: no colour is written here.
 */
export const DOT_GRID = {
    backgroundImage: 'radial-gradient(rgb(var(--ink) / .12) 1px, transparent 1.4px)',
    backgroundSize: '22px 22px',
} as const;

/** Fades a layer out from `at` (a CSS position) to transparent at `reach` of the shorter side. */
export function dotMask(at: string, reach = '70%') {
    const mask = `radial-gradient(ellipse at ${at}, black, transparent ${reach})`;
    return { maskImage: mask, WebkitMaskImage: mask } as const;
}
