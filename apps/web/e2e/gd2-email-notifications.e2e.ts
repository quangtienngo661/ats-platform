// C14: real API requests, PostgreSQL rows and messages from this test stack's Mailpit.
// No browser is needed for the candidate notification journey.
import { setTimeout as delay } from 'node:timers/promises';
import { expect, test } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import { cleanupGd2EmailFixtures, createGd2EmailFixtures, emailRowsOf } from './support/gd2-email-fixtures.mjs';
import { readMessage, waitForMessagesTo } from './support/mailpit.mjs';

test.describe('GĐ2 SP3 — email thông báo cho ứng viên', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd2EmailFixtures>>;
  let recruiterToken: string;
  let candidateToken: string;
  let applicationId: string;
  let interviewId: string;
  let startAt: Date;
  let vietnamDate: string;

  async function emailWithSubject(subject: string, count: number) {
    const messages = await waitForMessagesTo(fixture.candidate.email, count);
    const summary = messages.find((message: { Subject: string }) => message.Subject === subject);
    expect(summary, `Mailpit must contain ${subject}`).toBeTruthy();
    const message = await readMessage(summary.ID);
    expect(message.Subject).toBe(subject);
    expect(message.To.map((recipient: { Address: string }) => recipient.Address)).toEqual([fixture.candidate.email]);
    return message;
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    await waitForAuthWindow();
    fixture = await createGd2EmailFixtures(apiBaseUrl());
    const recruiterLogin = await request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.recruiter.email, password: fixture.password },
    });
    expect(recruiterLogin.status()).toBe(201);
    recruiterToken = (await recruiterLogin.json()).data.accessToken;
    const candidateLogin = await request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.candidate.email, password: fixture.password },
    });
    expect(candidateLogin.status()).toBe(201);
    candidateToken = (await candidateLogin.json()).data.accessToken;

    startAt = new Date();
    startAt.setUTCDate(startAt.getUTCDate() + 3);
    startAt.setUTCHours(2, 30, 0, 0);
    vietnamDate = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(startAt);
  });

  test.afterAll(async () => {
    if (fixture) {
      expect(await cleanupGd2EmailFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
    }
  });

  test('nộp đơn gửi email xác nhận tới đúng địa chỉ ứng viên', async ({ request }) => {
    const response = await request.post(`${apiBaseUrl()}/applications`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { jobId: fixture.job.id, cvId: fixture.candidate.cvId },
    });
    expect(response.status()).toBe(201);
    applicationId = (await response.json()).data.applicationId;
    expect(applicationId).toBeTruthy();

    const message = await emailWithSubject(`Đã nhận đơn ứng tuyển: ${fixture.job.title}`, 1);
    expect(message.HTML).toContain('&lt;b&gt;');
    expect(message.HTML).toContain('&amp; co');
    expect(message.HTML).not.toContain(`<b>${fixture.runId.slice(0, 8)}</b>`);
    expect(message.Text).toContain('<b>');
    expect(message.Text).toContain(fixture.job.title);
  });

  test('sang screening không gửi, sang interview gửi email mời phỏng vấn', async ({ request }) => {
    const screening = await request.patch(`${apiBaseUrl()}/applications/${applicationId}/status`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { status: 'screening' },
    });
    expect(screening.status()).toBe(200);
    await expect.poll(() => emailRowsOf(applicationId)).toEqual([{ type: 'application_received', status: 'sent' }]);
    expect(await waitForMessagesTo(fixture.candidate.email, 1)).toHaveLength(1);

    const interview = await request.patch(`${apiBaseUrl()}/applications/${applicationId}/status`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { status: 'interview' },
    });
    expect(interview.status()).toBe(200);
    const message = await emailWithSubject(`Bạn được mời vào vòng phỏng vấn: ${fixture.job.title}`, 2);
    expect(message.Text).toContain('đã được chuyển sang vòng phỏng vấn');
  });

  test('tạo lịch online gửi email có giờ Việt Nam và có thông báo in-app', async ({ request }) => {
    const response = await request.post(`${apiBaseUrl()}/interviews/schedules`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: {
        applicationId, interviewerId: fixture.recruiter.userId, interviewType: 'online',
        startAt: startAt.toISOString(), durationMinutes: 60,
        onlineMeetingLink: `https://meet.example.com/gd2-email-${fixture.runId}`,
      },
    });
    expect(response.status()).toBe(201);
    interviewId = (await response.json()).data.interviewId;
    expect(interviewId).toBeTruthy();

    const message = await emailWithSubject(`Lịch phỏng vấn: ${fixture.job.title}`, 3);
    for (const body of [message.HTML, message.Text]) {
      expect(body).toContain('09:30–10:30');
      expect(body).toContain(vietnamDate);
      expect(body).toContain(`https://meet.example.com/gd2-email-${fixture.runId}`);
    }
    const notifications = await request.get(`${apiBaseUrl()}/notifications`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    expect(notifications.status()).toBe(200);
    expect((await notifications.json()).data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Bạn có lịch phỏng vấn mới', relatedEntityId: interviewId }),
    ]));
  });

  test('đổi giờ gửi email kèm giờ cũ', async ({ request }) => {
    const updatedStartAt = new Date(startAt);
    updatedStartAt.setUTCHours(3, 30, 0, 0);
    const response = await request.patch(`${apiBaseUrl()}/interviews/schedules/${interviewId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { startAt: updatedStartAt.toISOString() },
    });
    expect(response.status()).toBe(200);
    const message = await emailWithSubject(`Lịch phỏng vấn đã thay đổi: ${fixture.job.title}`, 4);
    for (const body of [message.HTML, message.Text]) {
      expect(body).toContain('10:30–11:30');
      expect(body).toContain(vietnamDate);
      expect(body).toContain('Trước đây:');
      expect(body.slice(body.indexOf('Trước đây:'))).toContain('Thời gian: 09:30–10:30');
    }
  });

  test('từ chối gửi một email trung tính liệt kê lịch bị hủy, không lộ lý do', async ({ request }) => {
    const response = await request.patch(`${apiBaseUrl()}/applications/${applicationId}/status`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { status: 'rejected', rejectionReason: 'Thiếu NestJS' },
    });
    expect(response.status()).toBe(200);
    const message = await emailWithSubject(`Kết quả đơn ứng tuyển: ${fixture.job.title}`, 5);
    for (const body of [message.HTML, message.Text]) {
      expect(body).toContain('Buổi phỏng vấn lúc 10:30–11:30');
      expect(body).toContain('đã được hủy');
      expect(body).not.toContain('Thiếu NestJS');
    }
  });

  test('tổng cộng đúng 5 email, không có email hủy riêng, mọi row đã sent', async () => {
    expect(await waitForMessagesTo(fixture.candidate.email, 5)).toHaveLength(5);
    await delay(3_000);
    const messages = await waitForMessagesTo(fixture.candidate.email, 5);
    expect(messages).toHaveLength(5);
    for (const message of messages) {
      expect(message.Subject.startsWith('Lịch phỏng vấn đã bị hủy')).toBe(false);
    }
    await expect.poll(() => emailRowsOf(applicationId)).toEqual([
      { type: 'application_received', status: 'sent' },
      { type: 'application_interview', status: 'sent' },
      { type: 'schedule_created', status: 'sent' },
      { type: 'schedule_updated', status: 'sent' },
      { type: 'application_rejected', status: 'sent' },
    ]);
  });
});
