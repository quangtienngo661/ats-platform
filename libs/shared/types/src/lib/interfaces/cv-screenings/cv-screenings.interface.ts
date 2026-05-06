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
}
