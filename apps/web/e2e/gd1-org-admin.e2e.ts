// Browser → real Next actions → Nest → isolated PostgreSQL. No API interception.
// The serial journey keeps two real sessions and respects the 5/min login limit.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import {
  attachInterviewApplication,
  cleanupGd1Fixtures,
  createGd1Fixtures,
  recruiterAccountEvidence,
  userCountByEmail,
  waitForAuthWindow,
} from './support/gd1-fixtures.mjs';

type Row = Record<string, any>;

function rowsFrom(data: any): Row[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  throw new Error('Expected a real API collection');
}

async function accessToken(page: Page) {
  const token = (await page.context().cookies()).find((cookie) => cookie.name === 'accessToken')?.value;
  expect(token, 'Browser must have an API-issued access cookie').toBeTruthy();
  return token!;
}

async function signIn(page: Page, email: string, password: string, role: 'admin' | 'org_admin') {
  await page.goto('/sign-in/admin');
  if (role === 'org_admin') {
    await page.getByRole('button', { name: 'Quản trị tổ chức', exact: true }).click();
  }
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', {
    name: role === 'admin' ? 'Đăng nhập với tư cách Admin' : 'Đăng nhập với tư cách Quản trị tổ chức',
    exact: true,
  }).click();
  await expect(page).toHaveURL(role === 'admin' ? /\/dashboard$/ : /\/department-management$/);
}

test('A2: guest không truy cập trực tiếp recruiter-management hoặc my-profile', async ({ page }) => {
  for (const path of ['/recruiter-management', '/my-profile']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in\/admin(?:\?|$)/);
    await expect(page.getByRole('heading', { name: 'Cổng nội bộ', exact: true })).toBeVisible();
  }
});

