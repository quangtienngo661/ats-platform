# Spec — Organization enforcement + org_admin tier (GĐ1 Tuần 2)

> Derived from `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` (the GĐ1 SRS), whose
> criteria are the input. Tuần 1 delivered its criterion 4 (migration) — this run delivers the rest.

**Scope:** feature — enforcement of the organization boundary across the existing API, plus the
`org_admin` tier and an `organizations` module. Response shapes unchanged (see `decision.md` D9).

## Acceptance criteria → the test that proves each

Every row below is a **unit test with Prisma mocked** — the only automated level this repository
has (no test starts a real database). The row it leaves open, real HTTP against a real database,
is the operation walk (`operation.md`).

| Criterion (module spec) | Proved by |
|---|---|
| **1** — staff lists return only their organization's rows | `applications.service.spec` (kanban, recruiter + org_admin) · `recruiters.service.spec` (directory) · `departments.service.spec` · `ai-config.service.spec` · `job-postings.service.spec` (staff listing) · `candidates.service.spec` (org_admin search) · `interviews.service.spec` (my schedules) |
| **2** — a resource by id in another organization is refused; so is its socket room | `applications.service.spec` (getApplicationById, org_admin + recruiter) · `resources.guard.spec` (job-posting, application, cv) · `job-postings.service.spec` (same 404 as missing) · `departments.service.spec` · `recruiters.service.spec` · `cv-screenings.service.spec` · `interviews.service.spec` (schedule, scheduling) · `socket-io.service.spec` (join_job_room ×6) |
| **3** — one candidate, applications in two organizations, each scoped | `applications.service.spec` "stamps each application with its job's organization" |
| **5** — AI configs are per organization | `ai-config.service.spec` (create, scoped default clearing, reads) · `cv-screenings.service.spec` (default is the application's organization's; another organization's config id is not found) |
| **6a** — the platform admin sees every organization | "every organization … for a platform admin" rows in applications, recruiters, departments, ai-config, job-postings, interviews, cv-screenings specs · `tenant-caller.spec` |
| **6b** — an org_admin sees its own organization only, across departments | org_admin rows in the same specs · `roles.guard.spec` (org_admin inherits recruiter routes, never the platform bypass) |
| **7** — a department's organization comes from its creator; a platform admin must name one | `departments.service.spec` "create — criterion 7" ×7 · `tenant-caller.spec` resolveWriteOrganization |
| **E1** — the previously unscoped surfaces refuse like everything else | `recruiters.service.spec` (directory) · `departments.service.spec` · `job-postings.service.spec` · `socket-io.service.spec` |
| **E2** — staff with no resolvable organization fail closed | `tenant-caller.spec` · E2 rows in applications, departments, recruiters, job-postings, resources.guard specs · `jwt.strategy.spec` (null reaches the services) |

## Added by findings during the run (`survey.md` F1–F7)

| Finding | Proved by |
|---|---|
| **F1** privilege escalation via `PATCH /users/me` | `users.service.spec` — RED first (`results/red-users-me-privilege-escalation.txt`), then GREEN; boundary tests with the real `ValidationPipe` config reject role / status / email / organizationId |
| F4 default config cleared across organizations | `ai-config.service.spec` "unsets the previous default of THAT organization only" |
| F5 default config from any organization | `cv-screenings.service.spec`; `applications.service.spec` asserts the global lookup is gone |
| F6 recruiter moved, organization left behind | `recruiters.service.spec` "moves the organization together with the department" |
| F7 posting handed across organizations | `job-postings.service.spec` "refuses to hand a posting to a recruiter in another organization" |
| org_admin binding (D7) | `users.service.spec` "org_admin binding" ×9 |
| organizations module (D8) | `organizations.service.spec` |

## Teeth — each boundary broken on purpose, test watched fail, then restored

| Broken on purpose | Tests that failed |
|---|---|
| RolesGuard gives org_admin the platform bypass | 1 |
| `assertOrganizationAccess` stops comparing organizations | 10 |
| default-clearing forgets the organization (the old global `updateMany`) | 2 |
| `UpdateMeDto` widened back to the admin DTO | 3 |
| an application stamped with a fixed organization instead of its job's | 1 |

## Not covered by any automated test — stated, not implied

- **Real HTTP against a real database with two organizations.** Pending the operation walk.
- **A browser journey for an org_admin.** No surface exists: `apps/web/src/proxy.ts` sends an
  unknown role to `/403` on every private page, and org-aware UI is Tuần 3. Criteria 1/2/6b are
  therefore proved at API level only; the browser gap is recorded here rather than demoted silently.
- **The platform admin's organization picker (`decision.md` D10).** `apps/web` has no test runner, so
  it is proved by the production build's TypeScript pass only — shown to have teeth by an injected
  type error in `department-management/page.tsx` failing the build (TS2322), then reverted. That
  proves the props line up, not that the form behaves; the browser check is `plan.md` step 3.
