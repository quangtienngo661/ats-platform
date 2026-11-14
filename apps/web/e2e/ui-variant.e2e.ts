import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';

// The runtime switch between the redesigned UI and the frozen legacy UI, driven the way a candidate does it:
// account menu → "Dùng giao diện cũ", then the floating pill back. The choice lives in the `talentai-ui` cookie.
test.describe('UI variant switch with a real candidate session', () => {
  test.describe.configure({ mode: 'serial' });
  let context: BrowserContext;
  let page: Page;

  const html = () => page.locator('html');
  const modernPill = () => page.getByRole('button', { name: 'Dùng giao diện mới', exact: true });
  const variantCookie = async () =>
    (await context.cookies()).find((cookie) => cookie.name === 'talentai-ui')?.value;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    await waitForAuthWindow();
    context = await browser.newContext({ baseURL });
    page = await context.newPage();
    await page.goto('/sign-in');
    await page.getByLabel('Email', { exact: true }).fill(process.env.WEB_E2E_CANDIDATE_EMAIL!);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.WEB_E2E_CANDIDATE_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/job-postings$/);
    await expect(html()).toHaveAttribute('data-ui', 'modern');
  });

  test.afterAll(async () => {
    try {
      // Revoke the session this run created through the API, so cleanup holds even when the UI under test broke.
      const cookies = (await context?.cookies()) ?? [];
      const accessToken = cookies.find((cookie) => cookie.name === 'accessToken')?.value;
      const refreshToken = cookies.find((cookie) => cookie.name === 'refreshToken')?.value;
      if (accessToken && refreshToken) {
        const logout = await context.request.post(`${apiBaseUrl()}/auth/logout`, {
          headers: { Authorization: `Bearer ${accessToken}`, Cookie: `refreshToken=${refreshToken}` },
        });
        expect(logout.ok()).toBe(true);
      }
    } finally {
      await context?.close();
    }
  });

  test('account menu switches to the legacy UI and the pill switches back', async () => {
    await page.getByRole('button', { name: 'Ứng viên E2E' }).first().click();
    await page.getByRole('menuitem', { name: 'Dùng giao diện cũ', exact: true }).click();
    await expect(html()).toHaveAttribute('data-ui', 'legacy');
    await expect(modernPill()).toBeVisible();
    expect(await variantCookie()).toBe('legacy');

    await modernPill().click();
    await expect(html()).toHaveAttribute('data-ui', 'modern');
    await expect(modernPill()).toHaveCount(0);
    expect(await variantCookie()).toBe('modern');
  });

  test('the chosen variant survives a reload', async () => {
    await page.getByRole('button', { name: 'Ứng viên E2E' }).first().click();
    await page.getByRole('menuitem', { name: 'Dùng giao diện cũ', exact: true }).click();
    await expect(html()).toHaveAttribute('data-ui', 'legacy');

    await page.reload();
    await expect(html()).toHaveAttribute('data-ui', 'legacy');
    await expect(modernPill()).toBeVisible();

    await modernPill().click();
    await expect(html()).toHaveAttribute('data-ui', 'modern');
    await page.reload();
    await expect(html()).toHaveAttribute('data-ui', 'modern');
    await expect(modernPill()).toHaveCount(0);
  });
});