test.describe('GĐ1 tuần cuối — portal org_admin với hai tổ chức thật', () => {
  test.describe.configure({ mode: 'serial' });
  let fixture: Awaited<ReturnType<typeof createGd1Fixtures>>;
  let adminContext: BrowserContext;
  let organizationContext: BrowserContext;
  let adminPage: Page;
  let organizationPage: Page;
  let recruiterA: Row;
  let jobA: Row;
  let applicationAId: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    await waitForAuthWindow();
    fixture = await createGd1Fixtures(apiBaseUrl());
    adminContext = await browser.newContext({ baseURL });
    organizationContext = await browser.newContext({ baseURL });
    adminPage = await adminContext.newPage();
    organizationPage = await organizationContext.newPage();
  });

  test.afterAll(async () => {
    try {
      // Logout the seeded platform account; run-owned staff sessions are also
      // removed by their cascading User deletion in the fixture transaction.
      if (adminContext) {
        const cookies = await adminContext.cookies();
        const token = cookies.find((cookie) => cookie.name === 'accessToken')?.value;
        const refresh = cookies.find((cookie) => cookie.name === 'refreshToken')?.value;
        if (token && refresh) {
          const logout = await adminContext.request.post(`${apiBaseUrl()}/auth/logout`, {
            headers: { Authorization: `Bearer ${token}`, Cookie: `refreshToken=${refresh}` },
          });
          expect(logout.status()).toBe(201);
        }
      }
      if (fixture) {
        expect(await cleanupGd1Fixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await adminContext?.close();
      await organizationContext?.close();
    }
  });

  test('A3/A7: admin tạo org_admin có Organization và đọc nhãn tổ chức từ database', async () => {
    await signIn(adminPage, process.env.WEB_E2E_ADMIN_EMAIL!, process.env.WEB_E2E_ADMIN_PASSWORD!, 'admin');
    await adminPage.goto('/user-management');
    await expect(adminPage.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible();
    await adminPage.getByRole('button', { name: 'Thêm người dùng', exact: true }).click();
    await adminPage.getByRole('combobox', { name: /Vai trò/ }).selectOption('org_admin');
    await adminPage.getByRole('textbox', { name: /Họ và tên/ }).fill(fixture.adminA.name);
    await adminPage.getByRole('textbox', { name: /^Email/ }).fill(fixture.adminA.email);
    await adminPage.getByLabel(/^Mật khẩu/).fill(fixture.password);
    const organizationSelect = adminPage.getByRole('combobox', { name: /Tổ chức/ });
    await expect(organizationSelect).toHaveAttribute('required', '');
    await organizationSelect.selectOption(fixture.orgA.id);
    await adminPage.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(adminPage.getByRole('heading', { name: 'Thêm người dùng' })).toBeHidden();
    await adminPage.reload();
    const userRow = adminPage.getByRole('row').filter({ hasText: fixture.adminA.email });
    await expect(userRow).toHaveCount(1);
    await expect(userRow.getByText('Quản trị tổ chức', { exact: true })).toBeVisible();
    await expect(userRow.getByText(`Tổ chức: ${fixture.orgA.name}`, { exact: true })).toBeVisible();
    const userResponse = await adminContext.request.get(`${apiBaseUrl()}/users`, {
      headers: { Authorization: `Bearer ${await accessToken(adminPage)}` },
    });
    expect(userResponse.status()).toBe(200);
    const user = rowsFrom((await userResponse.json()).data).find((row) => row.email === fixture.adminA.email)!;
    expect(user.role).toBe('org_admin');
    expect(user.organizationId).toBe(fixture.orgA.id);
    expect(user.recruiter).toBeNull();

    await adminPage.goto('/department-management');
    await expect(adminPage.getByText(fixture.departmentA.name, { exact: true })).toBeVisible();
    await expect(adminPage.getByText(fixture.departmentB.name, { exact: true })).toBeVisible();
    await expect(adminPage.getByText(`Tổ chức: ${fixture.orgA.name}`, { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText(`Tổ chức: ${fixture.orgB.name}`, { exact: true }).first()).toBeVisible();
    await adminPage.goto('/ai-configuration');
    await expect(adminPage.getByText(`Tổ chức: ${fixture.orgA.name}`, { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText(`Tổ chức: ${fixture.orgB.name}`, { exact: true }).first()).toBeVisible();
  });

  test('A1/A2: org_admin login, menu, private routes và refresh giữ phạm vi tổ chức', async () => {
    await organizationPage.goto('/sign-in/admin');
    await organizationPage.getByRole('textbox', { name: 'Email', exact: true }).fill(fixture.adminA.email);
    await organizationPage.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
    await organizationPage.getByRole('button', { name: 'Đăng nhập với tư cách Admin', exact: true }).click();
    await expect(organizationPage.getByText('Tài khoản của bạn không có quyền truy cập portal này', { exact: true })).toBeVisible();
    expect((await organizationContext.cookies()).map((cookie) => cookie.name)).not.toContain('accessToken');
    expect((await organizationContext.cookies()).map((cookie) => cookie.name)).not.toContain('refreshToken');
    await signIn(organizationPage, fixture.adminA.email, fixture.password, 'org_admin');
    await expect(organizationPage.getByText(fixture.departmentA.name, { exact: true })).toBeVisible();
    await expect(organizationPage.getByText(fixture.departmentB.name, { exact: true })).toBeHidden();
    await expect(organizationPage.getByRole('link', { name: /Nhà tuyển dụng/ }).first()).toBeVisible();
    await expect(organizationPage.getByRole('link', { name: /người dùng/i })).toHaveCount(0);
    const routes = [
      ['/recruiter-management', 'Quản lý nhà tuyển dụng'],
      ['/ai-configuration', 'Cấu hình AI Screening'],
      ['/jobs', 'Tin tuyển dụng'],
      ['/interviews', 'Lịch phỏng vấn'],
    ];
    for (const [route, heading] of routes) {
      await organizationPage.goto(route);
      await expect(organizationPage).toHaveURL(new RegExp(`${route}$`));
      await expect(organizationPage.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await organizationPage.goto('/dashboard');
    await expect(organizationPage).toHaveURL(/\/dashboard$/);
    await organizationPage.goto('/my-profile');
    await expect(organizationPage).toHaveURL(/\/my-profile$/);
    await expect(organizationPage.getByText('Không tìm thấy hồ sơ nhà tuyển dụng')).toBeHidden();
    for (const forbidden of ['/user-management', '/skill-management', '/job-category-management']) {
      await organizationPage.goto(forbidden);
      await expect(organizationPage).toHaveURL(/\/department-management$/);
    }
    const oldRefresh = (await organizationContext.cookies()).find((cookie) => cookie.name === 'refreshToken')!.value;
    await organizationContext.clearCookies({ name: 'accessToken' });
    await organizationPage.goto('/recruiter-management');
    await expect(organizationPage).toHaveURL(/\/recruiter-management$/);
    await expect(organizationPage.getByRole('heading', { name: 'Quản lý nhà tuyển dụng' })).toBeVisible();
    const cookies = await organizationContext.cookies();
    expect(cookies.find((cookie) => cookie.name === 'accessToken')?.value).toBeTruthy();
    expect(cookies.find((cookie) => cookie.name === 'refreshToken')?.value).not.toBe(oldRefresh);
    const users = await organizationContext.request.get(`${apiBaseUrl()}/users`, {
      headers: { Authorization: `Bearer ${await accessToken(organizationPage)}` },
    });
    expect(users.status()).toBe(403);
  });

  test('A4: org_admin không có Recruiter tạo account + profile cùng department qua UI', async () => {
    await organizationPage.goto('/recruiter-management');
    await organizationPage.getByRole('button', { name: 'Thêm nhà tuyển dụng', exact: true }).click();
    await organizationPage.getByRole('textbox', { name: /Họ và tên/ }).fill(fixture.recruiterA.name);
    await organizationPage.getByRole('textbox', { name: /^Email/ }).fill(fixture.recruiterA.email);
    await organizationPage.getByLabel(/^Mật khẩu/).fill(fixture.password);
    const departments = organizationPage.getByRole('combobox', { name: /Phòng ban/ });
    await expect(departments.getByRole('option', { name: fixture.departmentB.name, exact: true })).toHaveCount(0);
    await departments.selectOption(fixture.departmentA.id);
    await organizationPage.getByRole('textbox', { name: /Chức vụ/ }).fill('Interviewer A');
    await organizationPage.getByRole('button', { name: 'Tạo', exact: true }).click();
    await expect(organizationPage.getByRole('heading', { name: 'Thêm nhà tuyển dụng mới' })).toBeHidden();
    await organizationPage.reload();
    await expect(organizationPage.getByText(fixture.recruiterA.name, { exact: true }).first()).toBeVisible();
    const response = await organizationContext.request.get(`${apiBaseUrl()}/recruiters`, {
      headers: { Authorization: `Bearer ${await accessToken(organizationPage)}` },
    });
    expect(response.status()).toBe(200);
    const recruiters = rowsFrom((await response.json()).data);
    expect(recruiters).toHaveLength(1);
    recruiterA = recruiters[0];
    expect(recruiterA.user.email).toBe(fixture.recruiterA.email);
    expect(recruiterA.organizationId).toBe(fixture.orgA.id);
    expect(recruiterA.department.departmentId).toBe(fixture.departmentA.id);
    expect(await recruiterAccountEvidence(fixture.recruiterA.email, fixture.password)).toMatchObject({
      role: 'recruiter', organization_id: null,
      recruiter_organization_id: fixture.orgA.id, department_id: fixture.departmentA.id,
      passwordMatches: true, passwordStoredPlaintext: false,
    });
  });

  test('A5: org_admin chọn recruiter owner để tạo job thủ công và reload dữ liệu đã lưu', async () => {
    await organizationPage.goto('/jobs');
    await organizationPage.getByRole('button', { name: 'Tạo tin mới', exact: true }).click();
    const owners = organizationPage.getByRole('combobox', { name: /Người phụ trách/ });
    await expect(owners.getByRole('option', { name: new RegExp(fixture.recruiterB.name) })).toHaveCount(0);
    await owners.selectOption(recruiterA.recruiterId);
    await organizationPage.getByRole('textbox', { name: /Tiêu đề vị trí/ }).fill(fixture.jobA.title);
    await organizationPage.getByRole('textbox', { name: /Mô tả công việc/ }).fill('Tin kiểm chứng multi-tenant. Không gọi AI bên ngoài.');
    await organizationPage.getByRole('button', { name: 'Tiếp tục không dùng AI', exact: true }).click();
    await expect(organizationPage.getByRole('heading', { name: 'Tạo tin tuyển dụng (Bước 2/2)', exact: true })).toBeVisible();
    await organizationPage.getByRole('button', { name: 'Xuất bản', exact: true }).click();
    await expect(organizationPage.getByRole('heading', { name: 'Tạo tin tuyển dụng (Bước 2/2)', exact: true })).toBeHidden();
    await organizationPage.reload();
    await expect(organizationPage.getByText(fixture.jobA.title, { exact: true }).first()).toBeVisible();
    const response = await organizationContext.request.get(`${apiBaseUrl()}/job-postings`, {
      headers: { Authorization: `Bearer ${await accessToken(organizationPage)}` },
    });
    expect(response.status()).toBe(200);
    const jobs = rowsFrom((await response.json()).data);
    expect(jobs).toHaveLength(1);
    jobA = jobs[0];
    expect(jobA.title).toBe(fixture.jobA.title);
    expect(jobA.organizationId).toBe(fixture.orgA.id);
    expect(jobA.department.departmentId).toBe(fixture.departmentA.id);
    expect(jobA.recruiter.recruiterId).toBe(recruiterA.recruiterId);
    expect(jobA.status).toBe('draft');
    applicationAId = await attachInterviewApplication(fixture, jobA.jobId);
  });

  test('A6: org_admin xem hồ sơ User/Organization và đặt interview với recruiter trong tổ chức', async () => {
    await organizationPage.goto('/my-profile');
    await expect(organizationPage.getByText(fixture.adminA.email, { exact: true }).first()).toBeVisible();
    await expect(organizationPage.getByText(fixture.orgA.name, { exact: true }).first()).toBeVisible();
    await expect(organizationPage.getByText('Không tìm thấy hồ sơ nhà tuyển dụng')).toBeHidden();
    await organizationPage.goto('/interviews');
    await organizationPage.getByRole('button', { name: 'Đặt phỏng vấn', exact: true }).click();
    await organizationPage.getByRole('combobox', { name: 'Ứng viên', exact: true }).selectOption(applicationAId);
    const interviewers = organizationPage.getByRole('combobox', { name: 'Người phỏng vấn', exact: true });
    await expect(interviewers.getByRole('option', { name: new RegExp(fixture.recruiterA.name) })).toHaveCount(1);
    await expect(interviewers.getByRole('option', { name: new RegExp(fixture.recruiterB.name) })).toHaveCount(0);
    await interviewers.selectOption(recruiterA.user.userId);
    // The default date belongs to the visible work week. A late time avoids a
    // past-time rejection when the suite is run during the evening.
    await organizationPage.getByLabel('Giờ phỏng vấn', { exact: true }).fill('23:45');
    await organizationPage.getByRole('button', { name: 'Đặt lịch', exact: true }).click();
    await expect(organizationPage.getByRole('heading', { name: 'Đặt phỏng vấn', exact: true })).toBeHidden();
    const response = await organizationContext.request.get(`${apiBaseUrl()}/interviews/schedules/my?applicationId=${applicationAId}`, {
      headers: { Authorization: `Bearer ${await accessToken(organizationPage)}` },
    });
    expect(response.status()).toBe(200);
    const schedules = rowsFrom((await response.json()).data);
    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({
      organizationId: fixture.orgA.id, applicationId: applicationAId,
      interviewerId: recruiterA.user.userId, durationMinutes: 60,
    });
  });

  test('A7/A9: đổi default A không đổi B; đoán UUID B không đọc/ghi được dữ liệu tenant', async () => {
    const headers = { Authorization: `Bearer ${await accessToken(organizationPage)}` };
    const defaultResponse = await organizationContext.request.patch(`${apiBaseUrl()}/ai-config/${fixture.aiA.replacementId}/set-default`, { headers });
    expect(defaultResponse.status()).toBe(200);
    const adminHeaders = { Authorization: `Bearer ${await accessToken(adminPage)}` };
    const allConfigs = await adminContext.request.get(`${apiBaseUrl()}/ai-config`, { headers: adminHeaders });
    expect(allConfigs.status()).toBe(200);
    const configs = rowsFrom((await allConfigs.json()).data);
    expect(configs.find((row) => row.configId === fixture.aiA.id)?.isDefault).toBe(false);
    expect(configs.find((row) => row.configId === fixture.aiA.replacementId)?.isDefault).toBe(true);
    expect(configs.find((row) => row.configId === fixture.aiB.id)?.isDefault).toBe(true);
    const ownConfigs = await organizationContext.request.get(`${apiBaseUrl()}/ai-config`, { headers });
    expect(ownConfigs.status()).toBe(200);
    expect(rowsFrom((await ownConfigs.json()).data).map((row) => row.organizationId)).toEqual([fixture.orgA.id, fixture.orgA.id]);

    for (const [path, status] of [
      [`/departments/${fixture.departmentB.id}`, 404],
      [`/recruiters/${fixture.recruiterB.id}`, 404],
      [`/job-postings/${fixture.jobB.id}`, 404],
      [`/applications/${fixture.applicationBId}`, 403],
      [`/interviews/schedules/${fixture.interviewBId}`, 403],
      [`/ai-config/${fixture.aiB.id}`, 404],
    ] as const) {
      const denied = await organizationContext.request.get(`${apiBaseUrl()}${path}`, { headers });
      expect(denied.status(), path).toBe(status);
      expect((await denied.json()).data, path).toBeUndefined();
      const allowed = await adminContext.request.get(`${apiBaseUrl()}${path}`, { headers: adminHeaders });
      expect(allowed.status(), `platform admin ${path}`).toBe(200);
    }
    const forbiddenAccount = await organizationContext.request.post(`${apiBaseUrl()}/recruiters/accounts`, {
      headers, data: {
        fullName: 'Tài khoản không được tạo', email: fixture.rejectedEmail,
        password: fixture.password, departmentId: fixture.departmentB.id, position: 'Rejected',
      },
    });
    expect(forbiddenAccount.status()).toBe(403);
    expect(await userCountByEmail(fixture.rejectedEmail)).toBe(0);
    const duplicateAccount = await organizationContext.request.post(`${apiBaseUrl()}/recruiters/accounts`, {
      headers, data: {
        fullName: 'Không nhân bản tài khoản', email: fixture.recruiterA.email,
        password: fixture.password, departmentId: fixture.departmentA.id, position: 'Duplicate',
      },
    });
    expect(duplicateAccount.status()).toBe(400);
    expect((await duplicateAccount.json()).message).toBe('Email đã tồn tại');
    expect(await userCountByEmail(fixture.recruiterA.email)).toBe(1);
    const forbiddenOwner = await organizationContext.request.post(`${apiBaseUrl()}/job-postings`, {
      headers, data: { title: 'Không được tạo', locationType: 'onsite', createdBy: fixture.recruiterB.id, description: 'Boundary test' },
    });
    expect(forbiddenOwner.status()).toBe(404);
    const forbiddenAssignment = await organizationContext.request.post(`${apiBaseUrl()}/recruiters`, {
      headers, data: { userId: fixture.recruiterB.userId, departmentId: fixture.departmentA.id, position: 'No global user assignment' },
    });
    expect(forbiddenAssignment.status()).toBe(403);
  });

  test('A3/A8: admin đổi organization qua UI, HTTP dùng binding mới và refresh cũ bị thu hồi', async () => {
    const oldToken = await accessToken(organizationPage);
    const oldRefresh = (await organizationContext.cookies()).find((cookie) => cookie.name === 'refreshToken')!.value;
    await adminPage.goto('/user-management');
    const row = adminPage.getByRole('row').filter({ hasText: fixture.adminA.email });
    await row.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
    await adminPage.getByRole('combobox', { name: /Tổ chức/ }).selectOption(fixture.orgB.id);
    await adminPage.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(adminPage.getByRole('heading', { name: /Chỉnh sửa người dùng|Cập nhật người dùng/ })).toBeHidden();
    await adminPage.reload();
    await expect(adminPage.getByRole('row').filter({ hasText: fixture.adminA.email }).getByText(`Tổ chức: ${fixture.orgB.name}`, { exact: true })).toBeVisible();
    const headers = { Authorization: `Bearer ${oldToken}` };
    const oldOrganization = await organizationContext.request.get(`${apiBaseUrl()}/departments/${fixture.departmentA.id}`, { headers });
    expect(oldOrganization.status()).toBe(404);
    const newOrganization = await organizationContext.request.get(`${apiBaseUrl()}/departments/${fixture.departmentB.id}`, { headers });
    expect(newOrganization.status()).toBe(200);
    const replay = await organizationContext.request.post(`${apiBaseUrl()}/auth/refresh`, {
      headers: { Cookie: `refreshToken=${oldRefresh}` },
    });
    expect(replay.status()).toBe(401);
  });
});
