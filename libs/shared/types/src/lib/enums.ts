// User enums
export enum Role {
  CANDIDATE = 'candidate',
  HR = 'hr',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Notification enums
export enum NotificationType {
  APPLICATION = 'application',
  INTERVIEW = 'interview',
  SYSTEM = 'system',
}

// Application enums
export enum ApplicationStatus {
  APPLIED = 'applied',
  SCREENING = 'screening',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

// Job Posting enums
export enum JobPostingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

// Interview Schedule enums
export enum InterviewType {
  ONLINE = 'online',
  ONSITE = 'onsite',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

// CV enums
export enum CVParsingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Interview Sesson enums
export enum InterviewSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  TIMEOUT = 'timeout',
}