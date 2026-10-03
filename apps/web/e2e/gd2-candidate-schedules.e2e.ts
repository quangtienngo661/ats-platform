// GĐ2 week 1, slice 1: a recruiter books an online and an onsite interview in the browser
// (Vietnam time), the candidate sees both on /my-interviews without the recruiter's
// contact details, and rejecting the application cancels both.
// Browser → real Next actions → Nest → isolated PostgreSQL. No API interception.
// Run with TZ=UTC: the Next server then sits in a different timezone from the browser (C17).
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import { cleanupGd2Fixtures, createGd2ScheduleFixtures, schedulesOf } from './support/gd2-fixtures.mjs';

const BROWSER_TIMEZONE = 'Asia/Ho_Chi_Minh';
const ONSITE_ADDRESS = 'Tầng 5, 123 Lê Lợi, Q.1';

/** A Vietnam calendar date `days` after today, whatever the runner's timezone. */
function vietnamDate(days: number): string {
  const vietnamNow = new Date(Date.now() + 7 * 3_600_000);
  vietnamNow.setUTCDate(vietnamNow.getUTCDate() + days);
  return vietnamNow.toISOString().slice(0, 10);
}

async function cookieValue(context: BrowserContext, name: string) {
  const value = (await context.cookies()).find((cookie) => cookie.name === name)?.value;
  expect(value, `The browser must hold an API-issued ${name} cookie`).toBeTruthy();
  return value!;
}

async function bookInterview(page: Page, applicationId: string, interviewerId: string, date: string, time: string,
  place: { type: 'Trực tuyến'; link: string } | { type: 'Trực tiếp'; address: string }) {
  await page.getByRole('button', { name: 'Đặt phỏng vấn', exact: true }).click();
  await page.getByRole('combobox', { name: 'Ứng viên', exact: true }).selectOption(applicationId);
  await page.getByRole('combobox', { name: 'Người phỏng vấn', exact: true }).selectOption(interviewerId);
  await page.getByLabel('Ngày phỏng vấn', { exact: true }).fill(date);
  await page.getByLabel('Giờ phỏng vấn', { exact: true }).fill(time);
  await page.getByRole('radio', { name: place.type, exact: true }).check();
  if (place.type === 'Trực tuyến') {
    await page.getByLabel('Đường dẫn phòng họp', { exact: true }).fill(place.link);
  } else {
    await page.getByLabel('Địa điểm', { exact: true }).fill(place.address);
  }
  await page.getByRole('button', { name: 'Đặt lịch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đặt phỏng vấn', exact: true })).toBeHidden();
}

