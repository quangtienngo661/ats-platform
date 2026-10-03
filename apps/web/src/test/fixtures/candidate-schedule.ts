import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';

/** A candidate-side schedule as the API returns it: 60-minute online interview, still scheduled. */
export function candidateSchedule(
  overrides: Partial<ICandidateInterviewSchedule> = {},
): ICandidateInterviewSchedule {
  return {
    interviewId: 'interview-1',
    startAt: '2026-10-06T02:00:00.000Z',
    durationMinutes: 60,
    interviewType: 'online',
    onlineMeetingLink: 'https://meet.example.com/abc-defg-hij',
    location: null,
    status: 'scheduled',
    interviewer: { fullName: 'Trần Thị B' },
    application: {
      applicationId: 'app-1',
      jobPosting: { jobId: 'job-1', title: 'Backend Engineer', organization: { name: 'Công ty Alpha' } },
    },
    ...overrides,
  };
}
