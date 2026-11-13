import { describe, expect, it } from 'vitest';
import { duration, ease, exitDuration, spring, staggerDelay } from './motion';

describe('motion presets', () => {
    it('pins durations, easings and spring', () => {
        expect(duration).toEqual({ press: 0.12, hover: 0.2, base: 0.28, slow: 0.42 });
        expect(ease).toEqual({ out: [0.16, 1, 0.3, 1], in: [0.5, 0, 0.75, 0] });
        expect(spring.snappy).toEqual({ type: 'spring', stiffness: 500, damping: 40 });
    });

    it('staggerDelay steps by 0.04 and caps at 8', () => {
        expect(staggerDelay(0)).toBe(0);
        expect(staggerDelay(3)).toBeCloseTo(0.12, 10);
        expect(staggerDelay(7)).toBeCloseTo(0.28, 10);
        expect(staggerDelay(8)).toBeNull();
        expect(staggerDelay(100)).toBeNull();
        expect(staggerDelay(-1)).toBeNull();
        expect(staggerDelay(2, 0.1, 3)).toBeCloseTo(0.2, 10);
        expect(staggerDelay(3, 0.1, 3)).toBeNull();
    });

    it('staggerDelay clamps a negative or NaN step to 0', () => {
        expect(staggerDelay(3, -0.1)).toBe(0);
        expect(staggerDelay(3, Number.NaN)).toBe(0);
        expect(staggerDelay(0, -0.1)).toBe(0);
    });

    it('exitDuration is 70% of enter', () => {
        expect(exitDuration(0.28)).toBeCloseTo(0.196, 10);
    });
});
