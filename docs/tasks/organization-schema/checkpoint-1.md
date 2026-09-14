# Checkpoint 1 — Organization schema (GĐ1 Tuần 1)

**Date:** 2026-09-13 · **Stops before:** writing the plan, and therefore before any schema edit.
Performed as an `AskUserQuestion` tool call, not a prose heading.

## What was put to the human

Two questions, both opened by findings the survey produced.

### Q1 — where the `org-admin` binding lands

`UserRole.org_admin` + nullable `User.organizationId` had already been chosen as the *shape*
(`decision.md` D1). The open question was the *timing*, and it only became a real question once that
shape was chosen — see the reversal note below.

| Option | What it means | Cost |
|---|---|---|
| **Split — Tuần 1 is `Organization` only** | The binding becomes a small separate migration at the head of Tuần 2, committed with the `RolesGuard` change that reads it | Two migrations instead of one |
| Bundle — one migration for everything | Tuần 2 opens with the schema already complete | `UserRole.org_admin` exists for a week with no code handling it; `roles.guard.ts:22` hard-codes `admin`, so 29 `@Roles(UserRole.admin)` sites would silently 403 any org-admin — a wrong state no test catches |

### Q2 — the seed organization's identity

Raised because module spec criterion 4 carried it as an unresolved `ASSUMPTION`.

| Option | What it means |
|---|---|
| **A demo company identity** | `name = "Công ty TNHH Tuyển dụng ATS"`, `slug = "ats-demo"` — reads as a real tenant when isolation is demonstrated against a second organization |
| A neutral placeholder | `"Tổ chức mặc định"`, `slug = "default"` — honest about being a backfill bucket, weaker in a demonstration |

## What they answered

- Q1 — **"Tách — Tuần 1 chỉ Organization (khuyến nghị)"**
- Q2 — **"Tên doanh nghiệp demo (khuyến nghị)"**

Both verbatim selections. The `org-admin` *shape* (option 1 of the spec's D4) had been confirmed by
the human immediately before this checkpoint, in their own message.

## A claim reversed before the question was asked

Q1 exists because an earlier claim in this session was wrong, and the correction changed what was
worth asking. The claim was that the `org-admin` binding **had** to be in Tuần 1's migration,
otherwise a second migration would re-touch tables the first had just migrated. That holds for the
`Recruiter.isOrgAdmin` option — `Recruiter` is one of the 9 org-scoped tables — and **not** for the
option actually chosen, which puts the column on `User`, a global table Tuần 1 never touches. Once
the shape was settled, the bundling argument collapsed and the timing became a genuine choice with a
real cost on each side. Recorded here because the question would not have been asked at all if the
original claim had gone unchecked.

## What changed as a result

- Tuần 1's migration is **`Organization` + the 9 tables + `CandidateSkill` + backfill only** — no
  role enum, no `User` column (`decision.md` D2).
- The seed organization has a fixed identity and a fixed literal UUID, closing the module spec's
  standing `ASSUMPTION` on criterion 4 (`decision.md` D3).
- `spec.md`'s criteria and the plan's coverage matrix were both written against the split scope, not
  edited into it afterwards.

## State at this checkpoint

| | |
|---|---|
| Suite | Not run yet — no code has changed. Baseline to match is the last recorded green run: test 182 · lint 0 · build 4/4 (`context.md` §6, 2026-08-30) |
| Branch | `fix/interview-schedule-start-at` — **stale**: `0 ahead, 3 behind origin/dev`. A fresh branch off `origin/dev` is the plan's first step |
| Artefacts so far | `survey.md` · `research.md` · `decision.md` · `spec.md` · this checkpoint. `plan.md` follows `ExitPlanMode` |
| Known blocker | **Docker is not running** (`research.md` #3) — `docker ps` fails, so no migration can be applied yet. Authoring the schema and the SQL does not need it |
