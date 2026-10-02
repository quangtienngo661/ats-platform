import { expect, test } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';

test('candidate refresh phiên thật → bị chặn trang admin → login trở về trang việc làm', async ({ page, request, baseURL }) => {
  const login = await request.post(`${apiBaseUrl()}/auth/login`, {
    data: {
      email: process.env.WEB_E2E_CANDIDATE_EMAIL,
      password: process.env.WEB_E2E_CANDIDATE_PASSWORD,
    },
  });
  expect(login.status()).toBe(201);
  const accessToken = (await login.json()).data.accessToken;
  const refreshToken = (await request.storageState()).cookies.find(cookie => cookie.name === 'refreshToken')!.value;
  try {
    // Real API-issued refresh token; deliberately omit accessToken to exercise
    // the refresh branch without forging or changing a signed JWT.
    await page.context().addCookies([{
      name: 'refreshToken', value: refreshToken, url: baseURL!, httpOnly: true, sameSite: 'Lax',
    }]);
    await page.goto('/ai-configuration');
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole('heading', { name: 'Cấu hình AI Screening' })).toBeHidden();
    const refreshed = (await page.context().cookies()).find(cookie => cookie.name === 'accessToken')?.value;
    expect(refreshed).toBeTruthy();
    const denied = await request.get(`${apiBaseUrl()}/ai-config`, {
      headers: { Authorization: `Bearer ${refreshed}` },
    });
    expect(denied.status()).toBe(403);
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/\/job-postings$/);
  } finally {
    const cookies = [...await page.context().cookies(), ...(await request.storageState()).cookies];
    for (const token of new Set([refreshToken, ...cookies.filter(cookie => cookie.name === 'refreshToken').map(cookie => cookie.value)])) {
      const logout = await request.post(`${apiBaseUrl()}/auth/logout`, {
        headers: { Authorization: `Bearer ${accessToken}`, Cookie: `refreshToken=${token}` },
      });
      expect(logout.ok()).toBe(true);
    }
  }
});
