import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => {
  const createTransport = jest.fn(() => ({ sendMail: mockSendMail }));

  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  };
});

describe('MailService', () => {
  let service: MailService;
  let originalEnv: NodeJS.ProcessEnv;
  const mockCreateTransport = jest.mocked(nodemailer.createTransport);

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetAllMocks();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as nodemailer.Transporter);

    for (const key of [
      'SMTP_ENABLED',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_SECURE',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
    ]) {
      delete process.env[key];
    }

    service = new MailService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('isSmtpEnabled is true only for SMTP_ENABLED=true in any case', () => {
    for (const value of ['true', 'TRUE', 'True', 'tRuE']) {
      process.env.SMTP_ENABLED = value;
      expect(service.isSmtpEnabled()).toBe(true);
    }

    for (const value of [undefined, '', 'false', 'FALSE', '1', 'yes']) {
      if (value === undefined) {
        delete process.env.SMTP_ENABLED;
      } else {
        process.env.SMTP_ENABLED = value;
      }

      expect(service.isSmtpEnabled()).toBe(false);
    }
  });

  it('sendMail returns false and creates no transport when SMTP is disabled', async () => {
    process.env.SMTP_ENABLED = 'false';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const message = {
      to: 'candidate@ats.test',
      subject: 'Application received',
      html: '<p>Your application was received.</p>',
      text: 'Your application was received.',
    };

    await expect(service.sendMail(message)).resolves.toBe(false);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[SMTP disabled] Would send "Application received" to candidate@ats.test',
    );
    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sendMail sends to, subject, html and text from SMTP_FROM and returns true', async () => {
    process.env.SMTP_ENABLED = 'true';
    process.env.SMTP_HOST = 'smtp.ats.test';
    process.env.SMTP_PORT = '1025';
    process.env.SMTP_FROM = 'ATS Test <no-reply@ats.test>';
    mockSendMail.mockResolvedValue({ messageId: 'mail-1' });
    const message = {
      to: 'candidate@ats.test',
      subject: 'Application received',
      html: '<p>Your application was received.</p>',
      text: 'Your application was received.',
    };

    await expect(service.sendMail(message)).resolves.toBe(true);

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.ats.test',
      port: 1025,
      secure: false,
      auth: undefined,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'ATS Test <no-reply@ats.test>',
      to: 'candidate@ats.test',
      subject: 'Application received',
      html: '<p>Your application was received.</p>',
      text: 'Your application was received.',
    });
  });

  it('sendMail lets an SMTP error propagate', async () => {
    process.env.SMTP_ENABLED = 'true';
    process.env.SMTP_HOST = 'smtp.ats.test';
    process.env.SMTP_PORT = '1025';
    process.env.SMTP_FROM = 'ATS Test <no-reply@ats.test>';
    const error = new Error('SMTP connection failed');
    mockSendMail.mockRejectedValue(error);
    const message = {
      to: 'candidate@ats.test',
      subject: 'Interview invitation',
      html: '<p>Please attend your interview.</p>',
      text: 'Please attend your interview.',
    };

    await expect(service.sendMail(message)).rejects.toBe(error);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'ATS Test <no-reply@ats.test>',
      to: 'candidate@ats.test',
      subject: 'Interview invitation',
      html: '<p>Please attend your interview.</p>',
      text: 'Please attend your interview.',
    });
  });

  it('readTemplate reads a file from src/assets/mail', () => {
    expect(service.readTemplate('verification-email.html')).toContain(
      '{{verifyLink}}',
    );
  });

  it('readTemplate throws for a missing template', () => {
    expect(() => service.readTemplate('missing-template.html')).toThrow(/ENOENT/);
  });
});
