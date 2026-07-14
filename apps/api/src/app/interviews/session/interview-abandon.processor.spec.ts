import {
  InterviewAbandonProcessor,
  SWEEP_STALE_SESSIONS_JOB,
} from './interview-abandon.processor';

describe('InterviewAbandonProcessor', () => {
  let processor: InterviewAbandonProcessor;
  let interviewSessionService: { sweepStaleSessions: jest.Mock };

  beforeEach(() => {
    interviewSessionService = { sweepStaleSessions: jest.fn() };
    processor = new InterviewAbandonProcessor(interviewSessionService as any);
  });

  it('runs the sweep for its own job name', async () => {
    interviewSessionService.sweepStaleSessions.mockResolvedValue(['session-1']);

    await processor.process({ name: SWEEP_STALE_SESSIONS_JOB } as any);

    expect(interviewSessionService.sweepStaleSessions).toHaveBeenCalledTimes(1);
  });

  it('ignores jobs it does not own', async () => {
    await processor.process({ name: 'something_else' } as any);

    expect(interviewSessionService.sweepStaleSessions).not.toHaveBeenCalled();
  });
});
