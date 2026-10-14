// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mayVisit } from './role-policy';

describe('mayVisit', () => {
  it('a candidate is blocked from /jobs/:id/compare', () => {
    expect(mayVisit('candidate', '/jobs/j/compare')).toBe(false);
    expect(mayVisit('recruiter', '/jobs/j/compare')).toBe(true);
  });
});
