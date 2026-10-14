// Browser -> real Next actions -> Nest -> isolated PostgreSQL. No API interception.
// The existing Playwright config supplies WEB_E2E_BASE_URL, preflight and zero retries;
// apiBaseUrl() honors WEB_E2E_API_URL and enforces the dedicated local test API.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import {
  cleanupGd2EvaluationFixtures,
  createGd2EvaluationFixtures,
} from './support/gd2-fixtures.mjs';

const ratings = [
  { label: 'Kỹ năng chuyên môn', averageLabel: 'Kỹ năng chuyên môn (trung bình)', score: 4 },
  { label: 'Giải quyết vấn đề', averageLabel: 'Giải quyết vấn đề (trung bình)', score: 3 },
  { label: 'Giao tiếp', averageLabel: 'Giao tiếp (trung bình)', score: 5 },
  { label: 'Phù hợp văn hoá', averageLabel: 'Phù hợp văn hoá (trung bình)', score: 4 },
];

async function signInRecruiter(page: Page, email: string, password: string) {
  await page.goto('/sign-in/admin');
  await page.getByRole('button', { name: 'Recruiter', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function accessToken(context: BrowserContext): Promise<string> {
  const token = (await context.cookies()).find((cookie) => cookie.name === 'accessToken')?.value;
  expect(token, 'The browser must hold an API-issued accessToken cookie').toBeTruthy();
  if (!token) throw new Error('Missing accessToken cookie');
  return token;
}

/** Traverse every object and array in the JSON envelope, including nested relations. */
function payloadKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(payloadKeys);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) => [key, ...payloadKeys(nested)]);
  }
  return [];
}

