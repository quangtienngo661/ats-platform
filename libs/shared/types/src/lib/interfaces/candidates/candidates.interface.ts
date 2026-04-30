export interface ICandidate {
  currentTitle?: string;
  yearsOfExperience?: number;
  profileData?: Record<string, unknown>;
  cvCount?: number | 0;
  applicationCount?: number | 0;
}

export interface ICandidateSkill {
  skillId: string;
  source?: 'cv_parsed' | 'manual';
}
