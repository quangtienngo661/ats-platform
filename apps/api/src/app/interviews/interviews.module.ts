import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { InterviewSessionService } from './session/interview-session.service';
import { InterviewGateway } from './session/interview.gateway';
import { InterviewProcessor } from './session/interview.processor';
import { InterviewGenerationProcessor } from './session/interview-generation.processor';
import {
  InterviewAbandonProcessor,
  SWEEP_STALE_SESSIONS_JOB,
} from './session/interview-abandon.processor';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LlmModule } from '../../common/external-apis/llm/llm.module';
import { SocketIoModule } from '../../common/socket-io/socket-io.module';
import { CandidateNotificationsModule } from '../candidate-notifications/candidate-notifications.module';
import { EmbeddingModule } from '../../common/external-apis/embedding/embedding.module';
import { VectorModule } from '../../common/vector/vector.module';
import { InterviewQuestionsController } from './questions/interview-questions.controller';
import { InterviewQuestionsService } from './questions/interview-questions.service';

/** How often to look for interview sessions nobody is working on any more. */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    SocketIoModule,
    CandidateNotificationsModule,
    EmbeddingModule,
    VectorModule,
    // No `defaultJobOptions` here on purpose — it would replace, not extend, the
    // global defaults in app.module.ts (attempts/backoff/removeOnComplete).
    BullModule.registerQueue(
      { name: 'interview-evaluation' },
      { name: 'interview-generation' },
      { name: 'interview-maintenance' },
    ),
  ],
  controllers: [InterviewsController, InterviewQuestionsController],
  providers: [
    InterviewsService,
    InterviewQuestionsService,
    InterviewSessionService,
    InterviewGateway,
    InterviewProcessor,
    InterviewGenerationProcessor,
    InterviewAbandonProcessor,
  ],
  exports: [InterviewsService, InterviewSessionService],
})
export class InterviewsModule implements OnModuleInit {
  constructor(
    @InjectQueue('interview-maintenance')
    private readonly maintenanceQueue: Queue,
  ) {}

  async onModuleInit() {
    // Upsert (not add) so restarts don't pile up duplicate schedulers.
    await this.maintenanceQueue.upsertJobScheduler(
      'interview-stale-sweep',
      { every: SWEEP_INTERVAL_MS },
      { name: SWEEP_STALE_SESSIONS_JOB },
    );
  }
}
