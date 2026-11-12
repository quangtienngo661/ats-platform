import { BadRequestException } from '@nestjs/common';
import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import {
  ROOM_CLOSED_MESSAGE,
  ROOM_NOT_ONLINE_MESSAGE,
  SCHEDULE_CANCELLED_MESSAGE,
  assertCanJoinNow,
  joinWindow,
  roomName,
} from './interview-room.rules';

// 09:00 Vietnam time on 20/11/2026 = 02:00 UTC.
const START = new Date('2026-11-20T02:00:00.000Z');
const schedule = (overrides: Partial<Parameters<typeof assertCanJoinNow>[0]> = {}) => ({
  interviewType: InterviewType.online,
  status: ScheduleStatus.scheduled,
  startAt: START,
  durationMinutes: 60,
  ...overrides,
});
const at = (iso: string) => new Date(iso);

const messageOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).message;
  }
  throw new Error('expected a BadRequestException');
};

describe('joinWindow', () => {
  it('opens 15 minutes before the start and closes 30 minutes after the end', () => {
    expect(joinWindow(START, 60)).toEqual({
      opensAt: at('2026-11-20T01:45:00.000Z'),
      closesAt: at('2026-11-20T03:30:00.000Z'),
    });
  });

  it('follows the duration', () => {
    expect(joinWindow(START, 15).closesAt).toEqual(at('2026-11-20T02:45:00.000Z'));
  });
});

describe('assertCanJoinNow', () => {
  it.each([
    ['exactly when the room opens', '2026-11-20T01:45:00.000Z'],
    ['during the interview', '2026-11-20T02:30:00.000Z'],
    ['exactly when the room closes', '2026-11-20T03:30:00.000Z'],
  ])('lets you in %s', (_label, now) => {
    expect(assertCanJoinNow(schedule(), at(now))).toEqual({
      opensAt: at('2026-11-20T01:45:00.000Z'),
      closesAt: at('2026-11-20T03:30:00.000Z'),
    });
  });

  it('one second before the room opens says when it opens, in Vietnam time', () => {
    expect(messageOf(() => assertCanJoinNow(schedule(), at('2026-11-20T01:44:59.000Z')))).toBe(
      'Phòng phỏng vấn mở lúc 08:45 ngày 20/11/2026',
    );
  });

  it('one second after the room closes says it is over', () => {
    expect(messageOf(() => assertCanJoinNow(schedule(), at('2026-11-20T03:30:01.000Z')))).toBe(
      ROOM_CLOSED_MESSAGE,
    );
  });

  it('refuses an onsite interview even inside the window', () => {
    expect(
      messageOf(() =>
        assertCanJoinNow(schedule({ interviewType: InterviewType.onsite }), at('2026-11-20T02:00:00.000Z')),
      ),
    ).toBe(ROOM_NOT_ONLINE_MESSAGE);
  });

  it('refuses a cancelled interview', () => {
    expect(
      messageOf(() =>
        assertCanJoinNow(schedule({ status: ScheduleStatus.cancelled }), at('2026-11-20T02:00:00.000Z')),
      ),
    ).toBe(SCHEDULE_CANCELLED_MESSAGE);
  });

  it('refuses a completed interview as over', () => {
    expect(
      messageOf(() =>
        assertCanJoinNow(schedule({ status: ScheduleStatus.completed }), at('2026-11-20T02:00:00.000Z')),
      ),
    ).toBe(ROOM_CLOSED_MESSAGE);
  });
});

describe('roomName', () => {
  it('is one room per interview', () => {
    expect(roomName('abc-123')).toBe('interview-abc-123');
  });
});