test.describe('GĐ2 SP1 — đánh giá ứng viên', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd2EvaluationFixtures>>;
  let recruiterAContext: BrowserContext;
  let recruiterBContext: BrowserContext;
  let candidateContext: BrowserContext;
  let recruiterAPage: Page;
  let recruiterBPage: Page;
  let savedScorecardId: string;

  const detailPath = () => `/jobs/${fixture.job.id}/candidates/${fixture.applicationAId}`;
  const comment = () => `GĐ2 đánh giá của A ${fixture.runId}`;
  const note = () => `GĐ2 ghi chú của B ${fixture.runId}`;
  const expectedScorecard = () => ({
    interviewId: fixture.interviewId,
    technicalSkills: 4, problemSolving: 3, communication: 5, cultureFit: 4,
    recommendation: 'yes', comment: comment(),
    author: { userId: fixture.recruiterA.userId, fullName: fixture.recruiterA.name },
  });

  async function expectSavedScorecard(page: Page) {
    const interview = page.getByRole('region', { name: 'Nội dung đánh giá', exact: true }).getByRole('article');
    await expect(interview).toHaveCount(1);
    await expect(interview.getByText('Đã hoàn tất', { exact: true })).toBeVisible();
    await expect(interview).toContainText(`Người phỏng vấn: ${fixture.recruiterA.name}`);
    await expect(interview).toContainText(`Người đánh giá: ${fixture.recruiterA.name}`);
    await expect(interview.getByRole('definition')).toHaveText(ratings.map(({ score }) => `${score}/5`));
    await expect(interview.getByText('Nên tuyển', { exact: true })).toBeVisible();
    await expect(interview.getByText(comment(), { exact: true })).toBeVisible();
  }

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    if (!baseURL) throw new Error('The Playwright config must supply a local baseURL');
    await waitForAuthWindow();
    fixture = await createGd2EvaluationFixtures(apiBaseUrl());
    // Each identity has its own cookies and API request context.
    recruiterAContext = await browser.newContext({ baseURL });
    recruiterBContext = await browser.newContext({ baseURL });
    candidateContext = await browser.newContext({ baseURL });
    recruiterAPage = await recruiterAContext.newPage();
    recruiterBPage = await recruiterBContext.newPage();
  });

  test.afterAll(async () => {
    try {
      if (fixture) {
        // Run-owned users cascade to their candidate/CV records and real sessions.
        expect(await cleanupGd2EvaluationFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await recruiterAContext?.close();
      await recruiterBContext?.close();
      await candidateContext?.close();
    }
  });

  test('A nộp đánh giá cho lịch đã hoàn tất của mình và đọc lại sau reload', async () => {
    await signInRecruiter(recruiterAPage, fixture.recruiterA.email, fixture.password);
    await recruiterAPage.goto(`${detailPath()}?tab=evaluation`);
    await expect(recruiterAPage.getByRole('heading', { level: 1, name: fixture.candidateA.name, exact: true })).toBeVisible();
    for (const label of ['Tổng quan', 'Đánh giá phỏng vấn', 'Ghi chú']) {
      await expect(recruiterAPage.getByRole('tab', { name: label, exact: true })).toBeVisible();
    }
    await expect(recruiterAPage.getByRole('tab', { name: 'Đánh giá phỏng vấn', exact: true })).toHaveAttribute('aria-selected', 'true');

    const interview = recruiterAPage.getByRole('region', { name: 'Nội dung đánh giá', exact: true }).getByRole('article');
    await expect(interview.getByText('Đã hoàn tất', { exact: true })).toBeVisible();
    await expect(interview).toContainText(`Người phỏng vấn: ${fixture.recruiterA.name}`);
    await interview.getByRole('button', { name: 'Nộp đánh giá', exact: true }).click();
    const form = interview.getByRole('form', { name: 'Đánh giá phỏng vấn', exact: true });
    for (const { label, score } of ratings) {
      await form.getByRole('radiogroup', { name: label, exact: true })
        .getByRole('radio', { name: String(score), exact: true }).check();
    }
    await form.getByRole('combobox', { name: 'Khuyến nghị', exact: true }).selectOption('yes');
    await form.getByRole('textbox', { name: 'Nhận xét', exact: true }).fill(comment());
    await form.getByRole('button', { name: 'Nộp đánh giá', exact: true }).click();
    await expectSavedScorecard(recruiterAPage);
    await recruiterAPage.reload();
    await expectSavedScorecard(recruiterAPage);

    const response = await recruiterAContext.request.get(`${apiBaseUrl()}/interviews/schedules/${fixture.interviewId}/scorecard`, {
      headers: { Authorization: `Bearer ${await accessToken(recruiterAContext)}` },
    });
    expect(response.status()).toBe(200);
    const saved = (await response.json()).data;
    expect(saved).toMatchObject(expectedScorecard());
    expect(typeof saved.id).toBe('string');
    expect(saved.id).toBeTruthy();
    savedScorecardId = saved.id;
  });

  test('B cùng khoa đọc đánh giá của A và thêm ghi chú qua giao diện', async () => {
    await signInRecruiter(recruiterBPage, fixture.recruiterB.email, fixture.password);
    await recruiterBPage.goto(`${detailPath()}?tab=evaluation`);
    await expectSavedScorecard(recruiterBPage);
    await expect(recruiterBPage.getByRole('button', { name: 'Nộp đánh giá', exact: true })).toHaveCount(0);
    await expect(recruiterBPage.getByRole('button', { name: 'Sửa đánh giá', exact: true })).toHaveCount(0);
    const headers = { Authorization: `Bearer ${await accessToken(recruiterBContext)}` };
    const scorecards = await recruiterBContext.request.get(`${apiBaseUrl()}/interview-scorecards/application/${fixture.applicationAId}`, { headers });
    expect(scorecards.status()).toBe(200);
    expect((await scorecards.json()).data).toEqual([
      expect.objectContaining({ ...expectedScorecard(), id: savedScorecardId }),
    ]);

    await recruiterBPage.getByRole('tab', { name: 'Ghi chú', exact: true }).click();
    await expect(recruiterBPage).toHaveURL((url) =>
      url.pathname === detailPath() && url.searchParams.get('tab') === 'notes',
    );
    const notes = recruiterBPage.getByRole('region', { name: 'Nội dung ghi chú', exact: true });
    await notes.getByRole('textbox', { name: 'Ghi chú mới', exact: true }).fill(note());
    await notes.getByRole('button', { name: 'Thêm ghi chú', exact: true }).click();
    await expect(notes.getByRole('article').filter({ hasText: note() })).toContainText(fixture.recruiterB.name);
    await recruiterBPage.reload();
    await expect(notes.getByText(note(), { exact: true })).toBeVisible();
    const response = await recruiterBContext.request.get(`${apiBaseUrl()}/applications/${fixture.applicationAId}/notes`, { headers });
    expect(response.status()).toBe(200);
    expect((await response.json()).data.items).toEqual([
      expect.objectContaining({ body: note(), author: { userId: fixture.recruiterB.userId, fullName: fixture.recruiterB.name } }),
    ]);
  });

  test('B chọn hai ứng viên và xem điểm AI cùng trung bình đánh giá', async () => {
    await recruiterBPage.goto(`/jobs/${fixture.job.id}/candidates`);
    for (const candidate of [fixture.candidateA, fixture.candidateB]) {
      await recruiterBPage.getByRole('checkbox', { name: `Chọn ${candidate.name}`, exact: true }).check();
    }
    await recruiterBPage.getByRole('button', { name: 'So sánh', exact: true }).click();
    await expect(recruiterBPage).toHaveURL((url) =>
      url.pathname === `/jobs/${fixture.job.id}/compare`
      && url.searchParams.get('ids') === `${fixture.applicationAId},${fixture.applicationBId}`,
    );
    await expect(recruiterBPage.getByRole('heading', { name: 'So sánh ứng viên', exact: true })).toBeVisible();
    const table = recruiterBPage.getByRole('table', { name: 'So sánh thông tin và đánh giá ứng viên', exact: true });
    await expect(table.getByRole('columnheader')).toHaveText(['Tiêu chí', fixture.candidateA.name, fixture.candidateB.name]);
    const row = (label: string) => table.getByRole('row').filter({
      has: recruiterBPage.getByRole('rowheader', { name: label, exact: true }),
    }).getByRole('cell');
    await expect(row('Điểm AI tổng thể (gợi ý)')).toHaveText([
      `${fixture.screeningA.overallScore} / 100`, `${fixture.screeningB.overallScore} / 100`,
    ]);
    await expect(row('Số đánh giá phỏng vấn')).toHaveText(['1', '0']);
    for (const { averageLabel, score } of ratings) {
      await expect(row(averageLabel)).toHaveText([`${score} / 5`, 'Chưa có']);
    }
    await expect(row('Số ghi chú')).toHaveText(['1', '0']);
  });

  test('Ứng viên nhận 403 cho đánh giá/ghi chú và payload đơn không lộ khoá nội bộ', async () => {
    const login = await candidateContext.request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.candidateA.email, password: fixture.password },
    });
    expect(login.status()).toBe(201);
    const token = (await login.json()).data.accessToken;
    expect(typeof token).toBe('string');
    expect(token).toBeTruthy();
    const headers = { Authorization: `Bearer ${token}` };
    for (const path of [
      `/interview-scorecards/application/${fixture.applicationAId}`,
      `/applications/${fixture.applicationAId}/notes`,
    ]) {
      const response = await candidateContext.request.get(`${apiBaseUrl()}${path}`, { headers });
      expect(response.status(), path).toBe(403);
      expect((await response.json()).data, path).toBeUndefined();
    }

    const response = await candidateContext.request.get(`${apiBaseUrl()}/applications/my`, { headers });
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.data).toEqual([
      expect.objectContaining({ applicationId: fixture.applicationAId, status: 'interview' }),
    ]);
    const keys = payloadKeys(payload);
    expect(keys, 'Control: recursion must find status inside the application array').toContain('status');
    for (const forbidden of ['scorecard', 'scorecards', 'notes']) {
      expect(keys, `Candidate payload must contain no ${forbidden} key at any depth`).not.toContain(forbidden);
    }
  });
});
