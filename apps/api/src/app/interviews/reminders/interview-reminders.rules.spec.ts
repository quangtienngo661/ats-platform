import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { planReminders } from './interview-reminders.rules';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

// 09:00 Vietnam time; a 60-minute interview, so its room closes at 10:30 (03:30 UTC).
const START = new Date('2026-11-20T02:00:00.000Z');
const CLOSES = new Date('2026-11-20T03:30:00.000Z');

const schedule = (overrides: Record<string, unknown> = {}) => ({
  interviewId: 'int-1',
  startAt: START,
  durationMinutes: 60,
  interviewType: InterviewType.online,
  status: ScheduleStatus.scheduled,
  ...overrides,
});

const at = (ms: number) => new Date(START.getTime() + ms);

describe('planReminders (R29)', () => {
  it('plans the day-before reminder and the room opening of an online interview', () => {
    const now = at(-48 * HOUR);

    expect(planReminders(schedule(), now)).toEqual([
      { kind: 'reminder', delayMs: 24 * HOUR, jobId: `reminder-int-1-${START.getTime()}` },
      {
        kind: 'room-open',
        delayMs: 48 * HOUR - 15 * MINUTE,
        jobId: `room-open-int-1-${START.getTime()}`,
      },
    ]);
  });

  it.each([
    ['exactly 24 hours before', at(-24 * HOUR), [0]],
    ['1 ms later', at(-24 * HOUR + 1), []],
  ])('sends the reminder when created %s only if it is not late', (_label, now, delays) => {
    const reminders = planReminders(schedule(), now).filter((plan) => plan.kind === 'reminder');

    expect(reminders.map((plan) => plan.delayMs)).toEqual(delays);
  });

  it.each([
    ['before the room opens', at(-15 * MINUTE - 1), [1]],
    ['as the room opens', at(-15 * MINUTE), [0]],
    ['while the room is open', at(30 * MINUTE), [0]],
    ['1 ms before it closes', new Date(CLOSES.getTime() - 1), [0]],
    ['when it has closed', CLOSES, []],
  ])('announces the room opening %s', (_label, now, delays) => {
    const opening = planReminders(schedule(), now).filter((plan) => plan.kind === 'room-open');

    expect(opening.map((plan) => plan.delayMs)).toEqual(delays);
  });

  it('plans no room opening for an onsite interview', () => {
    expect(
      planReminders(schedule({ interviewType: InterviewType.onsite }), at(-48 * HOUR)).map(
        (plan) => plan.kind,
      ),
    ).toEqual(['reminder']);
  });

  it.each([ScheduleStatus.cancelled, ScheduleStatus.completed])(
    'plans nothing for a %s interview',
    (status) => {
      expect(planReminders(schedule({ status }), at(-48 * HOUR))).toEqual([]);
    },
  );

  it('names jobs after the start time, so a moved interview gets new jobs and BullMQ accepts the id', () => {
    const moved = new Date(START.getTime() + HOUR);
    const ids = planReminders(schedule({ startAt: moved }), at(-48 * HOUR)).map((plan) => plan.jobId);

    expect(ids).toEqual([`reminder-int-1-${moved.getTime()}`, `room-open-int-1-${moved.getTime()}`]);
    // BullMQ refuses custom ids that contain ':'.
    expect(ids.some((id) => id.includes(':'))).toBe(false);
  });
});
