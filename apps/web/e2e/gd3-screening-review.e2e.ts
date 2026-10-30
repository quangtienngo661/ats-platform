// Browser -> real Next actions -> Nest -> isolated PostgreSQL. No API interception.
// GĐ3 part 3b (C14): a recruiter reviews a completed screening; the Kanban shows the
// reviewed score with "Đã duyệt"; the CSV, the candidate payload and the database agree;
// the application status and the AI recommendation do not move (ADR 0002).
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow } from './support/gd1-fixtures.mjs';
import {
  cleanupGd3ReviewFixtures,
  createGd3ReviewFixtures,
  readApplicationStatus,
  readScreening,
} from './support/gd3-review-fixtures.mjs';

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

// toCsv quotes every cell; these fixtures contain no embedded record separators.
const parseCsv = (content: string): string[][] =>
  content
    .replace(/^﻿/, '')
    .split('\r\n')
    .filter((record) => record.length > 0)
    .map((record) => record.slice(1, -1).split('","').map((cell) => cell.replace(/""/g, '"')));

test.describe('GĐ3 3b — người duyệt trên kết quả chấm', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd3ReviewFixtures>>;
  let recruiterContext: BrowserContext;
  let candidateContext: BrowserContext;
  let recruiterPage: Page;

  const detailPath = (applicationId: string) => `/jobs/${fixture.job.id}/candidates/${applicationId}`;
  const note = () => `GĐ3 đã đối chiếu CV ${fixture.runId}`;
  // 90/70/60 at weights 0.5/0.3/0.2 → 45 + 21 + 12 = 78.
  const reviewed = { skills: 90, experience: 70, education: 60, overall: 78 };

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    if (!baseURL) throw new Error('The Playwright config must supply a local baseURL');
    await waitForAuthWindow();
    fixture = await createGd3ReviewFixtures(apiBaseUrl());
    recruiterContext = await browser.newContext({ baseURL });
    candidateContext = await browser.newContext({ baseURL });
    recruiterPage = await recruiterContext.newPage();
  });

  test.afterAll(async () => {
    try {
      if (fixture) {
        expect(await cleanupGd3ReviewFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await recruiterContext?.close();
      await candidateContext?.close();
    }
  });

  test('recruiter sửa một điểm, bắt buộc có lý do, rồi lưu', async () => {
    await signInRecruiter(recruiterPage, fixture.recruiter.email, fixture.password);
    await recruiterPage.goto(detailPath(fixture.candidateA.applicationId));
    await expect(recruiterPage.getByRole('heading', { level: 1, name: fixture.candidateA.name, exact: true })).toBeVisible();
    // Control: before any review there is no marker anywhere on the page.
    await expect(recruiterPage.getByText('Đã duyệt', { exact: true })).toHaveCount(0);

    await recruiterPage.getByRole('button', { name: 'Duyệt điểm', exact: true }).click();
    const dialog = recruiterPage.getByRole('dialog', { name: 'Duyệt điểm sàng lọc' });
    await expect(dialog).toBeVisible();
    // AI scores sit next to the editable ones.
    const aiCells = dialog.getByRole('row').filter({ has: recruiterPage.getByRole('cell') })
      .locator('td:nth-child(2)');
    await expect(aiCells).toHaveText(['80', '70', '60']);

    await dialog.getByRole('spinbutton', { name: 'Điểm kỹ năng sau duyệt' }).fill(String(reviewed.skills));
    await dialog.getByRole('button', { name: 'Lưu điểm duyệt', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Vui lòng nhập lý do khi sửa điểm');
    // Nothing was written yet.
    expect((await readScreening(fixture.candidateA.applicationId)).reviewed_at).toBeNull();

    await dialog.getByRole('textbox', { name: /Lý do/ }).fill(note());
    await dialog.getByRole('button', { name: 'Lưu điểm duyệt', exact: true }).click();
    await expect(dialog).toBeHidden();

    await expect(recruiterPage.getByText('Đã duyệt', { exact: true }).first()).toBeVisible();
    await expect(recruiterPage.getByText(`Điểm đã duyệt: ${reviewed.overall}`)).toBeVisible();
  });

  test('database: người duyệt, điểm sau duyệt đã làm tròn, và điểm AI + khuyến nghị + trạng thái không đổi', async () => {
    const a = await readScreening(fixture.candidateA.applicationId);

    expect(a.reviewed_by_id).toBe(fixture.recruiter.userId);
    expect(a.reviewed_at).not.toBeNull();
    expect(a.review_note).toBe(note());
    expect(Number(a.reviewed_skills_score)).toBe(reviewed.skills);
    expect(Number(a.reviewed_experience_score)).toBe(reviewed.experience);
    expect(Number(a.reviewed_education_score)).toBe(reviewed.education);
    expect(Number(a.reviewed_overall_score)).toBe(reviewed.overall);
    // ADR 0002: the AI's own record and the application's status are untouched.
    expect(Number(a.overall_score)).toBe(fixture.aiScores.overall);
    expect(Number(a.skills_score)).toBe(fixture.aiScores.skills);
    expect(a.ai_recommendation).toBe('interview');
    expect(await readApplicationStatus(fixture.candidateA.applicationId)).toBe('screening');

    // Control: the other application of the same job was not touched.
    const b = await readScreening(fixture.candidateB.applicationId);
    expect(b.reviewed_at).toBeNull();
    expect(b.reviewed_by_id).toBeNull();
    expect(Number(b.overall_score)).toBe(fixture.aiScores.overall);
  });

  test('Kanban: thẻ đã duyệt hiện điểm mới và "Đã duyệt", thẻ chưa duyệt giữ điểm AI', async () => {
    await recruiterPage.goto(`/jobs/${fixture.job.id}/kanban`);
    const card = (name: string) => recruiterPage.locator('div.group').filter({ hasText: name }).last();
    const cardA = card(fixture.candidateA.name);
    const cardB = card(fixture.candidateB.name);

    await expect(cardA.getByText(String(reviewed.overall), { exact: true })).toBeVisible();
    await expect(cardA.getByText('Đã duyệt', { exact: true })).toBeVisible();
    await expect(cardB.getByText(String(fixture.aiScores.overall), { exact: true })).toBeVisible();
    await expect(cardB.getByText('Đã duyệt', { exact: true })).toHaveCount(0);
  });

  test('CSV: điểm hiệu lực, điểm AI gốc và cờ "Đã duyệt"', async () => {
    const token = await accessToken(recruiterContext);
    const response = await recruiterContext.request.get(
      `${apiBaseUrl()}/applications/job/${fixture.job.id}/export`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(200);
    const [header, ...rows] = parseCsv(await response.text());
    const column = (label: string) => {
      const index = header.indexOf(label);
      expect(index, `column ${label}`).toBeGreaterThanOrEqual(0);
      return index;
    };
    const rowOf = (applicationId: string) => {
      const row = rows.find((r) => r[column('Mã đơn')] === applicationId);
      expect(row, applicationId).toBeDefined();
      return row ?? [];
    };

    const a = rowOf(fixture.candidateA.applicationId);
    expect(a[column('Điểm tổng (gợi ý AI)')]).toBe(`${reviewed.overall}.0`);
    expect(a[column('Điểm kỹ năng')]).toBe(`${reviewed.skills}.0`);
    expect(a[column('Điểm AI tổng (gốc)')]).toBe(`${fixture.aiScores.overall}.0`);
    expect(a[column('Đã duyệt')]).toBe('Có');

    const b = rowOf(fixture.candidateB.applicationId);
    expect(b[column('Điểm tổng (gợi ý AI)')]).toBe(`${fixture.aiScores.overall}.0`);
    expect(b[column('Đã duyệt')]).toBe('Không');
  });

  test('ứng viên thấy điểm đã duyệt trong các trường điểm quen thuộc và không thấy trường duyệt nào', async () => {
    const login = await candidateContext.request.post(`${apiBaseUrl()}/auth/login`, {
      data: { email: fixture.candidateA.email, password: fixture.password },
    });
    expect(login.status()).toBe(201);
    const token = (await login.json()).data.accessToken;
    expect(token).toBeTruthy();

    const response = await candidateContext.request.get(`${apiBaseUrl()}/applications/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.data).toEqual([
      expect.objectContaining({
        applicationId: fixture.candidateA.applicationId,
        screening: expect.objectContaining({
          // Prisma serialises Decimal(5,1) without a trailing zero.
          overallScore: String(reviewed.overall),
          skillsScore: String(reviewed.skills),
          aiRecommendation: 'interview',
        }),
      }),
    ]);

    const keys = payloadKeys(payload);
    expect(keys, 'Control: recursion must find overallScore inside the screening').toContain('overallScore');
    for (const forbidden of [
      'reviewedAt', 'reviewedById', 'reviewNote',
      'reviewedOverallScore', 'reviewedSkillsScore', 'reviewedExperienceScore', 'reviewedEducationScore',
    ]) {
      expect(keys, `Candidate payload must contain no ${forbidden} key at any depth`).not.toContain(forbidden);
    }
    expect(JSON.stringify(payload)).not.toContain(note());
  });
});
