import { describe, expect, it } from 'vitest';
import { interviewRoomPath, isBuiltInRoomLink } from './meeting-link';
import { roomTiming, roomWindow } from './interview-room-window';

const START = '2026-11-20T02:00:00.000Z';
const scheduled = { startAt: START, durationMinutes: 60, status: 'scheduled' as const };

describe('roomWindow', () => {
  it('opens 15 minutes before the start and closes 30 minutes after the end, like the API', () => {
    expect(roomWindow(START, 60)).toEqual({
      opensAt: new Date('2026-11-20T01:45:00.000Z'),
      closesAt: new Date('2026-11-20T03:30:00.000Z'),
    });
  });
});

describe('roomTiming', () => {
  it.each([
    ['2026-11-20T01:44:59.000Z', 'not_yet'],
    ['2026-11-20T01:45:00.000Z', 'open'],
    ['2026-11-20T03:30:00.000Z', 'open'],
    ['2026-11-20T03:30:01.000Z', 'closed'],
  ])('at %s the room is %s', (now, expected) => {
    expect(roomTiming(scheduled, new Date(now))).toBe(expected);
  });

  it.each(['cancelled', 'completed'] as const)('a %s interview has a closed room even inside the window', (status) => {
    expect(roomTiming({ ...scheduled, status }, new Date('2026-11-20T02:00:00.000Z'))).toBe('closed');
  });
});

describe('built-in room links', () => {
  it('names the room page of one interview', () => {
    expect(interviewRoomPath('int-1')).toBe('/interview-room/int-1');
  });

  it.each([
    ['http://localhost:3001/interview-room/int-1', true],
    ['https://ats.example.com/interview-room/int-1', true],
    ['https://ats.example.com/interview-room/int-2', false],
    ['https://meet.google.com/abc-defg-hij', false],
    ['', false],
    [null, false],
  ])('%p is the built-in room of int-1: %s', (link, expected) => {
    expect(isBuiltInRoomLink(link, 'int-1')).toBe(expected);
  });
});
