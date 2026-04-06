// ============================================================
// User enums
// ============================================================

export enum Role {
  CANDIDATE = 'candidate',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================================
// Job enums
// ============================================================

/** Khớp với Prisma enum JobStatus */
export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

/** @deprecated Dùng JobStatus thay thế */
export { JobStatus as JobPostingStatus }

export enum LocationType {
  REMOTE = 'remote',
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
}

// ============================================================
// Application enums
// ============================================================

export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// ============================================================
// CV / Parsing enums
// ============================================================

/** Khớp với Prisma enum ParsingStatus */
export enum ParsingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/** @deprecated Dùng ParsingStatus thay thế */
export { ParsingStatus as CVParsingStatus }

export enum ScreeningStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// ============================================================
// AI enums
// ============================================================

export enum AiRecommendation {
  HIRE = 'hire',
  INTERVIEW = 'interview',
  REJECT = 'reject',
}

// ============================================================
// Interview enums
// ============================================================

export enum InterviewType {
  ONLINE = 'online',
  ONSITE = 'onsite',
}

/** Khớp với Prisma enum InterviewStatus — dùng cho InterviewSession */
export enum InterviewStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  TIMEOUT = 'timeout',
}

/** @deprecated Dùng InterviewStatus thay thế */
export { InterviewStatus as InterviewSessionStatus }

/** Khớp với Prisma enum ScheduleStatus — dùng cho InterviewSchedule */
export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// ============================================================
// Notification enums
// ============================================================

export enum NotificationType {
  APPLICATION = 'application',
  INTERVIEW = 'interview',
  SYSTEM = 'system',
}

export enum RelatedEntityType {
  APPLICATION = 'application',
  INTERVIEW = 'interview',
  JOB = 'job',
}