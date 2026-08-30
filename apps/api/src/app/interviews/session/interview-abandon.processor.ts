import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InterviewSessionService } from './interview-session.service';

export const SWEEP_STALE_SESSIONS_JOB = 'sweep_stale_sessions';

/**
 * Periodically closes out interview sessions nobody is working on any more.
 *
 * Scheduled as a repeatable job (see `InterviewsModule`) rather than hung off a
 * socket `disconnect`, because the case that actually strands a session is the one
 * a disconnect handler can never see: a candidate who calls `startSession` and
 * closes the tab before a socket is ever established. Without this, such sessions
 * sat `in_progress`/`generating` forever and `InterviewStatus.abandon` was
 * effectively unreachable.
 */
@Processor('interview-maintenance')
export class InterviewAbandonProcessor extends WorkerHost {
  private readonly logger = new Logger(InterviewAbandonProcessor.name);

  constructor(
    private readonly interviewSessionService: InterviewSessionService,
  ) {
    super();
  }

  async process(job: Job<void, void, string>): Promise<void> {
    if (job.name !== SWEEP_STALE_SESSIONS_JOB) return;

    const abandoned = await this.interviewSessionService.sweepStaleSessions();

    if (abandoned.length > 0) {
      this.logger.log(
        `Swept ${abandoned.length} stale interview session(s): ${abandoned.join(', ')}`,
      );
    }
  }
}
