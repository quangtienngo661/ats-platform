/**
 * When the built-in interview room can be entered. Display only: the API decides with its
 * own clock and refuses outside these bounds (GĐ4 R3); these numbers mirror it.
 */
export const ROOM_OPENS_BEFORE_MINUTES = 15;
export const ROOM_CLOSES_AFTER_MINUTES = 30;

const MINUTE = 60_000;

export type RoomTiming = 'not_yet' | 'open' | 'closed';

export function roomWindow(startAt: string | Date, durationMinutes: number) {
    const start = new Date(startAt).getTime();
    return {
        opensAt: new Date(start - ROOM_OPENS_BEFORE_MINUTES * MINUTE),
        closesAt: new Date(start + (durationMinutes + ROOM_CLOSES_AFTER_MINUTES) * MINUTE),
    };
}

export function roomTiming(
    schedule: { startAt: string | Date; durationMinutes: number; status: string },
    now: Date,
): RoomTiming {
    if (schedule.status !== 'scheduled') return 'closed';
    const { opensAt, closesAt } = roomWindow(schedule.startAt, schedule.durationMinutes);
    if (now.getTime() < opensAt.getTime()) return 'not_yet';
    if (now.getTime() > closesAt.getTime()) return 'closed';
    return 'open';
}
