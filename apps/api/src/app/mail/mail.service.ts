import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  private get isEnabled() {
    return (process.env.SMTP_ENABLED ?? '').toLowerCase() === 'true';
  }

  private get fromAddress() {
    return (
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'no-reply@localhost'
    );
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
      throw new Error('SMTP_HOST is required when SMTP_ENABLED=true');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  async sendVerificationEmail(to: string, verifyLink: string) {
    const subject = 'Verify your email';
    const text = `Please verify your email by opening this link: ${verifyLink}`;

    if (!this.isEnabled) {
      this.logger.log(`[SMTP disabled] Would send verify email to ${to}: ${verifyLink}`);
      return;
    }

    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
    });
  }
}
