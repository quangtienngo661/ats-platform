/**
 * A score as it arrives from Prisma (Decimal), from JSON (string) or from code (number).
 * Anything with a numeric `toString()` is accepted so Prisma's Decimal needs no import here.
 */
export type ScreeningScoreValue =
  | number
  | string
  | { toString(): string }
  | null
  | undefined;

export interface ScreeningScoreFields {
  overallScore?: ScreeningScoreValue;
  skillsScore?: ScreeningScoreValue;
  experienceScore?: ScreeningScoreValue;
  educationScore?: ScreeningScoreValue;
  reviewedAt?: Date | string | null;
  reviewedOverallScore?: ScreeningScoreValue;
  reviewedSkillsScore?: ScreeningScoreValue;
  reviewedExperienceScore?: ScreeningScoreValue;
  reviewedEducationScore?: ScreeningScoreValue;
}

export interface EffectiveScreeningScores {
  overall: number | null;
  skills: number | null;
  experience: number | null;
  education: number | null;
  isReviewed: boolean;
}

function toScore(value: ScreeningScoreValue): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The scores to show: the reviewer's when the screening has been reviewed
 * (`reviewedAt` set), otherwise the AI's. `reviewedAt` is the only switch, so
 * stale reviewed columns never leak through on an unreviewed screening.
 */
export function effectiveScreeningScores(
  screening: ScreeningScoreFields,
): EffectiveScreeningScores {
  const isReviewed =
    screening.reviewedAt !== null && screening.reviewedAt !== undefined;

  return isReviewed
    ? {
        overall: toScore(screening.reviewedOverallScore),
        skills: toScore(screening.reviewedSkillsScore),
        experience: toScore(screening.reviewedExperienceScore),
        education: toScore(screening.reviewedEducationScore),
        isReviewed,
      }
    : {
        overall: toScore(screening.overallScore),
        skills: toScore(screening.skillsScore),
        experience: toScore(screening.experienceScore),
        education: toScore(screening.educationScore),
        isReviewed,
      };
}
