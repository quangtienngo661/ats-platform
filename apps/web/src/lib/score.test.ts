import { describe, expect, it } from 'vitest';
import { round1 } from './score';

describe('round1', () => {
    it('keeps one decimal, like the Decimal(5,1) score columns', () => {
        expect(round1(72.46)).toBe(72.5);
        expect(round1(72.44)).toBe(72.4);
        expect(round1(84.96)).toBe(85);
        expect(round1(72.25)).toBe(72.3);
    });

    it('leaves whole and one-decimal scores, and the 0 and 100 ends, as they are', () => {
        for (const score of [0, 0.5, 50, 99.9, 100]) expect(round1(score)).toBe(score);
    });

    it('passes NaN through, so an empty field never equals a score', () => {
        expect(round1(Number.NaN)).toBeNaN();
    });
});
