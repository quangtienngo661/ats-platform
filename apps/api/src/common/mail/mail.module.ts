import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BullModule } from '@nestjs/bullmq';
import { SendVerificationProcessor } from './processors/send-verification.processor';

@Module({
  imports: [],
  providers: [MailService, SendVerificationProcessor],
  exports: [MailService],
})
export class MailModule {}
