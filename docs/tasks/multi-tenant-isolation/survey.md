# Survey — Multi-tenant row-level isolation (GĐ1 module spec)

> Stage 1. What is there **now**. No live "Organization" system exists to observe — this module has
> never been built — so everything below is a source-level read of the CURRENT single-tenant system,
> not a runtime observation. Said plainly, per this template's own instruction.

**Date:** 2026-09-12 · **Surveyed by:** Explore agent (this harness's session has no `probe-readonly`
agent registered — `Explore`, a read-only search agent, is the closest substitute and was used for
the multi-file sweeps) + direct `Read`/`Grep` for single-file lookups (`schema.prisma`, `enums.ts`,
`notifications.service.ts`).

## What the change touches — the current single-tenant isolation mechanism

| Thing | `file:line` | What it does today |
|---|---|---|
| `schema.prisma` | `libs/backend/database/prisma/schema.prisma` (22 models total) | No `Organization`/`Tenant` model exists. `Department` (`:202`) is the top-level org-shaped entity; no `organizationId`/`tenantId` field anywhere in the schema. |
| `OwnershipGuard` | `apps/api/src/common/guards/resources.guard.ts:82-95` (case `'cv'`), `:113-122` (case `'application'`) | Recruiter may access a CV/application only if a non-cancelled application on it targets a job posting in the recruiter's own department. |
| `OwnershipGuard` dead branch | `resources.guard.ts:132-147` (case `'interview-schedule'`) | Checks `scheduledBy === userId`, but **no controller applies `@Resources('interview-schedule')`** — this branch is unreachable dead code. |
| `getRecruiterCandidateScope` / `assertCanViewCandidate` / `findAll` | `apps/api/src/app/candidates/candidates.service.ts:111-122, 124-148, 228-232` | Candidate detail/search is filtered to candidates who have a live application into the recruiter's own department. |
| `assertCanAccessDepartment` (central helper) | `apps/api/src/app/applications/applications.service.ts:131-150` | Reused by `assertCanAccessApplication`, `getAllKanbanBoard` (`:342`), `getKanbanBoard`, `getApplicationsByJob`, `getApplicationById`, `updateStatus`, `getApplicationHistory`, `triggerScreening`. The single most-reused boundary check in the codebase. |
| `assertCanScheduleApplication` / `assertCanUseInterviewer` / `assertCanViewSchedule` | `apps/api/src/app/interviews/interviews.service.ts:74-234` | Department-gate interview scheduling and viewing. `assertCanMutateSchedule` (`:236-261`) is **owner-only**, not department-scoped — an intentional narrower boundary for mutation. `getMySchedules` (`:300-358`, scope at `:321`) further narrows *list* access to `interviewerId===userId OR scheduledBy===userId` — a third, even narrower width for the same resource type. Three different boundary widths on one entity, by design or drift; not this module's job to reconcile. |
| `assertCanAccessJob` | `apps/api/src/app/cv-screenings/cv-screenings.service.ts:77-99` | Department-gates `getScreeningResult` and `getScreeningStats`. |
| `canJoinJobRoom` | `apps/api/src/common/socket-io/socket-io.service.ts:108-127` | Gates a Socket.IO client joining `job_<jobId>` to admins or recruiters in that job's department — **not a Prisma query**, a separate real-time surface. |

## Blast radius — surfaces that touch org-sensitive data with **zero** department scoping today

| Caller / consumer | `file:line` | How it would leak once `Organization` exists |
|---|---|---|
| `job-postings.service.ts` `findAll`/`findOne` | `apps/api/src/app/job-postings/job-postings.service.ts` (no department filter anywhere) | Any recruiter/admin can browse **draft/closed** postings org-wide today; the same code would let a recruiter browse another organization's postings tomorrow. `update`/`remove` are individual-ownership-gated only (via `OwnershipGuard`'s `job-posting` case), never department. |
| `recruiters.service.ts` `findAll`/`findOne` | `apps/api/src/app/recruiters/recruiters.service.ts:108-135` | Exposes every recruiter's profile (with linked `user`/`department`) to any recruiter/admin, across every department today — across every organization tomorrow. |
| `departments.service.ts` (all methods) | `apps/api/src/app/departments/departments.service.ts:17-109` | No scoping of any kind. Arguably fine today (Department is the top entity) — but once `Organization` sits above it, this file's CRUD must itself become org-scoped or one organization could read/edit another's departments. |

## Current behaviour, observed rather than read

No live run was performed for this survey — there is nothing running to observe, since the module
being specified does not exist yet. One exception worth recording: earlier in this same session, a
live PostgreSQL connection (`localhost:5432`, the project's dev container) was used to verify a data
migration (C-03's `scheduled_date`/`scheduled_time` → `start_at` backfill) — establishing that
`schema.prisma` and the actual database are in sync as of this session, which is why the schema read
above is trusted as ground truth rather than a stale file.

| Behaviour | How it was observed | Result |
|---|---|---|
| `notifications.service.ts` never lists notifications across users | Read `apps/api/src/app/notifications/notifications.service.ts:30-97` directly, this session | `findAll` (`:35`), `markAllAsRead` (`:81-82`) both hard-filter `where: { userId, ... }`; every method takes the caller's own `userId`, none accepts a cross-user query. No org column is structurally needed here (research.md #3). |

## What already exists that this should reuse

- **The `assertCanAccessDepartment` central-helper pattern** (`applications.service.ts:131-150`) —
  one function, six call sites — is the strongest existing template for how an org-scope check could
  be centralized later, whatever mechanism `build-feature` picks.
- **`OwnershipGuard` + `@Resources()` decorator pattern** (`resources.guard.ts`) — the existing
  per-resource-type switch is a reasonable place to add an org check alongside the department check,
  without inventing a new cross-cutting layer.
- **The data-preserving migration technique already proven twice on this codebase** (C-03's
  `scheduled_date`/`scheduled_time` → `start_at` backfill, C-04's dead-FK drop) — add-nullable →
  backfill → set-not-null, hand-authored SQL after `prisma migrate dev --create-only`. Directly
  reusable for the `organizationId` backfill this module's future migration will need.

## Addendum (2026-09-12, later in this session — not part of the original survey pass)

The original survey above did not check for existing Use Case documentation and should have —
`important-notes/mo_ta_use_case_ATS.md` and `important-notes/dac_ta_use_case_bo_sung_ATS.md` are
this project's own established UC documentation from ĐA1, directly relevant to this module's UC
section. Found only when the human asked for a deeper review of the drafted spec, not at Stage 1.
Recorded here honestly rather than silently folded into the section above as though it had always
been there — see `research.md` #4 and `decision.md`'s Reversals entry for what changed as a result.

## Open questions the survey could not settle

- **Exact `Organization` schema fields** (beyond needing an identity + name) — not derivable from
  the ĐA2 proposal or any existing code; carried into `module-spec-multi-tenant.md`'s ERD as an
  explicit `ASSUMPTION`, and into `plan.md`.
- **Whether a `Recruiter` can ever exist with no resolvable organization** mid-migration or on a
  data-integrity break — no current code path allows a recruiter without a department
  (`Recruiter.departmentId` is non-null), but the equivalent failure for `Department → Organization`
  is a new case this module introduces. Carried into the module spec as edge case E2.
