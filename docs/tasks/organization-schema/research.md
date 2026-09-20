# Research — Organization schema (GĐ1 Tuần 1)

> Stage 2. Only the claims a design decision rests on. **documented** = read in an official source.
> **verified** = run or read here, this session. Never both in one sentence.

**Date:** 2026-09-13

## Findings

| # | Claim | Marker | Source / command | Result |
|---|---|---|---|---|
| 1 | Prisma **cannot** auto-generate a migration that adds a `NOT NULL` column to an already-populated table — the backfill step has to be authored by hand, as expand → backfill → contract. | verified | `cat libs/backend/database/prisma/migrations/20260830100000_change_schedule_to_start_at_duration/migration.sql` this session | The migration exists on disk and states the reason in its own header comment, then demonstrates the three steps: `ADD COLUMN` nullable → `UPDATE … WHERE … IS NULL` → `ALTER COLUMN … SET NOT NULL`. This is the exemplar Tuần 1's migration follows, on the same codebase, already applied once. |
| 2 | A fully-offline migration can still be produced without any reachable database: `prisma migrate diff --from-schema-datamodel … --to-schema-datamodel … --script`. | documented | `libs/CLAUDE.md` §6 + project brain §5 (`[V 2026-08-30]`), read this session | Named as the fallback for exactly this case. **Not run here** — it is the contingency if Docker stays down, and this row is honest that it is a documented path, not one exercised in this session. |
| 3 | Docker is **not currently running** on this machine, so no `migrate dev` can reach a database right now. | verified | `docker ps` this session | `error during connect: … open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.` Material for Stage 4 only — it does not block authoring the schema or the SQL. |
| 4 | After a schema change, `prisma generate --config libs/backend/database/prisma.config.ts` fails on the host with `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`; the CI form `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma` works offline. And `tsc --build` keeps a **stale** compiled generated client under `dist/out-tsc/libs/backend/database/**`, producing phantom type errors that match the *old* schema while jest (ts-jest, reads source) stays green. | verified | Project brain §5, `[V 2026-08-30]` — established by running both, earlier in this same working period | Carried forward as an operating constraint, not re-run today. Marked `verified` because it was run here; the date it was run is stated rather than implied. Fix for the stale build: `rm -rf dist .nx/cache`. |
| 5 | The three candidate enforcement mechanisms (Prisma client extension `$extends` mutating `args.where`; Postgres RLS + `set_config` + `CREATE POLICY`; the existing manual per-query pattern) are all documented and all remain viable. | documented | `docs/tasks/multi-tenant-isolation/research.md` #1-2 (fetched via context7 from `/prisma/web` earlier this session) | **Not re-fetched.** Cited by reference rather than duplicated. Relevant to Tuần 1 only in the negative: see *What was NOT established*. |

## What was NOT established

- **Whether Postgres RLS will be the enforcement mechanism.** Deliberately still open — it is
  `build-feature`'s Tuần 2 choice, and Tuần 1 does not need it decided. **Correcting a claim made
  earlier in this session:** the mechanism was described as something that "must be settled before the
  migration is written". It does not. `CREATE POLICY` statements are per-table DDL and can land in
  their own later migration, after the columns exist. What RLS *would* need with lead time is an infra
  check — the database role the application connects as must not own the tables, or the policy is
  bypassed — and that is a `docker-compose`/env question, not a migration-content one.
- **Row counts in the live database.** Docker is down (#3), so the *volume* the backfill will touch is
  unknown. The backfill's *shape* does not depend on it: with one seed organization every row in a
  table receives the same id, so the statement is `UPDATE <t> SET organization_id = '<seed>'`
  regardless of whether the table holds 1 row or 100,000.
