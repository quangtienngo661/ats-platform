# Survey — Organization enforcement + org_admin tier (GĐ1 Tuần 2)

> What was there before this run changed anything. Read directly in this session (2026-09-16 →
> 09-18) by the main loop, not delegated to `probe-readonly` — stated so a reader knows the
> instrument. Built on Tuần 1 (`docs/tasks/organization-schema/`): `organizationId` already sits on
> the 9 org-scoped tables, and nothing filtered on it.

## How the caller reaches a service

| Fact | Where |
|---|---|
| `JwtStrategy.validate()` **already re-reads the user from the database on every request** (role, status), deliberately, so a stale token cannot keep old privileges | `apps/api/src/app/auth/strategies/jwt.strategy.ts` |
| The Socket.IO handshake **duplicates** that lookup rather than sharing it | `apps/api/src/common/socket-io/socket-io.service.ts`, `handleConnection` |
| Controllers pass `req.user['userId']`, `req.user['role']` to services as two separate arguments | every staff controller |
| `nestjs-cls` (AsyncLocalStorage) is installed and mounted — used **only** for the log correlation id | `apps/api/src/app/app.module.ts`, `common/logging/winston.config.ts` |

Consequence: resolving the caller's organization in `validate()` costs no extra round-trip and is
always fresh.

## The existing boundary — and why recruiters were already org-isolated

Every per-resource staff check had the same shape:

```
if (role === admin) return;            ← unconditional bypass
if (role !== recruiter) throw 403;
if (recruiterDept !== resourceDept) throw 403;
```

A department belongs to exactly one organization (`Department.organizationId` NOT NULL, Tuần 1).
So for a recruiter, "same department" already implied "same organization" — the 9 department checks
isolated recruiters by organization transitively. What was actually open:

### 12 places that special-case `admin`

`applications.service` (assertCanAccessDepartment) · `candidates.service` ×2 (assertCanViewCandidate,
findAll) · `cv-screenings.service` (assertCanAccessJob) · `interviews.service` ×4
(assertCanScheduleApplication, assertCanUseInterviewer, assertCanViewSchedule, assertCanMutateSchedule)
· `job-postings.controller` (canSeeUnpublished) · `resources.guard` (OwnershipGuard) · `roles.guard`
(the global bypass) · `socket-io.service` (canJoinJobRoom). Each is where an `org_admin` must NOT get
the platform admin's bypass.

### 29 `@Roles(UserRole.admin)` sites, 8 controllers

| Kind | Controllers | Count |
|---|---|---|
| Platform taxonomy / audit — org_admin must NOT enter | skills, job-categories, interview topics, ai-usage-logs | 13 |
| Organization-owned — org_admin enters, scoped | departments, recruiters, ai-config | 11 |
| Accounts | users | 5 |

### 4 gap surfaces with no scoping at all

job-postings browse (staff saw every department's drafts), recruiters directory, departments CRUD,
`canJoinJobRoom` (not a Prisma query — a query-level filter would never reach it).

## Defects found while surveying — not caused by Tuần 2, but blocking its claims

| # | Defect | Where | Proven |
|---|---|---|---|
| F1 | **Privilege escalation**: `PATCH /users/me` took the admin's `UpdateUserDto` (role, status) and forwarded it to the admin update path — any logged-in user, a candidate included, could send `{"role":"admin"}` | `users.controller.ts` updateMe → `users.service.ts` update | RED test run, `results/red-users-me-privilege-escalation.txt` (`Received: "admin"`) |
| F2 | `getAllKanbanBoard` filtered only when `role === recruiter`; any other staff role saw everything | `applications.service.ts` | by reading |
| F3 | `getMySchedules` narrowed only recruiters; any other staff role saw every schedule | `interviews.service.ts` | by reading |
| F4 | "Unset the previous default" ran `updateMany({ isDefault: true })` over the **whole table** — one organization choosing a default would clear every other organization's | `ai-config.service.ts` create/update/setDefault | by reading |
| F5 | "The default config" was `findFirst({ isDefault: true })` in 4 places — any organization's default | `cv-screenings.service` getActiveConfig, `applications.service` triggerScreening, `cv-screenings.processor`, `admin-seed.service` | by reading |
| F6 | `recruiters.service.update` wrote the DTO verbatim — moving a recruiter's department left its denormalised `organizationId` behind (the drift risk of Tuần 1's D3) | `recruiters.service.ts` | by reading |
| F7 | `job-postings.update` could hand a posting to a recruiter of another organization, moving its department but not its `organizationId` | `job-postings.service.ts` resolveOwnerDepartment | by reading |

F2–F7 only become cross-organization leaks once a second organization exists; F1 was exploitable
already, with one organization.

## Web (`apps/web`) — what the new role touches

| Fact | Where |
|---|---|
| Three `Record<UserRole, …>` maps would fail type-checking on a new role | `DepartmentDetailModal.tsx` ×2, `UserRow.tsx` |
| The route allowlist is `roleProtectedPaths[role] \|\| []` — an unknown role gets every private page redirected to `/403` | `apps/web/src/proxy.ts` |
| The department and AI-config create forms send no `organizationId` | `servers/departments/departments.action.ts`, `servers/ai-config/ai-config.action.ts` |
| `PATCH /users/me` is called with `{ fullName, phone }` — `phone`, not `phoneNumber`, so a profile update carrying a phone number was already a 400 under `forbidNonWhitelisted` | `servers/users/users.action.ts` |
