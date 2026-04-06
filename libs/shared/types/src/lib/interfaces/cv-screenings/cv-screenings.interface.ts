import { AiRecommendation, ScreeningStatus } from '../../enums';

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
}
