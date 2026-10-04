import { jobPostingFilters } from './job-posting-filters';

describe('jobPostingFilters (R4, R5)', () => {
  it('adds nothing when no salary or skill filter is given', () => {
    expect(jobPostingFilters({})).toEqual([]);
  });

  it('keeps a posting whose top pay reaches the lowest the candidate accepts', () => {
    // A posting with only one end counts as that single value, so its "top" is
    // salaryMax, or salaryMin when salaryMax is empty.
    expect(jobPostingFilters({ salaryMin: 12_000_000 })).toEqual([
      { OR: [{ salaryMax: { gte: 12_000_000 } }, { salaryMax: null, salaryMin: { gte: 12_000_000 } }] },
    ]);
  });

  it('keeps a posting whose bottom pay is within the most the candidate asks for', () => {
    expect(jobPostingFilters({ salaryMax: 9_000_000 })).toEqual([
      { OR: [{ salaryMin: { lte: 9_000_000 } }, { salaryMin: null, salaryMax: { lte: 9_000_000 } }] },
    ]);
  });

  it('requires both conditions for a range', () => {
    expect(jobPostingFilters({ salaryMin: 12_000_000, salaryMax: 16_000_000 })).toHaveLength(2);
  });

  it('treats a ceiling of 0 as a filter, not as "no filter"', () => {
    expect(jobPostingFilters({ salaryMax: 0 })).toEqual([
      { OR: [{ salaryMin: { lte: 0 } }, { salaryMin: null, salaryMax: { lte: 0 } }] },
    ]);
  });

  it('matches a posting that requires any of the chosen skills', () => {
    expect(jobPostingFilters({ skillIds: ['skill-a', 'skill-b'] })).toEqual([
      { jobPostingSkills: { some: { skillId: { in: ['skill-a', 'skill-b'] } } } },
    ]);
  });

  it('adds no skill condition for an empty list', () => {
    expect(jobPostingFilters({ skillIds: [] })).toEqual([]);
  });
});
