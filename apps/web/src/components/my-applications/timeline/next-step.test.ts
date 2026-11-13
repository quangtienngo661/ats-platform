import { ApplicationStatus } from '@ats-platform/types';
import { describe, expect, it } from 'vitest';
import { isInProgress, nextStepLabel } from './next-step';

const NEXT: Record<string, string | null> = {
  applied: 'Đang sàng lọc',
  screening: 'Vòng phỏng vấn',
  interview: 'Nhận offer',
  offer: 'Được tuyển',
  hired: null,
  rejected: null,
  cancelled: null,
};

describe('nextStepLabel', () => {
  it.each(Object.values(ApplicationStatus))('pins the next step of %s', (status) => {
    expect(status in NEXT).toBe(true);
    expect(nextStepLabel(status)).toBe(NEXT[status]);
  });

  it('returns null for an unknown status', () => {
    expect(nextStepLabel('unknown')).toBeNull();
  });
});

describe('isInProgress', () => {
  it.each(Object.values(ApplicationStatus))('is true exactly while %s still has a next step', (status) => {
    expect(isInProgress(status)).toBe(NEXT[status] !== null);
  });

  it('is false for an unknown status', () => {
    expect(isInProgress('unknown')).toBe(false);
  });
});
