import { describe, expect, it } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { mapApplicationToCandidate } from './kanban-mappers';

const buildApplication = (screening: unknown): IApplicationDto =>
  ({
    applicationId: 'app-1',
    appliedAt: '2026-10-28T00:00:00.000Z',
    candidate: { user: { fullName: 'Nguyễn Văn An' } },
    jobPosting: { title: 'Backend Developer', locationType: 'remote' },
    screening,
  }) as unknown as IApplicationDto;

const aiScreening = {
  status: 'completed',
  overallScore: '70.0',
  skillsScore: '80.0',
  experienceScore: '60.0',
  educationScore: '50.0',
};

describe('mapApplicationToCandidate — effective score', () => {
  it('uses the AI overall score and is not marked reviewed when nobody reviewed it', () => {
    const candidate = mapApplicationToCandidate(buildApplication(aiScreening), 'screening');

    expect(candidate.score).toBe(70);
    expect(candidate.reviewed).toBe(false);
    expect(candidate.rating).toBe(3);
  });

  it('uses the reviewed overall score and is marked reviewed once a reviewer confirmed it', () => {
    const candidate = mapApplicationToCandidate(
      buildApplication({
        ...aiScreening,
        reviewedAt: '2026-10-30T08:00:00.000Z',
        reviewedOverallScore: '92.5',
      }),
      'screening',
    );

    expect(candidate.score).toBe(92.5);
    expect(candidate.reviewed).toBe(true);
    // 92.5 is ≥ 90 → five stars; the AI's 70 would have given three.
    expect(candidate.rating).toBe(5);
  });

  it('ignores stale reviewed columns while reviewedAt is empty', () => {
    const candidate = mapApplicationToCandidate(
      buildApplication({ ...aiScreening, reviewedAt: null, reviewedOverallScore: '99.0' }),
      'screening',
    );

    expect(candidate.score).toBe(70);
    expect(candidate.reviewed).toBe(false);
  });

  it('shows 0 and not reviewed when there is no screening yet', () => {
    const candidate = mapApplicationToCandidate(buildApplication(undefined), 'applied');

    expect(candidate.score).toBe(0);
    expect(candidate.reviewed).toBe(false);
    expect(candidate.rating).toBe(0);
  });
});
