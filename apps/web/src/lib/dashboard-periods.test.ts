import { describe, expect, it } from 'vitest';
import { dashboardPeriod } from './dashboard-periods';

describe('dashboardPeriod', () => {
  it.each([
    ['7', 7],
    ['30', 30],
    ['90', 90],
    [undefined, 30],
    ['', 30],
    ['14', 30],
    ['abc', 30],
  ])('%p → %i days', (value, days) => {
    expect(dashboardPeriod(value)).toBe(days);
  });
});
