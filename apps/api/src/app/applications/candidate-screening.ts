/**
 * What a candidate gets to see of their own screening (GĐ3 part 3b, R11).
 *
 * Staff payloads carry the reviewer's scores next to the AI's. A candidate sees one set:
 * the reviewed scores when a reviewer has confirmed or corrected them, the AI's
 * otherwise — in the same score fields as before, so nothing new appears in the
 * response. Every review field is stripped. The note and the reviewer never reach
 * this function at all (the staff select does not read them), and stay that way.
 */
export function toCandidateScreening<
  T extends {
    overallScore?: unknown;
    skillsScore?: unknown;
    experienceScore?: unknown;
    educationScore?: unknown;
    reviewedAt?: unknown;
    reviewedOverallScore?: unknown;
    reviewedSkillsScore?: unknown;
    reviewedExperienceScore?: unknown;
    reviewedEducationScore?: unknown;
  },
>(screening: T | null | undefined) {
  if (!screening) return screening as null | undefined;

  const {
    reviewedAt,
    reviewedOverallScore,
    reviewedSkillsScore,
    reviewedExperienceScore,
    reviewedEducationScore,
    ...visible
  } = screening;

  return reviewedAt
    ? {
        ...visible,
        overallScore: reviewedOverallScore,
        skillsScore: reviewedSkillsScore,
        experienceScore: reviewedExperienceScore,
        educationScore: reviewedEducationScore,
      }
    : visible;
}
