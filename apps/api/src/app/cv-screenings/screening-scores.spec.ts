import { effectiveScreeningScores } from '@ats-platform/types';

describe('effectiveScreeningScores', () => {
  const aiScores = {
    overallScore: 70,
    skillsScore: 80,
    experienceScore: 60,
    educationScore: 50,
  };
  const reviewedScores = {
    reviewedOverallScore: 77,
    reviewedSkillsScore: 90,
    reviewedExperienceScore: 65,
    reviewedEducationScore: 55,
  };

  it('returns AI scores when not reviewed', () => {
    expect(
      effectiveScreeningScores({ ...aiScores, reviewedAt: null }),
    ).toEqual({
      overall: 70,
      skills: 80,
      experience: 60,
      education: 50,
      isReviewed: false,
    });
  });

  it('reviewedAt is the switch: stale reviewed columns are ignored while it is null', () => {
    expect(
      effectiveScreeningScores({
        ...aiScores,
        ...reviewedScores,
        reviewedAt: null,
      }),
    ).toEqual({
      overall: 70,
      skills: 80,
      experience: 60,
      education: 50,
      isReviewed: false,
    });
  });

  it('returns reviewed scores and isReviewed true when reviewedAt is set', () => {
    const reviewedAt = new Date('2026-10-30T08:00:00.000Z');

    expect(
      effectiveScreeningScores({ ...aiScores, ...reviewedScores, reviewedAt }),
    ).toEqual({
      overall: 77,
      skills: 90,
      experience: 65,
      education: 55,
      isReviewed: true,
    });
  });

  it('treats an ISO string reviewedAt (as sent over JSON) as reviewed', () => {
    const result = effectiveScreeningScores({
      ...aiScores,
      ...reviewedScores,
      reviewedAt: '2026-10-30T08:00:00.000Z',
    });

    expect(result.isReviewed).toBe(true);
    expect(result.overall).toBe(77);
  });

  it('parses decimal strings ("72.5" → 72.5)', () => {
    expect(
      effectiveScreeningScores({
        overallScore: '72.5',
        skillsScore: '80.0',
        experienceScore: '60.5',
        educationScore: '0',
        reviewedAt: null,
      }),
    ).toEqual({
      overall: 72.5,
      skills: 80,
      experience: 60.5,
      education: 0,
      isReviewed: false,
    });
  });

  it('parses Decimal-like objects through toString', () => {
    const decimal = (value: string) => ({ toString: () => value });

    const result = effectiveScreeningScores({
      reviewedAt: new Date(),
      reviewedOverallScore: decimal('61.5'),
      reviewedSkillsScore: decimal('70.0'),
      reviewedExperienceScore: decimal('50.0'),
      reviewedEducationScore: decimal('40.0'),
    });

    expect(result.overall).toBe(61.5);
    expect(result.skills).toBe(70);
  });

  it('all null → all null, isReviewed false', () => {
    expect(effectiveScreeningScores({})).toEqual({
      overall: null,
      skills: null,
      experience: null,
      education: null,
      isReviewed: false,
    });
  });

  it('a value that is not a number becomes null instead of NaN', () => {
    const result = effectiveScreeningScores({
      overallScore: 'abc',
      skillsScore: 80,
    });

    expect(result.overall).toBeNull();
    expect(result.skills).toBe(80);
  });
});
