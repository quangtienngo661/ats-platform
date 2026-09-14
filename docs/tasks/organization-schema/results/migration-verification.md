# Migration verification — real output

> Produced by running SQL against the **live local database** after
> `prisma migrate deploy` applied `20260913042256_add_organization_tenant`.
> Not a description of what should happen — this is the output.
>
> **Date:** 2026-09-13 · **Database:** `ats-db` on `localhost:5432` (Docker `ats-postgres`,
> healthy) · **Script exit code: 0**
>
> Why this file exists rather than a test: this project has no service-level test
> infrastructure — `apps/api`'s jest mocks Prisma entirely, so no test process anywhere
> starts a real database (`spec.md`, *How these are tested*). Criteria 1, 2, 5 and 6 are
> assertions about data in a real database and cannot be proved at any level this
> repository currently has.

## Criterion 1 — no row left with a null organization_id

| table | rows | null org_id | verdict |
|---|---:|---:|---|
| `departments` | 1 | 0 | PASS |
| `recruiters` | 3 | 0 | PASS |
| `job_postings` | 2 | 0 | PASS |
| `job_posting_skills` | 1 | 0 | PASS |
| `applications` | 3 | 0 | PASS |
| `application_history` | 10 | 0 | PASS |
| `cv_screenings` | 2 | 0 | PASS |
| `ai_configs` | 1 | 0 | PASS |
| `interview_schedules` | 1 | 0 | PASS |

## Criterion 2 — no child disagrees with its parent

| child | parent | disagreements | verdict |
|---|---|---:|---|
| `recruiters` | `departments` | 0 | PASS |
| `job_postings` | `departments` | 0 | PASS |
| `job_posting_skills` | `job_postings` | 0 | PASS |
| `applications` | `job_postings` | 0 | PASS |
| `application_history` | `applications` | 0 | PASS |
| `cv_screenings` | `applications` | 0 | PASS |
| `interview_schedules` | `applications` | 0 | PASS |

## The seed organization

| organization_id | name | slug |
|---|---|---|
| `00000000-0000-4000-8000-000000000001` | Công ty TNHH Tuyển dụng ATS | `ats-demo` |

Exactly one organization: **PASS** (1 found)

## Criterion 5 — a null organization_id is rejected by the database

```
INSERT INTO departments (department_id, name) VALUES (gen_random_uuid(), 'verify-probe');
-> REJECTED: null value in column "organization_id" of relation "departments" violates not-null constraint
```

Verdict: **PASS** (rolled back either way)

## Criterion 6 — candidate_skills exists and its enum column works

- `candidate_skills` is queryable — 0 rows
- `candidate_skill_source` accepts: `cv_parsed, manual`
- real insert probe: inserted and read back: source = cv_parsed (rolled back)

## Overall: **ALL CHECKS PASS**

## Edge case E1 — the migration is replayed

Run after the checks above, against the already-migrated database:

```
$ prisma migrate deploy
28 migrations found in prisma/migrations
No pending migrations to apply.

$ SELECT count(*) FROM organizations;
organizations: 1
```

Prisma's `_prisma_migrations` ledger stops the replay before any SQL runs, so the fixed-UUID
`INSERT` cannot produce a second seed organization. **PASS.**
