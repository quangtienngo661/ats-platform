import {
  EmailNotificationStatus,
  EmailNotificationType,
} from '@ats-platform/database';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';
import { NotificationEmailProcessor } from './notification-email.processor';

jest.mock('../../common/constants/urls', () => ({
  CLIENT_URL: 'http://localhost:3001',
}));

describe('NotificationEmailProcessor', () => {
  let processor: NotificationEmailProcessor;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailService: { sendMail: jest.Mock; readTemplate: jest.Mock };
  let row: ReturnType<typeof buildRow>;

  const layout = '<h1>{{title}}</h1><main>{{content}}</main>';
  const subject = 'Đã nhận đơn ứng tuyển: Kỹ sư Backend NestJS & API';

  const buildJob = (attemptsMade: number, attempts = 3) =>
    ({
      name: 'send-notification-email',
      data: { notificationId: 'row-1' },
      opts: { attempts },
      attemptsMade,
    }) as any;

  const buildRow = () => ({
    id: 'row-1',
    organizationId: 'org-1',
    recipientUserId: 'candidate-1',
    recipientEmail: 'minh.anh.snapshot@example.com',
    applicationId: 'app-1',
    interviewId: null,
    type: EmailNotificationType.application_received,
    status: EmailNotificationStatus.pending,
    payload: {
      context: {
        applicationId: 'app-1',
        candidateName: 'Nguyễn Minh Anh',
        jobTitle: 'Kỹ sư Backend NestJS & API',
        organizationName: 'Công ty Công nghệ Sao Việt',
        appliedAt: '2026-10-13T20:00:00.000Z',
      },
    },
    lastError: 'Previous SMTP timeout',
    createdAt: new Date('2026-10-13T20:00:00.000Z'),
    sentAt: null,
  });

  const expectRowLookup = () => {
    expect(prisma.emailNotification.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.findUnique).toHaveBeenCalledWith({
      where: { id: 'row-1' },
    });
  };

  const expectRenderedEmail = () => {
    expect(mailService.readTemplate).toHaveBeenCalledTimes(1);
    expect(mailService.readTemplate).toHaveBeenCalledWith(
      'notification-layout.html',
    );
    expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailService.sendMail).toHaveBeenCalledWith({
      to: row.recipientEmail,
      subject,
      html: expect.any(String),
      text: expect.any(String),
    });

    const message = mailService.sendMail.mock.calls[0][0];
    expect(message.html).toContain(
      '<h1>Đã nhận đơn ứng tuyển: Kỹ sư Backend NestJS &amp; API</h1>',
    );
    expect(message.html).toContain(
      'href="http://localhost:3001/my-applications/app-1"',
    );
    expect(message.text).toContain(
      'Chúng tôi đã nhận đơn ứng tuyển của bạn cho vị trí Kỹ sư Backend NestJS & API tại Công ty Công nghệ Sao Việt ngày 14/10/2026.',
    );
    expect(message.text).toContain(
      'Xem đơn ứng tuyển: http://localhost:3001/my-applications/app-1',
    );
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    row = buildRow();
    prisma.emailNotification.findUnique.mockResolvedValue(row);
    prisma.emailNotification.updateMany.mockResolvedValue({ count: 1 });
    mailService = {
      sendMail: jest.fn().mockResolvedValue(true),
      readTemplate: jest.fn().mockReturnValue(layout),
    };
    processor = new NotificationEmailProcessor(
      prisma as any,
      mailService as any,
    );
  });

  it('returns without sending when the row no longer exists', async () => {
    prisma.emailNotification.findUnique.mockResolvedValue(null);

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expect(mailService.readTemplate).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
    expect(prisma.emailNotification.updateMany).not.toHaveBeenCalled();
  });

  it('skips a row that is already sent', async () => {
    prisma.emailNotification.findUnique.mockResolvedValue({
      ...row,
      status: EmailNotificationStatus.sent,
      sentAt: new Date('2026-10-13T20:01:00.000Z'),
    });

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expect(mailService.readTemplate).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
    expect(prisma.emailNotification.updateMany).not.toHaveBeenCalled();
  });

  it('skips a row that is already skipped', async () => {
    prisma.emailNotification.findUnique.mockResolvedValue({
      ...row,
      status: EmailNotificationStatus.skipped,
    });

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expect(mailService.readTemplate).not.toHaveBeenCalled();
    expect(mailService.sendMail).not.toHaveBeenCalled();
    expect(prisma.emailNotification.updateMany).not.toHaveBeenCalled();
  });

  it('sends the rendered email to the snapshot address and marks it sent', async () => {
    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expectRenderedEmail();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: {
        status: 'sent',
        sentAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  it('marks the row skipped when SMTP is disabled', async () => {
    mailService.sendMail.mockResolvedValue(false);

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expectRenderedEmail();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { status: 'skipped' },
    });
  });

  it('records lastError and rethrows on a non-final failure without changing the status', async () => {
    const error = new Error('SMTP connection timed out');
    mailService.sendMail.mockRejectedValue(error);

    await expect(processor.process(buildJob(0, 3))).rejects.toBe(error);

    expectRowLookup();
    expectRenderedEmail();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { lastError: 'SMTP connection timed out' },
    });
    expect(
      prisma.emailNotification.updateMany.mock.calls[0][0].data,
    ).not.toHaveProperty('status');
  });

  it('marks the row failed and rethrows on the final attempt', async () => {
    const error = new Error('SMTP delivery failed');
    mailService.sendMail.mockRejectedValue(error);

    await expect(processor.process(buildJob(2, 3))).rejects.toBe(error);

    expectRowLookup();
    expectRenderedEmail();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { lastError: 'SMTP delivery failed', status: 'failed' },
    });

    // A failed status write must not hide the original delivery error.
    prisma.emailNotification.updateMany.mockRejectedValueOnce(
      new Error('Failure status could not be persisted'),
    );

    await expect(processor.process(buildJob(2, 3))).rejects.toBe(error);

    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.emailNotification.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'row-1' },
      data: { lastError: 'SMTP delivery failed', status: 'failed' },
    });
  });

  it('truncates lastError to 500 characters', async () => {
    const error = new Error(`${'a'.repeat(500)}truncated suffix`);
    mailService.sendMail.mockRejectedValue(error);

    await expect(processor.process(buildJob(0, 3))).rejects.toBe(error);

    expectRowLookup();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { lastError: 'a'.repeat(500) },
    });
    expect(
      prisma.emailNotification.updateMany.mock.calls[0][0].data.lastError,
    ).toHaveLength(500);
  });

  it('does not throw when the row disappears before it is marked', async () => {
    prisma.emailNotification.updateMany.mockResolvedValue({ count: 0 });

    await expect(processor.process(buildJob(0))).resolves.toBeUndefined();

    expectRowLookup();
    expectRenderedEmail();
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.emailNotification.updateMany).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: {
        status: 'sent',
        sentAt: expect.any(Date),
        lastError: null,
      },
    });
  });
});
