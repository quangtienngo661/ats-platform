import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailNotificationStatus } from '@ats-platform/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { CLIENT_URL } from '../../common/constants/urls';
import { NOTIFICATION_EMAIL_QUEUE } from './notification-email.constants';
import type { NotificationEmailJobData } from './notification-email.constants';
import { renderNotificationEmail } from './email/render-notification-email';
import type { NotificationEmailPayload } from './email/notification-email.types';

@Processor(NOTIFICATION_EMAIL_QUEUE, { concurrency: 5 })
export class NotificationEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationEmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<NotificationEmailJobData, void, string>): Promise<void> {
    const { notificationId } = job.data;

    try {
      const row = await this.prisma.emailNotification.findUnique({
        where: { id: notificationId },
      });

      if (!row) {
        this.logger.log(`Email notification ${notificationId} no longer exists`);
        return;
      }
      if (
        row.status === EmailNotificationStatus.sent ||
        row.status === EmailNotificationStatus.skipped
      ) {
        return;
      }

      const layout = this.mailService.readTemplate('notification-layout.html');
      const rendered = renderNotificationEmail(
        row.type,
        row.payload as unknown as NotificationEmailPayload,
        { clientUrl: CLIENT_URL, layout },
      );
      const delivered = await this.mailService.sendMail({
        to: row.recipientEmail,
        ...rendered,
      });

      await this.prisma.emailNotification.updateMany({
        where: { id: notificationId },
        data: delivered
          ? {
              status: EmailNotificationStatus.sent,
              sentAt: new Date(),
              lastError: null,
            }
          : { status: EmailNotificationStatus.skipped },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      this.logger.error(
        `Email notification ${notificationId} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      try {
        await this.prisma.emailNotification.updateMany({
          where: { id: notificationId },
          data: {
            lastError: message.slice(0, 500),
            ...(isFinalAttempt ? { status: EmailNotificationStatus.failed } : {}),
          },
        });
      } catch (writeError) {
        this.logger.warn(
          `Failed to record email notification ${notificationId} error: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
        );
      }

      throw error;
    }
  }
}
