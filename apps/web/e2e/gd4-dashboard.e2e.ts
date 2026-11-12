// Browser -> real Next actions -> Nest -> isolated PostgreSQL. No API interception, no AI call.
// GĐ4 C19: the dashboard shows the funnel the database holds, per role; the AI cost block is priced
// from the admin's model prices and says which model has none.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import { cleanupGd4AnalyticsFixtures, createGd4AnalyticsFixtures } from './support/gd4-analytics-fixtures.mjs';

type Role = 'recruiter' | 'org_admin' | 'admin';
const ROLE_BUTTON: Record<Role, string | null> = { recruiter: 'Recruiter', org_admin: 'Org', admin: null };
const SUBMIT: Record<Role, string> = {
  recruiter: 'Đăng nhập với tư cách Recruiter',
  org_admin: 'Đăng nhập với tư cách Org',
  admin: 'Đăng nhập với tư cách Admin',
};

async function signIn(page: Page, email: string, password: string, role: Role) {
  await page.goto('/sign-in/admin');
  const roleButton = ROLE_BUTTON[role];
  if (roleButton) await page.getByRole('button', { name: roleButton, exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: SUBMIT[role], exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}

test.describe('GĐ4 — dashboard thống kê và chi phí AI', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd4AnalyticsFixtures>>;
  const contexts: BrowserContext[] = [];
  const pageFor = async (browser: import('@playwright/test').Browser, baseURL: string) => {
    const context = await browser.newContext({ baseURL });
    contexts.push(context);
    return context.newPage();
  };
  const dashboardPath = () => `/dashboard?days=30&jobId=${fixture.job.id}`;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await waitForAuthWindow();
    fixture = await createGd4AnalyticsFixtures(apiBaseUrl());
  });

  test.afterAll(async () => {
    try {
      if (fixture) {
        expect(await cleanupGd4AnalyticsFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  });

  test('C19: recruiter thấy funnel 5/4/3/2/1 của tin, không thấy chi phí AI', async ({ browser, baseURL }) => {
    const page = await pageFor(browser, baseURL!);
    await signIn(page, fixture.recruiter.email, fixture.password, 'recruiter');
    await page.goto(dashboardPath());

    const funnel = page.getByRole('region', { name: 'Phễu tuyển dụng' });
    await expect(funnel.getByRole('listitem')).toHaveText([
      /Ứng tuyển\s*5/, /Sàng lọc\s*4/, /Phỏng vấn\s*3/, /Offer\s*2/, /Đã tuyển\s*1/,
    ]);
    await expect(funnel.getByRole('listitem').nth(1)).toContainText('80% so với bước trước');
    await expect(page.getByText('Đơn ứng tuyển trong kỳ')).toBeVisible();
    // The six newest applications come from the API; all five of this job are there.
    for (const candidate of fixture.candidates) {
      await expect(page.getByRole('link', { name: new RegExp(candidate.name) })).toBeVisible();
    }
    // Control: the cost block is for org admins and admins only.
    await expect(page.getByRole('region', { name: 'Chi phí AI' })).toHaveCount(0);
  });

  test('org_admin thấy chi phí AI của tổ chức và model chưa có giá', async ({ browser, baseURL }) => {
    const page = await pageFor(browser, baseURL!);
    await signIn(page, fixture.orgAdmin.email, fixture.password, 'org_admin');
    await page.goto(dashboardPath());

    const cost = page.getByRole('region', { name: 'Chi phí AI' });
    await expect(cost.getByRole('status')).toHaveText(
      `Chưa có giá cho: ${fixture.unpricedModel}. Tổng chi phí chưa tính được.`,
    );
    const scoringRow = cost.getByRole('row').filter({ hasText: 'Chấm CV' });
    // 1 000 000 prompt tokens × $2.5 per million.
    await expect(scoringRow.getByRole('cell').last()).toHaveText('$2.50');
    await expect(cost.getByText(/^Tổng:/)).toContainText('Chưa có giá');
  });

  test('admin đặt giá cho model còn thiếu, org_admin thấy tổng chi phí', async ({ browser, baseURL }) => {
    const admin = await pageFor(browser, baseURL!);
    await signIn(admin, 'admin@ats.local', 'Admin@123', 'admin');
    await admin.goto('/ai-usage-logs');
    await admin.getByRole('textbox', { name: `Giá token vào của ${fixture.unpricedModel}` }).fill('1');
    await admin.getByRole('textbox', { name: `Giá token ra của ${fixture.unpricedModel}` }).fill('0');
    await admin.getByRole('button', { name: `Lưu giá ${fixture.unpricedModel}` }).click();
    await expect(admin.getByRole('status').filter({ hasText: `Đã lưu giá cho ${fixture.unpricedModel}.` })).toBeVisible();

    const orgAdmin = await pageFor(browser, baseURL!);
    await signIn(orgAdmin, fixture.orgAdmin.email, fixture.password, 'org_admin');
    await orgAdmin.goto(dashboardPath());
    const cost = orgAdmin.getByRole('region', { name: 'Chi phí AI' });
    // $2.50 + 10 tokens × $1 per million = $2.50001.
    await expect(cost.getByText(/^Tổng:/)).toContainText('$2.50001');
    await expect(cost.getByRole('status')).toHaveCount(0);
  });
});
