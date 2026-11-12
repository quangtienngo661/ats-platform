/** Motion presets. Numbers mirror the Tailwind utilities `duration-*` and `ease-*` (spec §6). */
export const duration = { press: 0.12, hover: 0.2, base: 0.28, slow: 0.42 } as const;

export const ease = { out: [0.16, 1, 0.3, 1], in: [0.5, 0, 0.75, 0] } as const;

export const spring = { snappy: { type: 'spring', stiffness: 500, damping: 40 } } as const;

/** Exits are quicker than enters. */
export function exitDuration(enter: number): number {
    return enter * 0.7;
}

/** Delay for the `index`-th child, or `null` once `index` reaches `cap` (or is negative). */
export function staggerDelay(index: number, step = 0.04, cap = 8): number | null {
    if (index < 0 || index >= cap) return null;
    return index * step;
}

export const fadeRise = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 },
} as const;
