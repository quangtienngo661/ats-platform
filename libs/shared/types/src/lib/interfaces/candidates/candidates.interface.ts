export interface ICandidate {
  currentTitle?: string;
  yearsOfExperience?: number;
  profileData?: Record<string, unknown>;
}

export interface ICandidateSkill {
  skillId: string;
  source?: 'cv_parsed' | 'manual';
}