test.describe('GĐ2 tuần 1 — lịch phỏng vấn của ứng viên', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ timezoneId: BROWSER_TIMEZONE });

  let fixture: Awaited<ReturnType<typeof createGd2ScheduleFixtures>>;
  let recruiterContext: BrowserContext;
  let candidateContext: BrowserContext;
  let recruiterPage: Page;
  let candidatePage: Page;
  let candidateToken: string;
  let webUrl: string;
  const onlineDate = vietnamDate(2);
  const onsiteDate = vietnamDate(3);

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    // C17 means nothing unless the server and the browser disagree about the timezone.
    expect(new Date().getTimezoneOffset(), 'Run the E2E with TZ=UTC').toBe(0);
    webUrl = baseURL!;
    await waitForAuthWindow();
    fixture = await createGd2ScheduleFixtures(apiBaseUrl());
    recruiterContext = await browser.newContext({ baseURL, timezoneId: BROWSER_TIMEZONE });
    candidateContext = await browser.newContext({ baseURL, timezoneId: BROWSER_TIMEZONE });
    recruiterPage = await recruiterContext.newPage();
    candidatePage = await candidateContext.newPage();
  });

  test.afterAll(async () => {
    try {
      // Run-owned users only: their sessions go with the cascading user deletion.
      if (fixture) {
        expect(await cleanupGd2Fixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await recruiterContext?.close();
      await candidateContext?.close();
    }
  });

  test('C17: recruiter books an online interview at 09:00 Vietnam time and the API stores 02:00Z', async () => {
    await recruiterPage.goto('/sign-in/admin');
    await recruiterPage.getByRole('button', { name: 'Recruiter', exact: true }).click();
    await recruiterPage.getByRole('textbox', { name: 'Email', exact: true }).fill(fixture.recruiter.email);
    await recruiterPage.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
    await recruiterPage.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
    await expect(recruiterPage).toHaveURL(/\/dashboard$/);

    await recruiterPage.goto('/interviews');
    await bookInterview(recruiterPage, fixture.applicationId, fixture.recruiter.userId, onlineDate, '09:00', {
      type: 'Trực tuyến',
      link: `https://meet.example.com/gd2-${fixture.runId}`,
    });

    expect(await schedulesOf(fixture.applicationId)).toEqual([{
      startAt: `${onlineDate}T02:00:00.000Z`,
      interviewType: 'online',
      onlineMeetingLink: `https://meet.example.com/gd2-${fixture.runId}`,
      location: null,
      status: 'scheduled',
    }]);
  });

  test('R3: recruiter books an onsite interview at 14:00 with its address', async () => {
    await bookInterview(recruiterPage, fixture.applicationId, fixture.recruiter.userId, onsiteDate, '14:00', {
      type: 'Trực tiếp',
      address: ONSITE_ADDRESS,
    });

    expect((await schedulesOf(fixture.applicationId))[1]).toEqual({
      startAt: `${onsiteDate}T07:00:00.000Z`,
      interviewType: 'onsite',
      onlineMeetingLink: null,
      location: ONSITE_ADDRESS,
      status: 'scheduled',
    });
  });

  test('C5: the candidate sees both upcoming interviews in Vietnam time', async () => {
    const login = await candidateContext.request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.candidate.email, password: fixture.password },
    });
    expect(login.status()).toBe(201);
    candidateToken = (await login.json()).data.accessToken;
    await candidateContext.addCookies([{ name: 'accessToken', value: candidateToken, url: webUrl, httpOnly: true, sameSite: 'Lax' }]);

    await candidatePage.goto('/my-interviews');
    const upcoming = candidatePage.getByRole('region', { name: 'Sắp tới' });
    await expect(upcoming.getByRole('article')).toHaveCount(2);
    const [online, onsite] = [upcoming.getByRole('article').nth(0), upcoming.getByRole('article').nth(1)];
    await expect(online.getByText(fixture.job.title)).toBeVisible();
    await expect(online.getByText('09:00', { exact: true })).toBeVisible();
    await expect(online.getByRole('link', { name: 'Tham gia phòng họp' }))
      .toHaveAttribute('href', `https://meet.example.com/gd2-${fixture.runId}`);
    await expect(onsite.getByText('14:00', { exact: true })).toBeVisible();
    await expect(onsite.getByText(ONSITE_ADDRESS, { exact: true })).toBeVisible();
  });

  test('C1/C15: neither the page nor the API gives the candidate the recruiter\'s contact details', async () => {
    const html = await candidatePage.content();
    expect(html).toContain(fixture.recruiter.name);
    expect(html).not.toContain(fixture.recruiter.email);
    expect(html).not.toContain(fixture.recruiter.phone);

    const response = await candidateContext.request.get(`${apiBaseUrl()}/interviews/schedules/my`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(fixture.recruiter.name);
    expect(body).not.toContain(fixture.recruiter.email);
    expect(body).not.toContain(fixture.recruiter.phone);
    const items = JSON.parse(body).data.items as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    for (const item of items) expect(item).not.toHaveProperty('scheduler');
  });

  test('C16: rejecting the application cancels both interviews and the candidate sees them cancelled', async () => {
    const reject = await recruiterContext.request.patch(`${apiBaseUrl()}/applications/${fixture.applicationId}/status`, {
      headers: { Authorization: `Bearer ${await cookieValue(recruiterContext, 'accessToken')}` },
      data: { status: 'rejected' },
    });
    expect(reject.status()).toBe(200);

    await candidatePage.reload();
    const past = candidatePage.getByRole('region', { name: 'Đã qua & đã hủy' });
    await expect(past.getByRole('article')).toHaveCount(2);
    await expect(past.getByText('Đã hủy', { exact: true })).toHaveCount(2);
    await expect(candidatePage.getByRole('region', { name: 'Sắp tới' })).toHaveCount(0);
    await expect(candidatePage.getByRole('link', { name: 'Tham gia phòng họp' })).toHaveCount(0);
    expect((await schedulesOf(fixture.applicationId)).map((schedule: { status: string }) => schedule.status))
      .toEqual(['cancelled', 'cancelled']);
  });
});
