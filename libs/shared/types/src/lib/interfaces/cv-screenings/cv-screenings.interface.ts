import { AiRecommendation, ScreeningStatus } from "@ats-platform/database";

export interface ICVScreening {
  screeningId: string;
  applicationId: string;
  cvId: string;
  configId: string;
  status: ScreeningStatus;
  overallScore?: number;
  aiRecommendation?: AiRecommendation;
  aiReasoning?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  errorLog?: string;
  screenedAt?: string;
  skillsScore?: number;
  experienceScore?: number;
  educationScore?: number;
  // Human review (GĐ3 part 3b). Sent to staff only; effectiveScreeningScores picks which set to show.
  reviewedAt?: string | null;
  reviewedOverallScore?: number | null;
  reviewedSkillsScore?: number | null;
  reviewedExperienceScore?: number | null;
  reviewedEducationScore?: number | null;
  reviewNote?: string | null;
}
