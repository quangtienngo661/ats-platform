// Browser -> real Next actions -> Nest -> isolated PostgreSQL. No API interception, no AI call.
// GĐ4 C13: on the Kanban, a recruiter applies one AI co-pilot suggestion and dismisses another.
// The fixture is GĐ3's: two applications at "screening", each AI-scored 73 against a threshold of 60,
// so each card suggests "Mời phỏng vấn".
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow, withDatabase } from './support/gd1-fixtures.mjs';
import {
  cleanupGd3ReviewFixtures,
  createGd3ReviewFixtures,
  readApplicationStatus,
} from './support/gd3-review-fixtures.mjs';

async function signInRecruiter(page: Page, email: string, password: string) {
  await page.goto('/sign-in/admin');
  await page.getByRole('button', { name: 'Recruiter', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

const decisionsOf = (applicationId: string) =>
  withDatabase(async (client: { query: (sql: string, values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }) =>
    (await client.query(
      'SELECT rule_id, decision FROM copilot_decisions WHERE application_id=$1 ORDER BY decided_at',
      [applicationId],
    )).rows);
const historyNotesOf = (applicationId: string) =>
  withDatabase(async (client: { query: (sql: string, values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }) =>
    (await client.query(
      'SELECT to_status, notes FROM application_history WHERE application_id=$1 ORDER BY changed_at',
      [applicationId],
    )).rows);

test.describe('GĐ4 — AI co-pilot trên Kanban', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Awaited<ReturnType<typeof createGd3ReviewFixtures>>;
  let context: BrowserContext;
  let page: Page;
  const card = (name: string) => page.locator('div.group').filter({ hasText: name }).last();

  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    if (!baseURL) throw new Error('The Playwright config must supply a local baseURL');
    await waitForAuthWindow();
    fixture = await createGd3ReviewFixtures(apiBaseUrl());
    context = await browser.newContext({ baseURL });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    try {
      if (fixture) {
        expect(await cleanupGd3ReviewFixtures(fixture)).toEqual({ organizationsRemaining: 0, usersRemaining: 0 });
      }
    } finally {
      await context?.close();
    }
  });

  test('C13: áp dụng "Mời phỏng vấn" chuyển thẻ sang Phỏng vấn và ghi lại quyết định', async () => {
    await signInRecruiter(page, fixture.recruiter.email, fixture.password);
    await page.goto(`/jobs/${fixture.job.id}/kanban`);

    await card(fixture.candidateA.name).getByRole('button', { name: 'Gợi ý: Mời phỏng vấn' }).click();
    const dialog = page.getByRole('dialog', { name: 'Gợi ý của AI co-pilot' });
    await expect(dialog.getByRole('list', { name: 'Lý do' })).toHaveText('Điểm sàng lọc 73 (AI), ngưỡng 60.');
    // Nothing moved by merely looking at the suggestion.
    expect(await readApplicationStatus(fixture.candidateA.applicationId)).toBe('screening');

    await dialog.getByRole('button', { name: 'Áp dụng', exact: true }).click();
    await expect(dialog).toBeHidden();

    await expect.poll(() => readApplicationStatus(fixture.candidateA.applicationId)).toBe('interview');
    expect(await historyNotesOf(fixture.candidateA.applicationId)).toContainEqual({
      to_status: 'interview',
      notes: 'Áp dụng gợi ý co-pilot: Mời phỏng vấn',
    });
    expect(await decisionsOf(fixture.candidateA.applicationId)).toEqual([
      { rule_id: 'invite_interview', decision: 'accepted' },
    ]);
    // Its next step is now the interview booking.
    await expect(card(fixture.candidateA.name).getByRole('button', { name: 'Gợi ý: Đặt lịch phỏng vấn' })).toBeVisible();
    // Control: the other application did not move.
    expect(await readApplicationStatus(fixture.candidateB.applicationId)).toBe('screening');
  });

  test('bỏ qua một gợi ý: thẻ không còn gợi ý đó, kể cả sau khi tải lại', async () => {
    await card(fixture.candidateB.name).getByRole('button', { name: 'Gợi ý: Mời phỏng vấn' }).click();
    const dialog = page.getByRole('dialog', { name: 'Gợi ý của AI co-pilot' });
    await dialog.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
    await expect(dialog).toBeHidden();

    await expect(card(fixture.candidateB.name).getByRole('button', { name: /^Gợi ý:/ })).toHaveCount(0);
    await page.reload();
    await expect(card(fixture.candidateB.name)).toBeVisible();
    await expect(card(fixture.candidateB.name).getByRole('button', { name: /^Gợi ý:/ })).toHaveCount(0);
    expect(await readApplicationStatus(fixture.candidateB.applicationId)).toBe('screening');
    expect(await decisionsOf(fixture.candidateB.applicationId)).toEqual([
      { rule_id: 'invite_interview', decision: 'dismissed' },
    ]);
  });
});
