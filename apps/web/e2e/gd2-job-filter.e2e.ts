// GĐ2 week 1, slice 3: a visitor filters the public job board by salary and skills from
// the "Bộ lọc" panel, and picks a work type on the home page. Postings, skills and the
// one draft that must never show are inserted by the fixture; every search carries the
// run's token so other data in the test database cannot change the result.
// Browser → real Next actions → Nest → isolated PostgreSQL. No API interception. No login.
import { expect, test, type Page } from '@playwright/test';
import { apiBaseUrl } from './support/local-target';
import { cleanupGd2JobFilterFixtures, createGd2JobFilterFixtures } from './support/gd2-fixtures.mjs';

type Fixture = Awaited<ReturnType<typeof createGd2JobFilterFixtures>>;

async function openFilters(page: Page) {
  const toggle = page.getByRole('button', { name: 'Bộ lọc', exact: true });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

async function expectPostings(page: Page, fixture: Fixture, shown: (keyof Fixture['jobs'])[]) {
  for (const [key, job] of Object.entries(fixture.jobs) as [keyof Fixture['jobs'], Fixture['jobs'][keyof Fixture['jobs']]][]) {
    const heading = page.getByRole('heading', { name: job.title, exact: true });
    if (shown.includes(key)) await expect(heading).toBeVisible();
    else await expect(heading).toHaveCount(0);
  }
}

test.describe('GĐ2 tuần 1 — lọc tìm việc', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: Fixture;

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    fixture = await createGd2JobFilterFixtures(apiBaseUrl());
  });

  test.afterAll(async () => {
    if (fixture) {
      expect(await cleanupGd2JobFilterFixtures(fixture)).toEqual({
        organizationsRemaining: 0, skillsRemaining: 0, usersRemaining: 0,
      });
    }
  });

  test('C11/C13: the salary range in the URL and on the page, bounds included, draft never shown', async ({ page }) => {
    await page.goto(`/job-postings?q=${fixture.token}`);
    await expectPostings(page, fixture, ['one', 'two', 'three', 'four']);

    await openFilters(page);
    await page.getByRole('textbox', { name: 'Từ', exact: true }).fill('12.000.000');
    await page.getByRole('textbox', { name: 'Từ', exact: true }).press('Enter');
    await expect(page).toHaveURL(/salaryMin=12000000/);
    await expectPostings(page, fixture, ['one', 'two']);

    await openFilters(page);
    await page.getByRole('textbox', { name: 'Từ', exact: true }).fill('');
    await page.getByRole('textbox', { name: 'Đến', exact: true }).fill('9.000.000');
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
    await expect(page).toHaveURL(/salaryMax=9000000/);
    await expect(page).not.toHaveURL(/salaryMin=/);
    await expectPostings(page, fixture, ['three']);
  });

  test('C13/E15: a minimum above the maximum stays on the page with a message', async ({ page }) => {
    await page.goto(`/job-postings?q=${fixture.token}`);
    await openFilters(page);
    await page.getByRole('textbox', { name: 'Từ', exact: true }).fill('20.000.000');
    await page.getByRole('textbox', { name: 'Đến', exact: true }).fill('10.000.000');
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();

    // Scoped to the salary group: Next's own route announcer is also a role=alert.
    await expect(page.getByRole('group', { name: 'Mức lương (VNĐ)' }).getByRole('alert')).toHaveText('Mức lương tối thiểu không thể lớn hơn mức lương tối đa');
    await expect(page).not.toHaveURL(/salaryMin=/);
  });

  test('C12/C13: skills match any, the options come from active postings only', async ({ page }) => {
    await page.goto(`/job-postings?q=${fixture.token}`);
    await openFilters(page);
    await expect(page.getByRole('button', { name: fixture.skills.a.name, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: fixture.skills.b.name, exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: fixture.skills.a.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`skillIds=${fixture.skills.a.id}`));
    await expectPostings(page, fixture, ['one', 'three']);

    await openFilters(page);
    await page.getByRole('button', { name: fixture.skills.c.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`skillIds=${fixture.skills.c.id}`));
    await expectPostings(page, fixture, ['one', 'two', 'three']);
    await expect(page.getByRole('button', { name: fixture.skills.a.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('C13/E17: a link with a bad filter still opens, and "Xóa bộ lọc" clears the new filters', async ({ page }) => {
    await page.goto(`/job-postings?q=${fixture.token}&salaryMin=abc&skillIds=khong-phai-uuid`);
    await expectPostings(page, fixture, ['one', 'two', 'three', 'four']);

    await page.goto(`/job-postings?q=${fixture.token}&salaryMin=12000000&skillIds=${fixture.skills.a.id}`);
    await expectPostings(page, fixture, ['one']);
    await openFilters(page);
    await expect(page.getByRole('textbox', { name: 'Từ', exact: true })).toHaveValue('12.000.000');
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
    await expect(page).toHaveURL(/\/job-postings$/);
  });

  test('C12: the public filter options list active skills by name and never the draft\'s', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl()}/job-postings/filter-options`);
    expect(response.status()).toBe(200);
    const skills = (await response.json()).data.skills as { skillId: string; name: string }[];
    const ids = skills.map((skill) => skill.skillId);
    expect(ids).toContain(fixture.skills.a.id);
    expect(ids).toContain(fixture.skills.c.id);
    expect(ids).not.toContain(fixture.skills.b.id);
    expect(ids.indexOf(fixture.skills.a.id)).toBeLessThan(ids.indexOf(fixture.skills.c.id));
  });

  test('C14: the home page picks a work type and the job search receives it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/Địa điểm/)).toHaveCount(0);

    await page.getByRole('textbox', { name: 'Tìm việc theo từ khóa', exact: true }).fill(fixture.token);
    await page.getByRole('combobox', { name: 'Hình thức làm việc', exact: true }).selectOption('hybrid');
    await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();

    await expect(page).toHaveURL(/locationType=hybrid/);
    await expectPostings(page, fixture, ['three']);
  });

  test('the filter panel does not overflow a phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/job-postings?q=${fixture.token}`);
    await openFilters(page);
    await expect(page.getByRole('textbox', { name: 'Từ', exact: true })).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});
