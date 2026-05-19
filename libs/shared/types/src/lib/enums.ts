// ============================================================
// User enums
// ============================================================

export const UserRole = {
  candidate: 'candidate',
  recruiter: 'recruiter',
  admin: 'admin',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  active: 'active',
  inactive: 'inactive',
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// ============================================================
// Job enums
// ============================================================

export const JobStatus = {
  draft: 'draft',
  active: 'active',
  closed: 'closed',
} as const;
export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export const LocationType = {
  remote: 'remote',
  onsite: 'onsite',
  hybrid: 'hybrid',
} as const;
export type LocationType = typeof LocationType[keyof typeof LocationType];

// ============================================================
// Application enums
// ============================================================

export const ApplicationStatus = {
  applied: 'applied',
  screening: 'screening',
  interview: 'interview',
  offer: 'offer',
  hired: 'hired',
  rejected: 'rejected',
  cancelled: 'cancelled',
} as const;
export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

// ============================================================
// CV / Parsing enums
// ============================================================

export const ParsingStatus = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
} as const;
export type ParsingStatus = typeof ParsingStatus[keyof typeof ParsingStatus];

export const ScreeningStatus = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
} as const;
export type ScreeningStatus = typeof ScreeningStatus[keyof typeof ScreeningStatus];

// ============================================================
// AI enums
// ============================================================

export const AiRecommendation = {
  hire: 'hire',
  interview: 'interview',
  reject: 'reject',
} as const;
export type AiRecommendation = typeof AiRecommendation[keyof typeof AiRecommendation];

export const AiActionType = {
  cv_parsing: 'cv_parsing',
  cv_scoring: 'cv_scoring',
  mock_interview: 'mock_interview',
  job_parsing: 'job_parsing',
} as const;
export type AiActionType = typeof AiActionType[keyof typeof AiActionType];

export const AiLogStatus = {
  success: 'success',
  failed: 'failed',
} as const;
export type AiLogStatus = typeof AiLogStatus[keyof typeof AiLogStatus];

// ============================================================
// Interview enums
// ============================================================

export const InterviewStatus = {
  in_progress: 'in_progress',
  completed: 'completed',
  abandon: 'abandon',
  pending_result: 'pending_result',
} as const;
export type InterviewStatus = typeof InterviewStatus[keyof typeof InterviewStatus];

export const InterviewType = {
  online: 'online',
  onsite: 'onsite',
} as const;
export type InterviewType = typeof InterviewType[keyof typeof InterviewType];

export const ScheduleStatus = {
  scheduled: 'scheduled',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;
export type ScheduleStatus = typeof ScheduleStatus[keyof typeof ScheduleStatus];

export const DifficultyLevel = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
} as const;
export type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];

// ============================================================
// Notification enums
// ============================================================

export const NotificationType = {
  application: 'application',
  interview: 'interview',
  system: 'system',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const RelatedEntityType = {
  application: 'application',
  interview: 'interview',
  job: 'job',
} as const;
export type RelatedEntityType = typeof RelatedEntityType[keyof typeof RelatedEntityType];

// ============================================================
// Backward compatibility aliases for old code
// ============================================================

export { UserRole as Role };
export { JobStatus as JobPostingStatus };
export { ParsingStatus as CVParsingStatus };
export { InterviewStatus as InterviewSessionStatus };
