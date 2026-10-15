import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';
import { CandidateNotificationsService } from './candidate-notifications.service';
import { NOTIFICATION_EMAIL_QUEUE } from './notification-email.constants';
import { NotificationEmailProcessor } from './notification-email.processor';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MailModule,
    BullModule.registerQueue({ name: NOTIFICATION_EMAIL_QUEUE }),
  ],
  providers: [CandidateNotificationsService, NotificationEmailProcessor],
  exports: [CandidateNotificationsService],
})
export class CandidateNotificationsModule implements OnModuleInit {
  constructor(
    @InjectQueue(NOTIFICATION_EMAIL_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.setGlobalRateLimit(30, 60000);
  }
}
