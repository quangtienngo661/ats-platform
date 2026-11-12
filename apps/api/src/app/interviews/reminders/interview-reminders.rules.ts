import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { joinWindow } from '../room/interview-room.rules';

export const INTERVIEW_REMINDERS_QUEUE = 'interview-reminders';

/** `reminder`: the day before. `room-open`: when the online room opens (GĐ4 R29). */
export const REMINDER_KINDS = ['reminder', 'room-open'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_BEFORE_HOURS = 24;

export interface ReminderJobData {
  interviewId: string;
  /** The start time the job was planned for; a job for an older time is skipped. */
  startAt: string;
}

export interface ReminderPlan {
  kind: ReminderKind;
  delayMs: number;
  jobId: string;
}

export interface PlannableSchedule {
  interviewId: string;
  startAt: Date;
  durationMinutes: number;
  interviewType: InterviewType;
  status: ScheduleStatus;
}

export function isReminderKind(name: string): name is ReminderKind {
  return (REMINDER_KINDS as readonly string[]).includes(name);
}

/**
 * The jobs to queue for a schedule as it now stands. A late day-before reminder is
 * dropped; a room opening announced late still goes out while the room is open. Job ids
 * carry the start time, so planning the same schedule twice adds nothing while its jobs
 * wait, and a moved interview gets fresh ones (BullMQ refuses ids with ':').
 */
export function planReminders(schedule: PlannableSchedule, now: Date): ReminderPlan[] {
  if (schedule.status !== ScheduleStatus.scheduled) return [];

  const start = schedule.startAt.getTime();
  const jobId = (kind: ReminderKind) => `${kind}-${schedule.interviewId}-${start}`;
  const plans: ReminderPlan[] = [];

  const reminderAt = start - REMINDER_BEFORE_HOURS * 60 * 60 * 1000;
  if (reminderAt >= now.getTime()) {
    plans.push({ kind: 'reminder', delayMs: reminderAt - now.getTime(), jobId: jobId('reminder') });
  }

  if (schedule.interviewType === InterviewType.online) {
    const { opensAt, closesAt } = joinWindow(schedule.startAt, schedule.durationMinutes);
    if (now.getTime() < closesAt.getTime()) {
      plans.push({
        kind: 'room-open',
        delayMs: Math.max(0, opensAt.getTime() - now.getTime()),
        jobId: jobId('room-open'),
      });
    }
  }

  return plans;
}
