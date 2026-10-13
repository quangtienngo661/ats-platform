// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';
import { groupCandidateSchedules } from './group-schedules';
import { candidateSchedule } from '@/test/fixtures/candidate-schedule';

const NOW = new Date('2026-10-05T03:00:00.000Z');
const ids = (items: ICandidateInterviewSchedule[]) => items.map((item) => item.interviewId);

describe('groupCandidateSchedules (R10)', () => {
  it('keeps an interview that is still running in the upcoming group (E8)', () => {
    const running = candidateSchedule({ interviewId: 'running', startAt: '2026-10-05T02:30:00.000Z' });
    expect(ids(groupCandidateSchedules([running], NOW).upcoming)).toEqual(['running']);
  });

  it('moves an interview that ends exactly now to the past group', () => {
    const endsNow = candidateSchedule({ interviewId: 'ends-now', startAt: '2026-10-05T02:00:00.000Z' });
    const { upcoming, past } = groupCandidateSchedules([endsNow], NOW);
    expect(ids(upcoming)).toEqual([]);
    expect(ids(past)).toEqual(['ends-now']);
  });

  it('moves a scheduled interview from yesterday to the past group (E9)', () => {
    const yesterday = candidateSchedule({ interviewId: 'yesterday', startAt: '2026-10-04T02:00:00.000Z' });
    expect(ids(groupCandidateSchedules([yesterday], NOW).past)).toEqual(['yesterday']);
  });

  it('puts a cancelled interview in the past group even when its time is tomorrow', () => {
    const cancelled = candidateSchedule({
      interviewId: 'cancelled',
      startAt: '2026-10-06T02:00:00.000Z',
      status: 'cancelled',
    });
    const { upcoming, past } = groupCandidateSchedules([cancelled], NOW);
    expect(ids(upcoming)).toEqual([]);
    expect(ids(past)).toEqual(['cancelled']);
  });

  it('puts a completed interview in the past group', () => {
    const completed = candidateSchedule({
      interviewId: 'completed',
      startAt: '2026-10-05T02:45:00.000Z',
      status: 'completed',
    });
    expect(ids(groupCandidateSchedules([completed], NOW).past)).toEqual(['completed']);
  });

  it('lists an interview returned by both requests only once', () => {
    const tomorrow = candidateSchedule({ interviewId: 'tomorrow', startAt: '2026-10-06T02:00:00.000Z' });
    const { upcoming, past } = groupCandidateSchedules([tomorrow, { ...tomorrow }], NOW);
    expect(ids(upcoming)).toEqual(['tomorrow']);
    expect(ids(past)).toEqual([]);
  });

  it('sorts upcoming soonest first and past latest first', () => {
    const items = [
      candidateSchedule({ interviewId: 'in-two-days', startAt: '2026-10-07T02:00:00.000Z' }),
      candidateSchedule({ interviewId: 'last-week', startAt: '2026-09-28T02:00:00.000Z' }),
      candidateSchedule({ interviewId: 'tomorrow', startAt: '2026-10-06T02:00:00.000Z' }),
      candidateSchedule({ interviewId: 'yesterday', startAt: '2026-10-04T02:00:00.000Z' }),
    ];
    const { upcoming, past } = groupCandidateSchedules(items, NOW);
    expect(ids(upcoming)).toEqual(['tomorrow', 'in-two-days']);
    expect(ids(past)).toEqual(['yesterday', 'last-week']);
  });

  it('keeps all three upcoming interviews beside twenty past ones (C19)', () => {
    const upcomingInput = [1, 2, 3].map((day) =>
      candidateSchedule({ interviewId: `next-${day}`, startAt: `2026-10-0${5 + day}T02:00:00.000Z` }),
    );
    const historyInput = Array.from({ length: 20 }, (_, index) =>
      candidateSchedule({
        interviewId: `past-${index}`,
        startAt: new Date(Date.UTC(2026, 8, 30 - index, 2)).toISOString(),
      }),
    );
    const { upcoming, past } = groupCandidateSchedules([...upcomingInput, ...historyInput], NOW);
    expect(ids(upcoming)).toEqual(['next-1', 'next-2', 'next-3']);
    expect(past).toHaveLength(20);
  });
});
