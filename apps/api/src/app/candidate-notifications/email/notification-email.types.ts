import type { InterviewType } from '@ats-platform/database';

export interface ApplicationContext {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
  appliedAt: string;
}

export interface ScheduleDetails {
  interviewId: string;
  startAt: string;
  durationMinutes: number;
  interviewType: InterviewType;
  onlineMeetingLink: string | null;
  location: string | null;
  interviewerName: string;
}

export interface CancelledScheduleLine {
  startAt: string;
  durationMinutes: number;
  interviewType: InterviewType;
}

export interface NotificationEmailPayload {
  context: ApplicationContext;
  schedule?: ScheduleDetails;
  previous?: Partial<ScheduleDetails>;
  cancelledSchedules?: CancelledScheduleLine[];
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
