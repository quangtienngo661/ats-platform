const TONES = [
    { bg: 'bg-accent-soft', fg: 'text-accent-text' },
    { bg: 'bg-success-soft', fg: 'text-success' },
    { bg: 'bg-warning-soft', fg: 'text-warning' },
    { bg: 'bg-surface-2', fg: 'text-ink-2' },
    { bg: 'bg-danger-soft', fg: 'text-danger' },
    { bg: 'bg-ink', fg: 'text-surface' },
] as const;

/** Stable colour pair for a name (case and surrounding spaces ignored). */
export function avatarTone(name: string): { bg: string; fg: string } {
    const key = name.normalize('NFC').toLowerCase().trim();
    let hash = 0;
    for (const ch of key) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
    return TONES[hash % TONES.length];
}

/**
 * First letter of the last two words (Vietnamese given-name order), uppercase. Only letters and digits count, so a
 * job title such as "Engineer (NestJS)" gives "EN", not "E(".
 */
export function avatarInitials(name: string): string {
    const words = name
        .normalize('NFC')
        .split(/\s+/)
        .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
        .filter(Boolean);
    return words
        .slice(-2)
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase();
}
