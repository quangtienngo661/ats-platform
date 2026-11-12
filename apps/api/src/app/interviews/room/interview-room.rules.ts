import { BadRequestException } from '@nestjs/common';
import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import {
  formatVietnamDate,
  formatVietnamTime,
} from '../../candidate-notifications/email/format';

/** The room opens this long before the scheduled start… */
export const ROOM_OPENS_BEFORE_MINUTES = 15;
/** …and stays open this long after the scheduled end, for an interview that overruns. */
export const ROOM_CLOSES_AFTER_MINUTES = 30;

export const ROOM_NOT_ONLINE_MESSAGE =
  'Buổi phỏng vấn này diễn ra trực tiếp, không có phòng trực tuyến';
export const SCHEDULE_CANCELLED_MESSAGE = 'Lịch phỏng vấn đã bị huỷ';
export const ROOM_CLOSED_MESSAGE = 'Buổi phỏng vấn đã kết thúc';

const MINUTE = 60_000;

export interface JoinableSchedule {
  interviewType: InterviewType;
  status: ScheduleStatus;
  startAt: Date;
  durationMinutes: number;
}

export interface JoinWindow {
  opensAt: Date;
  closesAt: Date;
}

export function joinWindow(startAt: Date, durationMinutes: number): JoinWindow {
  const start = startAt.getTime();
  return {
    opensAt: new Date(start - ROOM_OPENS_BEFORE_MINUTES * MINUTE),
    closesAt: new Date(start + (durationMinutes + ROOM_CLOSES_AFTER_MINUTES) * MINUTE),
  };
}

/** LiveKit room for one interview. One schedule, one room. */
export function roomName(interviewId: string): string {
  return `interview-${interviewId}`;
}

/**
 * The web page of the built-in room, stored as `onlineMeetingLink` of an online interview
 * that has no external link, so the email, the cards and the drawer show it unchanged.
 * Read at call time: CLIENT_URL is required by the env validation.
 */
export function interviewRoomUrl(interviewId: string): string {
  const origin = (process.env.CLIENT_URL ?? '').replace(/\/+$/, '');
  return `${origin}/interview-room/${interviewId}`;
}

/**
 * Whether the room can be entered at `now`. Both ends of the window are inclusive.
 * Only the API decides this; the web hides its button from the same data but never
 * trusts its own clock (spec E1).
 */
export function assertCanJoinNow(schedule: JoinableSchedule, now: Date): JoinWindow {
  if (schedule.interviewType !== InterviewType.online) {
    throw new BadRequestException(ROOM_NOT_ONLINE_MESSAGE);
  }
  if (schedule.status === ScheduleStatus.cancelled) {
    throw new BadRequestException(SCHEDULE_CANCELLED_MESSAGE);
  }
  if (schedule.status === ScheduleStatus.completed) {
    throw new BadRequestException(ROOM_CLOSED_MESSAGE);
  }

  const window = joinWindow(schedule.startAt, schedule.durationMinutes);
  if (now.getTime() < window.opensAt.getTime()) {
    throw new BadRequestException(
      `Phòng phỏng vấn mở lúc ${formatVietnamTime(window.opensAt)} ngày ${formatVietnamDate(window.opensAt)}`,
    );
  }
  if (now.getTime() > window.closesAt.getTime()) {
    throw new BadRequestException(ROOM_CLOSED_MESSAGE);
  }
  return window;
}
