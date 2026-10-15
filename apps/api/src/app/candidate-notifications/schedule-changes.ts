import type { InterviewType, ScheduleStatus } from '@ats-platform/database';

export interface ScheduleSnapshot {
  interviewId: string;
  applicationId: string;
  interviewerId: string;
  interviewType: InterviewType;
  startAt: Date;
  durationMinutes: number;
  onlineMeetingLink: string | null;
  location: string | null;
  status: ScheduleStatus;
}

export type CancelledScheduleSummary = Pick<
  ScheduleSnapshot,
  'interviewId' | 'startAt' | 'durationMinutes' | 'interviewType'
>;

export function toScheduleSnapshot(row: ScheduleSnapshot): ScheduleSnapshot {
  return {
    interviewId: row.interviewId,
    applicationId: row.applicationId,
    interviewerId: row.interviewerId,
    interviewType: row.interviewType,
    startAt: row.startAt,
    durationMinutes: row.durationMinutes,
    onlineMeetingLink: row.onlineMeetingLink,
    location: row.location,
    status: row.status,
  };
}

export type ScheduleField =
  | 'startAt'
  | 'durationMinutes'
  | 'interviewType'
  | 'onlineMeetingLink'
  | 'location'
  | 'interviewerId';

const SCHEDULE_FIELDS: ScheduleField[] = [
  'startAt',
  'durationMinutes',
  'interviewType',
  'onlineMeetingLink',
  'location',
  'interviewerId',
];

export function changedScheduleFields(
  before: ScheduleSnapshot,
  after: ScheduleSnapshot,
): ScheduleField[] {
  return SCHEDULE_FIELDS.filter((field) => {
    if (field === 'startAt') {
      return before.startAt.getTime() !== after.startAt.getTime();
    }

    return (before[field] ?? null) !== (after[field] ?? null);
  });
}
