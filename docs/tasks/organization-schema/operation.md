# Operation — Organization schema (GĐ1 Tuần 1)

> How the change behaves end to end, **run rather than described**. A green suite is not
> this file: every suite in this project mocks Prisma, so nothing in it had ever touched the
> real database before these steps.

**Date:** 2026-09-13 · **Environment:** Docker `ats-postgres` (healthy), database `ats-db` at
`localhost:5432` · **Branch:** `feat/organization-tenant-schema` off `origin/dev` (`2ff5ba9`)

## The runtime surface this task has

Tuần 1 adds no endpoint and changes no response. Its runtime surface is **the migration itself** —
a one-time event against a populated database — plus the constraint the database enforces
afterwards. Both were exercised for real; neither is a UI journey, so there is no browser walk here.

## What was run, in order

| # | Step | Command | Result |
|---|---|---|---|
| 1 | Confirm the database is reachable | `docker ps` | `ats-postgres  Up  (healthy)`. An earlier attempt this session failed here — Docker was down, and the migration was **not** applied until the human started it |
| 2 | Apply the pending migration | `prisma migrate deploy` via an in-process URL rewrite (below) | `Applying migration '20260913042256_add_organization_tenant'` → *All migrations have been successfully applied.* 28 migrations found |
| 3 | Verify the backfill and the constraints | `node verify.js` → `results/migration-verification.md` | **ALL CHECKS PASS**, script exit code `0` |
| 4 | Check the schema and the database agree | `prisma migrate status` | *Database schema is up to date!* — no drift |

**`migrate deploy`, not `migrate dev`, and that was deliberate.** `deploy` applies pending
migrations and never resets or prompts; `dev` compares schema to database and can offer to reset on
drift, which is not something to hand a non-interactive session pointed at a database holding real
rows. The project's safety rules require asking before `migrate deploy` — the human authorised it in
this turn, and the target is the local Docker database, not a shared one.

**How the credential was handled.** `.env` is Read-denied and holds the real password; it also
points `DATABASE_URL` at the Docker-internal hostname `postgres`, which does not resolve from the
host. A small script loads `.env` through `dotenv` **in process**, rewrites only `url.hostname` to
`localhost`, and passes the result to Prisma through the child process's environment — never on a
command line, never printed. Prisma echoes `host:port` only, which is what step 2's output shows.

## What the migration did to real data

24 rows across the 9 org-scoped tables, all backfilled into one organization:

```
departments 1 · recruiters 3 · job_postings 2 · job_posting_skills 1 · applications 3
application_history 10 · cv_screenings 2 · ai_configs 1 · interview_schedules 1
```

Seed organization: `00000000-0000-4000-8000-000000000001` — *Công ty TNHH Tuyển dụng ATS*
(`ats-demo`). Exactly one exists.

## The negative cases, walked

Both were run inside a transaction and rolled back, so the database is unchanged by the probing.

| Case | What was tried | What happened |
|---|---|---|
| A write with no organization | `INSERT INTO departments (department_id, name) VALUES (…)` | **Rejected**: *null value in column "organization_id" … violates not-null constraint*. The boundary is enforced by the database, not by application code that could be bypassed |
| The previously-orphaned enum | Insert a real `candidate_skills` row with `source = 'cv_parsed'`, attached to an existing candidate and skill | **Accepted and read back**: `source = cv_parsed`. `candidate_skill_source` has sat in the schema with no model since before this task; it now has one |

## What was NOT exercised, and why

- **No API request was made against the migrated database.** `nx serve api` cannot boot on the host
  with the dev `.env` (Docker-internal hostnames), and rebuilding the API container to make one
  request would prove nothing this task claims: Tuần 1 changes no endpoint and no response shape.
  What *is* claimed — that behaviour is unchanged — is asserted by the suite matching its baseline
  exactly (182/182, 47/47 suites) rather than by a request.
- **No browser walk.** There is no user-visible change to look at. The browser belongs to Tuần 2,
  when the boundary starts refusing cross-organization requests.
- **The seed script was updated but not re-run.** `seed_departments.sql` now carries the seed
  organization's id on all 20 rows, because it lists columns explicitly and would otherwise fail
  against the NOT NULL column. Running it would insert 20 duplicate departments into a database that
  already has one seeded, so it was corrected and left unrun — an honest gap: the corrected file is
  reviewed, not executed.
