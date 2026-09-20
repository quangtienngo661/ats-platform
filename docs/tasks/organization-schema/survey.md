# Survey — Organization schema (GĐ1 Tuần 1)

> Stage 1. What is there **now**. Every line below was read or run in this session (2026-09-12/13),
> not carried from an earlier summary.

**How this survey was run — stated honestly.** Read directly by the main loop (`Read`/`Grep`/`Bash`),
**not** delegated to `probe-readonly`. Nothing was edited during it. The reason to say so: the skill's
default is the read-only agent, and a reader should know which instrument produced these lines.

## Schema — `libs/backend/database/prisma/schema.prisma` (read in full, 563 lines)

**22 models. No `Organization`. No `Tenant`. No `CandidateSkill`.** Clean slate.

| Fact | Where |
|---|---|
| `enum UserRole { candidate, recruiter, admin }` — exactly 3 values | `schema.prisma:18-24` |
| `enum CandidateSkillSource { cv_parsed, manual }` exists with **no model using it** — orphaned | `schema.prisma:127-132` |
| `Department` is a **flat root**: `departmentId, name, description, color, createdAt`. No column points upward | `schema.prisma:202-213` |
| `Recruiter.departmentId` is **non-null** (`String`, not `String?`), with a standing `// TODO: consider making departmentId nullable` immediately above the model | `schema.prisma:238-242` |
| `AiConfig` has **no** `departmentId` and no parent relation — its only relation is `screenings CVScreening[]` | `schema.prisma:426-439` |
| The comment banner `// ORGANIZATION` sits above `model Department` — a header, not a model | `schema.prisma:198-202` |

### The 9 org-scoped tables and the path each one backfills along

Established by reading each model's FKs. With a **single** seed organization the write is uniform
(every row gets the same id); these paths are what the post-migration **verification** must walk,
because `decision.md` D3 of the spec denormalises `organizationId` onto children rather than deriving
it by join.

```
Organization (seed, 1 row)
 ├─ Department ....................... assigned directly (root; schema.prisma:202)
 │    ├─ Recruiter ................... via department_id      (:242)
 │    └─ JobPosting .................. via department_id      (:283)
 │         ├─ JobPostingSkill ........ via job_id             (:307)
 │         └─ Application ............ via job_id             (:363)
 │              ├─ ApplicationHistory  via application_id     (:382)
 │              ├─ CVScreening ....... via application_id     (:403)
 │              └─ InterviewSchedule . via application_id     (:527)
 └─ AiConfig ......................... NO parent path (:426) — assigned by fiat
```

`AiConfig` is the single exception: 8 of 9 tables hang off `Department`, it does not.

**Consequence for `AiConfig.isDefault` (`:430`)** — today it means "the one global default screening
config"; per-org it becomes "the default within an organization". Nothing enforces single-default
today either, so this module makes a pre-existing looseness *visible* without making it worse. Not a
new defect; recorded so nobody reads it as one later.

## Authorization — where the two admin tiers actually land

```
RolesGuard.canActivate()          apps/api/src/common/guards/roles.guard.ts
  const requiredRoles = reflector.getAllAndOverride(ROLES_KEY, …)   :11
  if (!requiredRoles) return true;                                  :16
  if (user.role === UserRole.admin) return true;   ← unconditional bypass, BEFORE the check   :22
  if (!requiredRoles.includes(user.role)) throw ForbiddenException  :26
```

**`roles.guard.ts:22` is the single line that encodes "admin sees everything".** Under the spec's
Scope A it has to become tier-aware: `platform-admin` keeps the bypass, `org-admin` must fall through
to `:26` and then be organization-filtered downstream. This is the line the three `decision.md` D4
options of the spec differ over — not the storage column.

`RolesGuard` imports `UserRole` from `@ats-platform/database` (`:1`), not `@ats-platform/types`.

### Decorator surface (counted this session, `apps/api/src/app/**/*.controller.ts`)

| Count | What |
|---|---|
| **82** | `@Roles(...)` sites across **14** controllers |
| **29** | of those are `@Roles(UserRole.admin)` — admin-only — across **8** controllers |

The 29 are the per-site decisions Scope A forces: `skills` / `job-categories` are platform-wide
taxonomy (an `org-admin` must **not** get in); `departments` / `recruiters` / `ai-config` are the
organization's own (an `org-admin` gets in, but organization-filtered).

## Shared enum mirror — manual, with no CI check

| Fact | Where |
|---|---|
| `UserRole` is hand-duplicated as a const object, 3 values, mirroring the Prisma enum | `libs/shared/types/src/lib/enums.ts:5-10` |
| `export { UserRole as Role }` — a backward-compat alias, so every consumer spelled `Role` follows any change automatically | `libs/shared/types/src/lib/enums.ts:158` |
| `CandidateSkillSource` is **not** mirrored in `enums.ts` at all (grep found no occurrence) — the orphan extends to the types lib | `enums.ts` (absence) |
| Sync is manual and **nothing in CI checks it** | `libs/CLAUDE.md` §4, §5 |

## Migrations

7 applied migrations, `YYYYMMDDHHMMSS_snake_case`. The two most recent are this project's own
pre-window work: `20260830074913_drop_interview_schedule_session_fk` (C-04) and
`20260830100000_change_schedule_to_start_at_duration` (C-03).

## Git topology (run this session)

| Fact | Value |
|---|---|
| Current branch | `fix/interview-schedule-start-at` |
| vs `origin/dev` (`git rev-list --left-right --count origin/dev...HEAD`) | `3  0` — **3 behind, 0 ahead**: fully merged, nothing unique left |
| Working tree | one untracked path, `docs/tasks/` (the spec artefacts from the `write-spec` run) |

**Consequence:** this branch is stale. GĐ1 Tuần 1 cuts a fresh branch from `origin/dev`.
