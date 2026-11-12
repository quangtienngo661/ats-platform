import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InterviewRemindersService } from './interview-reminders.service';
import {
  INTERVIEW_REMINDERS_QUEUE,
  isReminderKind,
  ReminderJobData,
} from './interview-reminders.rules';

@Processor(INTERVIEW_REMINDERS_QUEUE)
export class InterviewRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(InterviewRemindersProcessor.name);

  constructor(private readonly reminders: InterviewRemindersService) {
    super();
  }

  async process(job: Job<ReminderJobData, void, string>): Promise<void> {
    if (!isReminderKind(job.name)) return;

    try {
      await this.reminders.deliver(job.name, job.data);
    } catch (error) {
      this.logger.error(
        `The ${job.name} job ${job.id} of interview ${job.data.interviewId} failed: ${String(error)}`,
      );
      throw error;
    }
  }
}
