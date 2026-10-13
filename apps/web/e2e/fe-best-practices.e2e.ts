import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import { createFeFixtures, cleanupFeFixtures } from './support/fe-fixtures.mjs';

test.describe('FE best practices with real isolated API data', () => {
  test.describe.configure({ mode: 'serial' });
  let fixture: Awaited<ReturnType<typeof createFeFixtures>>;
  let candidateContext: BrowserContext;
  let recruiterContext: BrowserContext;
  let candidatePage: Page;
  let recruiterPage: Page;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    await waitForAuthWindow();
    fixture = await createFeFixtures(apiBaseUrl());
    candidateContext = await browser.newContext({ baseURL });
    recruiterContext = await browser.newContext({ baseURL });
    candidatePage = await candidateContext.newPage();
    recruiterPage = await recruiterContext.newPage();
  });

  test.afterAll(async () => {
    try {
      if (fixture) expect(await cleanupFeFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
    } finally {
      await candidateContext?.close();
      await recruiterContext?.close();
    }
  });

  test('public location filters reach the API; legacy rich text is sanitized', async ({ page, request }) => {
    await page.goto('/job-postings');
    await page.getByRole('textbox', { name: 'Tìm việc làm' }).fill(`FE sample ${fixture.runId.slice(0, 8)}`);
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
    for (const [type, label] of [['remote', 'Remote'], ['onsite', 'Văn phòng'], ['hybrid', 'Hybrid']]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`locationType=${type}`));
      const chosen = fixture.jobs.find((job: { locationType: string }) => job.locationType === type)!;
      await expect(page.getByRole('heading', { name: chosen.title, exact: true })).toBeVisible();
      for (const other of fixture.jobs.filter((job: { locationType: string }) => job.locationType !== type)) {
        await expect(page.getByRole('heading', { name: other.title, exact: true })).toHaveCount(0);
      }
    }
    const response = await request.get(`${apiBaseUrl()}/job-postings/${fixture.jobs[0].id}`);
    expect(response.ok()).toBe(true);
    expect((await response.json()).data.description).toBe('<p>Mô tả <strong>React</strong></p>');
    await page.goto(`/job-postings/${fixture.jobs[0].id}`);
    expect(await page.evaluate(() => '__unsafeHtml' in window)).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/job-postings');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test('candidate callback keeps its query; CV data and dialog focus survive reload', async () => {
    await candidatePage.goto('/sign-in?callbackUrl=%2Fmy-cvs%3Ftab%3Dall');
    await candidatePage.getByLabel('Email', { exact: true }).fill(fixture.candidate.email);
    await candidatePage.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
    await candidatePage.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(candidatePage).toHaveURL(/\/my-cvs\?tab=all$/);
    await expect(candidatePage.getByText(fixture.cvName, { exact: true })).toBeVisible();
    await candidatePage.reload();
    await expect(candidatePage.getByText(fixture.cvName, { exact: true })).toBeVisible();
    const upload = candidatePage.getByRole('button', { name: 'Tải CV lên', exact: true });
    await upload.click();
    await expect(candidatePage.getByRole('dialog', { name: 'Tải CV lên', exact: true })).toBeVisible();
    await candidatePage.keyboard.press('Escape');
    await expect(candidatePage.getByRole('dialog')).toHaveCount(0);
    await expect(upload).toBeFocused();
    await candidatePage.getByRole('button', { name: 'Xem chi tiết & xác nhận', exact: true }).click();
    await expect(candidatePage.getByRole('dialog', { name: 'Chi tiết CV', exact: true })).toBeVisible();
    await expect(candidatePage.getByRole('dialog').getByText('React', { exact: true })).toBeVisible();
    await candidatePage.keyboard.press('Escape');
  });

  test('resumed interview renders history and current question after refresh', async () => {
    await candidatePage.goto(`/mock-interview/${fixture.sessionId}`);
    await expect(candidatePage.getByText(fixture.question, { exact: true })).toBeVisible();
    await expect(candidatePage.getByText(fixture.answer, { exact: true })).toBeVisible();
    await candidatePage.reload();
    await expect(candidatePage.getByText(fixture.question, { exact: true })).toBeVisible();
    await expect(candidatePage.getByRole('textbox', { name: 'Câu trả lời', exact: true })).toBeVisible();
  });

  test('recruiter Kanban initializes the correct board; mobile navigation restores focus', async () => {
    await recruiterPage.goto('/sign-in/admin');
    await recruiterPage.getByRole('button', { name: 'Recruiter', exact: true }).click();
    await recruiterPage.getByLabel('Email', { exact: true }).fill(fixture.recruiterB.email);
    await recruiterPage.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
    await recruiterPage.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
    await expect(recruiterPage).toHaveURL(/\/dashboard$/);
    await recruiterPage.goto(`/jobs/${fixture.jobB.id}/kanban`);
    await expect(recruiterPage.getByText(fixture.candidate.name, { exact: true })).toBeVisible();
    await recruiterPage.reload();
    await expect(recruiterPage.getByText(fixture.candidate.name, { exact: true })).toBeVisible();
    await recruiterPage.setViewportSize({ width: 390, height: 844 });
    const menu = recruiterPage.getByRole('button', { name: 'Mở menu', exact: true });
    await menu.click();
    await expect(recruiterPage.getByRole('dialog', { name: 'Điều hướng', exact: true })).toBeVisible();
    await recruiterPage.keyboard.press('Escape');
    await expect(recruiterPage.getByRole('dialog')).toHaveCount(0);
    await expect(menu).toBeFocused();
  });
});
