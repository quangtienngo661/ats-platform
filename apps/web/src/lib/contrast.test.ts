import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('matches the WCAG ratio for ink on white', () => {
    expect(contrastRatio('#171717', '#ffffff')).toBeCloseTo(17.93, 2);
  });

  it('matches the WCAG ratio for grey 888 on white', () => {
    expect(contrastRatio('#888888', '#ffffff')).toBeCloseTo(3.54, 2);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#ffffff', '#171717')).toBeCloseTo(
      contrastRatio('#171717', '#ffffff'),
      10,
    );
  });
});
