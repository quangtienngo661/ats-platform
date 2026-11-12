// Browser -> real Next actions -> Nest -> isolated PostgreSQL, and both browsers -> the real LiveKit server of
// docker-compose.test.yml. Chromium's fake camera and microphone stand in for devices. No interception.
// GĐ4 C7: the recruiter and the candidate enter the built-in room of one online interview and see each other.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
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

test.describe('GĐ4 — phòng phỏng vấn trực tuyến', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd4RoomFixtures>>;
  let recruiterContext: BrowserContext;
  let candidateContext: BrowserContext;
  let outsiderContext: BrowserContext;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    if (!baseURL) throw new Error('The Playwright config must supply a local baseURL');
    await waitForAuthWindow();
    fixture = await createGd4RoomFixtures(apiBaseUrl(), baseURL);
    const media = { baseURL, permissions: ['camera', 'microphone'] };
    recruiterContext = await browser.newContext(media);
    candidateContext = await browser.newContext(media);
    outsiderContext = await browser.newContext(media);
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

  test('C7: recruiter và ứng viên vào cùng phòng và thấy nhau', async ({ baseURL }) => {
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
    const login = await candidateContext.request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.candidate.email, password: fixture.password },
    });
    expect(login.status()).toBe(201);
    const token = (await login.json()).data.accessToken;
    await candidateContext.addCookies([{ name: 'accessToken', value: token, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
    await candidate.goto('/my-interviews');
    await candidate.getByRole('link', { name: 'Vào phòng phỏng vấn' }).click();
    await expect(candidate).toHaveURL(new RegExp(`/interview-room/${fixture.interviewId}$`));
    await candidate.getByRole('button', { name: 'Vào phòng', exact: true }).click();

    // Each side now sees the other: the participant tiles carry LiveKit's display names.
    await expect(candidate.getByText(fixture.recruiter.name).first()).toBeVisible({ timeout: 30_000 });
    await expect(recruiter.getByText(fixture.candidate.name).first()).toBeVisible({ timeout: 30_000 });
  });

  test('R2: ứng viên không thuộc buổi phỏng vấn bị từ chối, không có token', async ({ baseURL }) => {
    const outsider = await outsiderContext.newPage();
    const login = await outsiderContext.request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.outsider.email, password: fixture.password },
    });
    expect(login.status()).toBe(201);
    const token = (await login.json()).data.accessToken;
    await outsiderContext.addCookies([{ name: 'accessToken', value: token, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);

    await outsider.goto(`/interview-room/${fixture.interviewId}`);

    await expect(outsider.getByRole('heading', { name: 'Không vào được phòng phỏng vấn' })).toBeVisible();
    await expect(outsider.getByText('Bạn không tham gia buổi phỏng vấn này')).toBeVisible();
    await expect(outsider.getByRole('button', { name: 'Vào phòng', exact: true })).toHaveCount(0);
  });
});
