// Browser -> real Next actions -> Nest -> isolated PostgreSQL, and both browsers -> the real LiveKit server of
// docker-compose.test.yml. Chromium's fake camera and microphone stand in for devices. No interception.
// GĐ4 C7 + C24: the candidate waits until the recruiter lets them in, then both see each other in the built-in
// room. R29/R30: a schedule created inside the room window gets "Phòng phỏng vấn đã mở" through the real
// interview-reminders queue (Redis + processor), saved as in-app notifications.
import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import { cleanupGd4RoomFixtures, createGd4RoomFixtures } from './support/gd4-room-fixtures.mjs';

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera', 'microphone'],
});

async function signInRecruiter(page: Page, email: string, password: string) {
  await page.goto('/sign-in/admin');
  await page.getByRole('button', { name: 'Recruiter', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function apiToken(request: APIRequestContext, email: string, password: string) {
  const login = await request.post(`${apiBaseUrl()}/auth/login`, { data: { email, password } });
  expect(login.status()).toBe(201);
  return (await login.json()).data.accessToken as string;
}

async function notificationsOf(request: APIRequestContext, token: string) {
  const response = await request.get(`${apiBaseUrl()}/notifications?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).data.items as Array<{ title: string; message: string; relatedEntityId: string }>;
}

test.describe('GĐ4 — phòng phỏng vấn trực tuyến', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd4RoomFixtures>>;
  let recruiterContext: BrowserContext;
  let candidateContext: BrowserContext;
  let outsiderContext: BrowserContext;
  // One API sign-in per person for the whole file: /auth/login is rate limited.
  let recruiterToken: string;
  let candidateToken: string;
  let outsiderToken: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    if (!baseURL) throw new Error('The Playwright config must supply a local baseURL');
    await waitForAuthWindow();
    fixture = await createGd4RoomFixtures(apiBaseUrl(), baseURL);
    const media = { baseURL, permissions: ['camera', 'microphone'] };
    recruiterContext = await browser.newContext(media);
    candidateContext = await browser.newContext(media);
    outsiderContext = await browser.newContext(media);
    recruiterToken = await apiToken(recruiterContext.request, fixture.recruiter.email, fixture.password);
    candidateToken = await apiToken(candidateContext.request, fixture.candidate.email, fixture.password);
    outsiderToken = await apiToken(outsiderContext.request, fixture.outsider.email, fixture.password);
  });

  test.afterAll(async () => {
    try {
      if (fixture) {
        expect(await cleanupGd4RoomFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await recruiterContext?.close();
      await candidateContext?.close();
      await outsiderContext?.close();
    }
  });

  test('C7 + C24: ứng viên chờ, recruiter cho vào, hai bên thấy nhau', async ({ baseURL }) => {
    test.setTimeout(120_000);
    const recruiter = await recruiterContext.newPage();
    const candidate = await candidateContext.newPage();

    // The recruiter enters first.
    await signInRecruiter(recruiter, fixture.recruiter.email, fixture.password);
    await recruiter.goto(`/interview-room/${fixture.interviewId}`);
    await expect(recruiter.getByRole('heading', { name: 'Phòng phỏng vấn', exact: true })).toBeVisible();
    await recruiter.getByRole('button', { name: 'Vào phòng', exact: true }).click();
    // Control: alone in the room, the candidate's name is nowhere on the recruiter's screen.
    await expect(recruiter.getByText(fixture.recruiter.name).first()).toBeVisible({ timeout: 30_000 });
    await expect(recruiter.getByText(fixture.candidate.name)).toHaveCount(0);

    // The candidate finds the room from their own schedule list.
    await candidateContext.addCookies([
      { name: 'accessToken', value: candidateToken, url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
    await candidate.goto('/my-interviews');
    await candidate.getByRole('link', { name: 'Vào phòng phỏng vấn' }).click();
    await expect(candidate).toHaveURL(new RegExp(`/interview-room/${fixture.interviewId}$`));

    // Not let in yet: the candidate waits, with no device check and no token.
    await expect(candidate.getByRole('heading', { name: 'Đang chờ người phỏng vấn cho vào' })).toBeVisible();
    await expect(candidate.getByRole('button', { name: 'Vào phòng', exact: true })).toHaveCount(0);

    // The recruiter, already in the call, is told over Socket.IO and gets a saved notification.
    await expect(recruiter.getByText(`${fixture.candidate.name} đang chờ từ`)).toBeVisible({ timeout: 25_000 });
    const waitingNotice = (await notificationsOf(recruiterContext.request, recruiterToken)).filter(
      (item) => item.relatedEntityId === fixture.interviewId,
    );
    expect(waitingNotice.map((item) => item.title)).toEqual(['Ứng viên đang chờ']);
    // Control: the candidate is still outside the call.
    await expect(recruiter.getByText(fixture.candidate.name)).toHaveCount(1);

    await recruiter.getByRole('button', { name: 'Cho vào', exact: true }).click();
    await expect(recruiter.getByRole('button', { name: 'Cho vào', exact: true })).toHaveCount(0);

    // The candidate's page moves on by itself to the device check.
    await candidate.getByRole('button', { name: 'Vào phòng', exact: true }).click({ timeout: 25_000 });

    // Each side now sees the other: the participant tiles carry LiveKit's display names.
    await expect(candidate.getByText(fixture.recruiter.name).first()).toBeVisible({ timeout: 30_000 });
    await expect(recruiter.getByText(fixture.candidate.name).first()).toBeVisible({ timeout: 30_000 });
  });

  test('R29/R30: lịch online tạo trong khung giờ phòng → thông báo "Phòng phỏng vấn đã mở" qua queue', async ({
    request,
  }) => {
    test.setTimeout(90_000);
    const auth = { Authorization: `Bearer ${recruiterToken}` };

    // Free the interviewer's slot, then book a 30-minute online interview starting in 5 minutes: its room is
    // already open, so the room-open job runs at once; the day-before reminder is not planned (< 24 h).
    const cancel = await request.patch(`${apiBaseUrl()}/interviews/schedules/${fixture.interviewId}`, {
      headers: auth,
      data: { status: 'cancelled' },
    });
    expect(cancel.status()).toBe(200);
    const created = await request.post(`${apiBaseUrl()}/interviews/schedules`, {
      headers: auth,
      data: {
        applicationId: fixture.applicationId,
        interviewerId: fixture.recruiter.userId,
        interviewType: 'online',
        startAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        durationMinutes: 30,
      },
    });
    expect(created.status()).toBe(201);
    const interviewId = (await created.json()).data.interviewId as string;

    const roomOpen = async (token: string) =>
      (await notificationsOf(request, token)).filter(
        (item) =>
          item.relatedEntityId === interviewId &&
          ['Phòng phỏng vấn đã mở', 'Nhắc lịch phỏng vấn'].includes(item.title),
      );
    await expect.poll(async () => (await roomOpen(candidateToken)).map((item) => item.title), { timeout: 30_000 })
      .toEqual(['Phòng phỏng vấn đã mở']);
    const [candidateNotice] = await roomOpen(candidateToken);
    expect(candidateNotice.message).toContain(`Phòng phỏng vấn vị trí ${fixture.job.title} đã mở.`);
    // The recruiter interviews AND scheduled it: one notice, not two.
    expect((await roomOpen(recruiterToken)).map((item) => item.title)).toEqual(['Phòng phỏng vấn đã mở']);
  });

  test('R2: ứng viên không thuộc buổi phỏng vấn bị từ chối, không có token', async ({ baseURL }) => {
    const outsider = await outsiderContext.newPage();
    await outsiderContext.addCookies([
      { name: 'accessToken', value: outsiderToken, url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await outsider.goto(`/interview-room/${fixture.interviewId}`);

    await expect(outsider.getByRole('heading', { name: 'Không vào được phòng phỏng vấn' })).toBeVisible();
    await expect(outsider.getByText('Bạn không tham gia buổi phỏng vấn này')).toBeVisible();
    await expect(outsider.getByRole('button', { name: 'Vào phòng', exact: true })).toHaveCount(0);
  });
});
