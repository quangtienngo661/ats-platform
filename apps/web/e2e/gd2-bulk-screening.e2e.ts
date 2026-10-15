// Browser → real Next actions → Nest → isolated PostgreSQL. No API interception.
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';
import { apiBaseUrl } from './support/local-target';
import { waitForAuthWindow, withDatabase } from './support/gd1-fixtures.mjs';
import {
  createGd2BulkFixtures,
  cleanupGd2BulkFixtures,
} from './support/gd2-bulk-fixtures.mjs';

const apiUrl = apiBaseUrl(); // WEB_E2E_API_URL, restricted to the test API on port 55000.
// Copy the CSV contract; the web E2E must not import the API service.
const EXPORT_HEADERS = [
  'Mã đơn',
  'Họ tên',
  'Trạng thái',
  'Ngày nộp',
  'Chức danh hiện tại',
  'Số năm kinh nghiệm',
  'Trạng thái sàng lọc',
  'Điểm tổng (gợi ý AI)',
  'Điểm kỹ năng',
  'Điểm kinh nghiệm',
  'Điểm học vấn',
  'Gợi ý AI',
  'Kỹ năng khớp',
  'Kỹ năng thiếu',
] as const;
const expectedHeader = EXPORT_HEADERS.map((header) => `"${header}"`).join(',');

test.describe.serial('GĐ2 SP2 — chấm hàng loạt và xuất CSV', () => {
  test.describe.configure({ retries: 0 });
  let fixture: Awaited<ReturnType<typeof createGd2BulkFixtures>>;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await waitForAuthWindow();
    fixture = await createGd2BulkFixtures(apiUrl);
  });

  test.afterAll(async () => {
    if (fixture) {
      expect(await cleanupGd2BulkFixtures(fixture)).toEqual({
        organizationsRemaining: 0,
        usersRemaining: 0,
      });
    }
  });

  test('C16: recruiter queues one applied application, sees the completed skip, and downloads CSV', async ({ page }) => {
    await page.goto('/sign-in/admin');
    await page.getByRole('button', { name: 'Recruiter', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(fixture.recruiter2.email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(fixture.password);
    await page.getByRole('button', { name: 'Đăng nhập với tư cách Recruiter', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/jobs/${fixture.jobB.id}/candidates`);
    // Fixtures store names as `Bulk candidate ${index + 1} ${runId.slice(0, 8)}`,
    // but do not return them. Job B owns exactly two rows, so select in row order.
    // Scope to candidate rows to exclude the "Chọn tất cả" header checkbox.
    const candidateRows = page.getByRole('row').filter({
      has: page.getByRole('checkbox', { name: /^Chọn Bulk candidate \d+ / }),
    });
    await expect(candidateRows).toHaveCount(2);
    await candidateRows.nth(0).getByRole('checkbox', { name: /^Chọn Bulk candidate \d+ / }).check();
    await candidateRows.nth(1).getByRole('checkbox', { name: /^Chọn Bulk candidate \d+ / }).check();
    await page.getByRole('button', { name: 'Chấm AI (2 đã chọn)', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Chấm CV hàng loạt', exact: true });
    await dialog.getByRole('checkbox', {
      name: "Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm",
      exact: true,
    }).check();
    await dialog.getByRole('button', { name: 'Bắt đầu chấm', exact: true }).click();
    await expect(dialog.getByText('Đã đưa 1 đơn vào hàng đợi', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Đã có kết quả sàng lọc')).toBeVisible();

    const applications = await withDatabase(async (client: PoolClient) => (await client.query(
      'SELECT status FROM applications WHERE application_id=$1 AND job_id=$2 AND organization_id=$3',
      [fixture.jobB.appliedId, fixture.jobB.id, fixture.org.id],
    )).rows);
    expect(applications).toEqual([{ status: 'screening' }]);

    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(dialog).toBeHidden();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất CSV', exact: true }).click();
    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const body = await readFile(downloadPath!);
    expect(Array.from(body.subarray(0, 3))).toEqual([0xEF, 0xBB, 0xBF]);
    const text = body.toString('utf8').replace(/^\uFEFF/, '');
    expect(text.split('\r\n')[0]).toBe(expectedHeader);
    for (const email of fixture.candidateEmails) expect(text).not.toContain(email);
  });
});
