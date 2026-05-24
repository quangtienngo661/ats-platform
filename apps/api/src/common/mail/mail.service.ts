import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

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
      'no-reply@ats.vn'
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

  private getTemplatePath(fileName: string): string {
    // 1. Đường dẫn trong môi trường đã build production (dist/apps/api)
    const distPath = path.join(__dirname, 'assets', 'mail', fileName);
    if (fs.existsSync(distPath)) return distPath;

    // 2. Đường dẫn trong môi trường chạy dev từ source code (apps/api/src/common/mail)
    const srcPath = path.join(__dirname, '..', '..', 'assets', 'mail', fileName);
    if (fs.existsSync(srcPath)) return srcPath;

    // 3. Đường dẫn dự phòng tương đối với thư mục làm việc hiện tại (process.cwd())
    const workspacePath = path.join(process.cwd(), 'apps', 'api', 'src', 'assets', 'mail', fileName);
    if (fs.existsSync(workspacePath)) return workspacePath;

    // Mặc định trả về distPath để Nodemailer ném lỗi rõ ràng nếu không tìm thấy bất kỳ đâu
    return distPath;
  }

  async sendVerificationEmail(to: string, verifyLink: string) {
    const subject = 'Xác minh email của bạn';
    const text = `Vui lòng xác minh email bằng cách mở liên kết này: ${verifyLink}`;

    if (!this.isEnabled) {
      this.logger.log(`[SMTP disabled] Would send verify email to ${to}: ${verifyLink}`);
      return;
    }

    const transporter = this.getTransporter();

    let htmlContent = '';
    try {
      const templatePath = this.getTemplatePath('verification-email.html');
      htmlContent = fs.readFileSync(templatePath, 'utf8');
      htmlContent = htmlContent.replace(/{{verifyLink}}/g, verifyLink);
    } catch (err: any) {
      this.logger.error(`Could not read verification email template: ${err.message}`);
    }

    await transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
      html: htmlContent || undefined,
    });
  }

  async sendForgotPasswordEmail(to: string, resetLink: string) {
    const subject = 'Đặt lại mật khẩu của bạn';
    const text = `Vui lòng đặt lại mật khẩu bằng cách mở liên kết này: ${resetLink}`;

    if (!this.isEnabled) {
      this.logger.log(`[SMTP disabled] Would send forgot password email to ${to}: ${resetLink}`);
      return;
    }

    const transporter = this.getTransporter();

    let htmlContent = '';
    try {
      const templatePath = this.getTemplatePath('forgot-password-email.html');
      htmlContent = fs.readFileSync(templatePath, 'utf8');
      htmlContent = htmlContent.replace(/{{resetLink}}/g, resetLink);
    } catch (err: any) {
      this.logger.error(`Could not read forgot password email template: ${err.message}`);
    }

    await transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
      html: htmlContent || undefined,
    });
  }
}
