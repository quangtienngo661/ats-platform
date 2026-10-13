// Real browser → Next server action → Nest API → PostgreSQL → reload.
// No route interception, unsigned JWT fixture, fake API or mocked database.
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';

let accessToken = '';
let loginRefreshToken = '';
const createdNames = new Set<string>();

test.beforeEach(async ({ page }) => {
  createdNames.clear();
  accessToken = '';
  loginRefreshToken = '';
  await page.goto('/ai-configuration');
  await expect(page).toHaveURL(/\/sign-in\/admin/);
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill(process.env.WEB_E2E_ADMIN_EMAIL!);
  await page
    .getByLabel('Mật khẩu', { exact: true })
    .fill(process.env.WEB_E2E_ADMIN_PASSWORD!);
  await page
    .getByRole('button', { name: 'Đăng nhập với tư cách Admin', exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard/);
  accessToken = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'accessToken',
  )!.value;
  loginRefreshToken = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'refreshToken',
  )!.value;
  await page.goto('/ai-configuration');
  await expect(
    page.getByRole('heading', { name: 'Cấu hình AI Screening' }),
  ).toBeVisible();
});

test.afterEach(async ({ request, page }) => {
  if (!accessToken) return;
  try {
  const response = await request.get(`${apiBaseUrl()}/ai-config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBe(true);
  const rows = (await response.json()).data;
  for (const row of rows) {
    if (
      createdNames.has(row.name) &&
      row.organizationId === process.env.WEB_E2E_ORGANIZATION_ID &&
      row.isDefault === false
    ) {
      const deleted = await request.delete(
        `${apiBaseUrl()}/ai-config/${row.configId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      expect(deleted.ok()).toBe(true);
    }
  }
  } finally {
    // Revoke test sessions even if a RED assertion or cleanup fails. A failed
    // replay assertion may have rotated the cookie in the API request context.
    const browserCookies = await page.context().cookies();
    const apiCookies = (await request.storageState()).cookies;
    const tokens = new Set([
      loginRefreshToken,
      ...browserCookies.filter(cookie => cookie.name === 'refreshToken').map(cookie => cookie.value),
      ...apiCookies.filter(cookie => cookie.name === 'refreshToken').map(cookie => cookie.value),
    ]);
    for (const token of tokens) {
      if (!token) continue;
      const revoked = await request.post(`${apiBaseUrl()}/auth/logout`, {
        headers: { Authorization: `Bearer ${accessToken}`, Cookie: `refreshToken=${token}` },
      });
      expect(revoked.ok()).toBe(true);
    }
  }
});

for (const closeButton of ['Hủy', 'Đóng cấu hình']) {
  test(`admin đăng nhập → điền cấu hình → ${closeButton} → không có bản ghi mới`, async ({
    page,
    request,
  }) => {
    const name = `e2e-audit-cancel-${randomUUID()}`;
    createdNames.add(name);
    await page
      .getByRole('button', { name: 'Thêm cấu hình mới', exact: true })
      .first()
      .click();
    await page.getByRole('textbox', { name: 'Tên cấu hình *' }).fill(name);
    await page
      .getByRole('combobox', { name: 'Tổ chức *' })
      .selectOption(process.env.WEB_E2E_ORGANIZATION_ID!);

    await page.getByRole('button', { name: closeButton, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Thêm cấu hình mới' }),
    ).toBeHidden();
    // Wait for any accidentally submitted action before asking the real API.
    await page.reload();
    const response = await request.get(`${apiBaseUrl()}/ai-config`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.ok()).toBe(true);
    expect(
      (await response.json()).data.map((row: { name: string }) => row.name),
    ).not.toContain(name);
  });
}

test('admin tạo cấu hình → reload từ database → đăng xuất và thu hồi phiên', async ({
  page,
  request,
}) => {
  const name = `e2e-audit-save-${randomUUID()}`;
  createdNames.add(name);
  await page
    .getByRole('button', { name: 'Thêm cấu hình mới', exact: true })
    .first()
    .click();
  await page.getByRole('textbox', { name: 'Tên cấu hình *' }).fill(name);
  await page
    .getByRole('combobox', { name: 'Tổ chức *' })
    .selectOption(process.env.WEB_E2E_ORGANIZATION_ID!);
  await page
    .getByRole('button', { name: 'Thêm cấu hình', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Thêm cấu hình mới' }),
  ).toBeHidden();
  await page.reload();
  await expect
    .poll(async () =>
      page
        .getByRole('textbox')
        .evaluateAll((fields) =>
          fields.map((field) => (field as HTMLInputElement).value),
        ),
    )
    .toContain(name);
  const response = await request.get(`${apiBaseUrl()}/ai-config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBe(true);
  const created = (await response.json()).data.find(
    (row: { name: string }) => row.name === name,
  );
  expect(created.organizationId).toBe(process.env.WEB_E2E_ORGANIZATION_ID);
  expect(Number(created.skillsWeight)).toBe(0.4);
  expect(Number(created.experienceWeight)).toBe(0.4);
  expect(Number(created.educationWeight)).toBe(0.2);
  expect(Number(created.minimumScoreThreshold)).toBe(60);

  const refreshToken = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'refreshToken',
  )!.value;
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\/admin/);
  const cookieNames = (await page.context().cookies()).map(
    (cookie) => cookie.name,
  );
  expect(cookieNames).not.toContain('accessToken');
  expect(cookieNames).not.toContain('refreshToken');
  const replay = await request.post(`${apiBaseUrl()}/auth/refresh`, {
    headers: { Cookie: `refreshToken=${refreshToken}` },
  });
  expect(replay.status()).toBe(401);
});

test('admin thiếu access cookie → refresh → đọc cấu hình ngay trong request hiện tại', async ({ page }) => {
  const oldRefresh = (await page.context().cookies()).find(cookie => cookie.name === 'refreshToken')!.value;
  await page.context().clearCookies({ name: 'accessToken' });
  await page.goto('/ai-configuration');
  await expect(page).toHaveURL(/\/ai-configuration$/);
  await expect(page.getByRole('heading', { name: 'Cấu hình AI Screening' })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find(cookie => cookie.name === 'accessToken')?.value).toBeTruthy();
  expect(cookies.find(cookie => cookie.name === 'refreshToken')?.value).not.toBe(oldRefresh);
});
