// @vitest-environment node
// localDateTimeToIso runs in the recruiter's browser; the runtime timezone stands in
// for the browser's here (Vietnam, UTC+7, no daylight saving).
import { afterAll, describe, expect, it } from 'vitest';
import { isAbsoluteIso, localDateTimeToIso } from './interview-time';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';

afterAll(() => {
  process.env.TZ = originalTz;
});

describe('localDateTimeToIso', () => {
  it('converts a Vietnam wall-clock time to its UTC instant', () => {
    expect(localDateTimeToIso('2026-10-05', '09:00')).toBe('2026-10-05T02:00:00.000Z');
  });

  it.each([
    ['an impossible date', '2026-13-40', '09:00'],
    ['an empty date', '', '09:00'],
    ['an empty time', '2026-10-05', ''],
  ])('returns null for %s', (_label, date, time) => {
    expect(localDateTimeToIso(date, time)).toBeNull();
  });
});

describe('isAbsoluteIso', () => {
  it.each([
    ['2026-10-05T02:00:00.000Z', true],
    ['2026-10-05T09:00:00+07:00', true],
    ['2026-10-05T09:00:00', false],
    ['abc', false],
  ])('%s → %s', (value, expected) => {
    expect(isAbsoluteIso(value)).toBe(expected);
  });
});
