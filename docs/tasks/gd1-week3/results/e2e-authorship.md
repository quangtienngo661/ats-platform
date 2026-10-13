# GĐ1 browser test authoring

Ngày: 2026-09-29. Nhánh: `feat/org-admin-enforcement`.

## Criteria → tests

- A1/A2: staff login org_admin; wrong staff role; scoped menus and deep links; refresh preserves route policy; guest cannot open recruiter-management/my-profile.
- A3/A7: platform admin creates org_admin through User UI with required Organization; reload persists User/org binding and organization labels on User/Department/AI pages.
- A4: org_admin without Recruiter creates recruiter account/profile through UI. Real DB verifies password hash and matching department/organization. Foreign department creates no User; duplicate email keeps exactly one User.
- A5: org_admin selects an in-scope owner to create a job manually, skips external AI, reloads and reads exact owner/department/organization/status from API. Foreign owner is rejected.
- A6: User/Organization profile works without Recruiter; real interview creation selects an organization recruiter.
- A7/A9: switching default in A preserves B default; foreign UUID reads fail with established 404/403 policy; platform admin reads both orgs; org_admin cannot assign global User.
- A3/A8: platform admin changes org binding through UI; old access token resolves fresh HTTP scope; prior refresh token is revoked. Socket revocation is covered by the main live probe, outside this suite.

Files: `apps/web/e2e/gd1-org-admin.e2e.ts` and `apps/web/e2e/support/gd1-fixtures.mjs`.

## Author-time execution

`node --check apps/web/e2e/support/gd1-fixtures.mjs`: exit 0.

`npx playwright test --config apps/web/playwright.config.ts gd1-org-admin.e2e.ts --list`: exit 0, eight Chromium tests in one file.

This only proves collection and syntax. Docker runtime was unavailable while these tests were authored. No browser RED/GREEN claim is made by this record; use the subsequent actual execution logs for runtime results.

## Fixture safety and execution

Use the existing five `WEB_E2E_*` admin/candidate/organization settings and `WEB_E2E_API_URL=http://localhost:55000/api` with `docker-compose.test.yml`. The suite itself creates two unique organizations and test-only related records in `ats_test` at port 55432, waits for the real Redis auth limiter to expire naturally, and never calls paid AI or email.

`afterAll` verifies owned organization IDs/slugs, deletes only this run's rows in a transaction, asserts zero owned organizations/users remain, and revokes the seeded platform-admin browser session. No volume reset or development database cleanup occurs.
