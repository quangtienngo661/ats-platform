import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';

export interface GroupedCandidateSchedules {
    upcoming: ICandidateInterviewSchedule[];
    past: ICandidateInterviewSchedule[];
}

export function scheduleEndsAt(schedule: ICandidateInterviewSchedule): number {
    return new Date(schedule.startAt).getTime() + schedule.durationMinutes * 60_000;
}

/**
 * R10: "Sắp tới" is a scheduled interview that has not ended yet (a running one included),
 * soonest first; everything else — ended, completed, cancelled — is past, latest first.
 * The page merges two requests, so an interview may arrive twice; it is listed once.
 */
export function groupCandidateSchedules(
    items: ICandidateInterviewSchedule[],
    now: Date,
): GroupedCandidateSchedules {
    const unique = [...new Map(items.map((item) => [item.interviewId, item])).values()];
    const byStart = (a: ICandidateInterviewSchedule, b: ICandidateInterviewSchedule) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    const isUpcoming = (item: ICandidateInterviewSchedule) =>
        item.status === 'scheduled' && scheduleEndsAt(item) > now.getTime();

    return {
        upcoming: unique.filter(isUpcoming).sort(byStart),
        past: unique.filter((item) => !isUpcoming(item)).sort((a, b) => byStart(b, a)),
    };
}
