import { applicationIncludeOptions } from '../../common/utils/include-options.util';
import { toCandidateScreening } from './candidate-screening';

const screening = {
  screeningId: 'screen-1',
  status: 'completed',
  overallScore: '70.0',
  skillsScore: '80.0',
  experienceScore: '60.0',
  educationScore: '50.0',
  aiRecommendation: 'interview',
  aiReasoning: 'Phù hợp',
  matchedSkills: { hardSkills: ['NestJS'] },
  missingSkills: ['Docker'],
};
const reviewedFields = {
  reviewedAt: new Date('2026-10-30T08:00:00.000Z'),
  reviewedOverallScore: '77.0',
  reviewedSkillsScore: '90.0',
  reviewedExperienceScore: '65.0',
  reviewedEducationScore: '55.0',
};

describe('toCandidateScreening', () => {
  it('passes null and undefined through (an application not screened yet)', () => {
    expect(toCandidateScreening(null)).toBeNull();
    expect(toCandidateScreening(undefined)).toBeUndefined();
  });

  it('keeps the AI scores of an unreviewed screening and strips every review field, even stale ones', () => {
    const result = toCandidateScreening({
      ...screening,
      reviewedAt: null,
      reviewedOverallScore: '99.0',
      reviewedSkillsScore: '99.0',
      reviewedExperienceScore: '99.0',
      reviewedEducationScore: '99.0',
    });

    expect(result).toEqual(screening);
  });

  it('shows the reviewed scores in the usual score fields, keeps the rest, and exposes no review field (R11)', () => {
    const result = toCandidateScreening({ ...screening, ...reviewedFields });

    expect(result).toEqual({
      ...screening,
      overallScore: '77.0',
      skillsScore: '90.0',
      experienceScore: '65.0',
      educationScore: '55.0',
    });
    expect(Object.keys(result as object)).not.toEqual(
      expect.arrayContaining(['reviewedAt']),
    );
    for (const key of [
      'reviewedAt',
      'reviewedById',
      'reviewNote',
      'reviewedOverallScore',
      'reviewedSkillsScore',
      'reviewedExperienceScore',
      'reviewedEducationScore',
    ]) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it('the AI recommendation is untouched by a review (ADR 0002)', () => {
    const result = toCandidateScreening({ ...screening, ...reviewedFields });

    expect(result?.aiRecommendation).toBe('interview');
  });
});

describe('applicationIncludeOptions.screening (staff payload)', () => {
  it('carries the reviewed scores and reviewedAt, but never the note or the reviewer', () => {
    const select = applicationIncludeOptions.screening.select as Record<
      string,
      boolean
    >;

    // Control: a field that has always been selected is found by the same lookup.
    expect(select.overallScore).toBe(true);
    for (const key of [
      'reviewedAt',
      'reviewedOverallScore',
      'reviewedSkillsScore',
      'reviewedExperienceScore',
      'reviewedEducationScore',
    ]) {
      expect(select[key]).toBe(true);
    }
    expect(select).not.toHaveProperty('reviewNote');
    expect(select).not.toHaveProperty('reviewedById');
  });
});
