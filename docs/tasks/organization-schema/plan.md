# GĐ1 Tuần 1 — Organization schema + row-level tenant columns

## Context

ĐA2 GĐ1 (07–27/09/2026) requires a multi-tenant row-level architecture: `organizationId` on every
org-scoped table, filtered on every query, tenant-aware auth. The specification for the whole module
is already written and approved (`docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md`) —
this run implements **only its data model**, which is Tuần 1.

**The deliverable is one migration that changes no observable behaviour.** After it, the columns
exist and nothing filters on them yet. That is deliberate: schema and enforcement land as two
separate deploys, so if Tuần 2's guard work goes wrong, Tuần 1 sits inert rather than half-enforcing
a boundary. Enforcement, the `org-admin` tier and the guard changes are all Tuần 2.

Artefacts already written this run: `survey.md` · `research.md` · `decision.md` (D1-D3) · `spec.md` ·
`checkpoint-1.md`, all under `projects/ats-platform/docs/tasks/organization-schema/`.

## Steps

| # | Step | Files | Rests on |
|---|---|---|---|
| 1 | Cut a fresh branch `feat/organization-tenant-schema` from `origin/dev`. The current branch is merged and stale | — | `survey.md` (git topology: `0 ahead, 3 behind origin/dev`) |
| 2 | Add `model Organization` — `organizationId` PK, `name`, `slug` (**`@unique`**), `createdAt`; `@@map("organizations")` | `schema.prisma` | Module spec ERD (fields taken from it verbatim; `@unique` on `slug` is the one addition — a slug that is not unique is not an identifier) |
| 3 | Add `organizationId String @map("organization_id")` + relation to **all 9** org-scoped tables: `Department`, `Recruiter`, `JobPosting`, `JobPostingSkill`, `Application`, `ApplicationHistory`, `CVScreening`, `AiConfig`, `InterviewSchedule`. Index each | `schema.prisma` | Module spec Scope + `decision.md` D3 of the spec (denormalise onto children, do not derive by join) |
| 4 | Add `model CandidateSkill` — `candidateSkillId` PK, `candidateId` FK, `skillId` FK, `source CandidateSkillSource`, `@@unique([candidateId, skillId])`, `@@map("candidate_skills")`. Add back-relations on `Candidate` and `Skill` | `schema.prisma` | Module spec Scope; `survey.md` (the `CandidateSkillSource` enum has sat orphaned at `schema.prisma:127` — this is the model it was written for). `@@unique` mirrors the existing `JobPostingSkill` pattern (`:314`) |
| 5 | Hand-author the migration (see SQL shape below). `migrate dev` **cannot** generate it — adding NOT NULL to populated tables needs a backfill | `prisma/migrations/<ts>_add_organization_tenant/migration.sql` | `research.md` #1 — exemplar `20260830100000_change_schedule_to_start_at_duration` on this same codebase |
| 6 | Update `seed_departments.sql` — it lists columns explicitly (`department_id, name, description, color, created_at`) and will **fail** once `organization_id` is NOT NULL. Add the seed organization's UUID to the column list and every row | `prisma/seed_departments.sql` | Read this session. `seed_job_categories.sql` targets a global table and is untouched |
| 7 | Regenerate the client with the **CI form**: `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma` | — | `research.md` #4 — the `--config` form fails offline with `PrismaConfigEnvError` |
| 8 | Apply the migration. **Needs Docker up** (`research.md` #3 — currently down). Host-side via the in-process URL-rewrite script; `migrate diff --script` is the offline fallback if Docker stays down | — | Project brain §5, `[V 2026-08-30]` |
| 9 | Run the verification SQL (below) and capture output to `docs/tasks/organization-schema/results/` | `results/` | `spec.md` criteria 1, 2, 5, 6 |
| 10 | `rm -rf dist .nx/cache`, then `nx test api` · `nx affected -t lint` · `nx affected -t build` | — | `research.md` #4 — stale `.tsbuildinfo` produces phantom errors matching the *old* schema while jest stays green |
| 11 | Write `plan.md` (this file) and `operation.md` (the migration run, walked for real) into the task folder | `docs/tasks/organization-schema/` | `rules/evidence-policy.md` |

**No enum change in this run**, so `libs/shared/types/src/lib/enums.ts` is **not** touched — the manual
mirror obligation (`libs/CLAUDE.md` §4-5) falls to Tuần 2, when `UserRole.org_admin` lands
(`decision.md` D2).

## Migration SQL — shape put up for review

Expand → backfill → contract, one fixed literal UUID so the backfill is deterministic:

```sql
-- 1. tenant table + the single seed organization
CREATE TABLE "organizations" (
  "organization_id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id"));
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

INSERT INTO "organizations" ("organization_id","name","slug") VALUES
  ('00000000-0000-4000-8000-000000000001','Công ty TNHH Tuyển dụng ATS','ats-demo');

-- 2. EXPAND — nullable first, so existing rows survive        (× all 9 tables)
ALTER TABLE "departments" ADD COLUMN "organization_id" TEXT;
-- 3. BACKFILL — one organization exists, so every row takes it (× all 9)
UPDATE "departments" SET "organization_id" = '00000000-0000-4000-8000-000000000001';
-- 4. CONTRACT — enforce, link, index                          (× all 9)
ALTER TABLE "departments" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id");
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");

-- 5. the model the orphaned CandidateSkillSource enum was written for
CREATE TABLE "candidate_skills" (…, "source" "candidate_skill_source" NOT NULL, …);
```

## Verification — how each criterion is actually proved

**This project has no service-level test infrastructure.** `apps/api`'s jest mocks Prisma entirely
(`createPrismaMock`; `.claude/rules/apis/testing.md`), so no test process anywhere starts a real
database. Criteria about *data in a database* therefore cannot be proved at any level this repo has —
they are proved by SQL with captured output. Stated here rather than quietly demoted to a level that
happens to be reachable.

| Criterion | Level | Proved by | In CI? |
|---|---|---|---|
| 1 — every row backfilled, none null | `[migration-verify]` | `SELECT count(*) … WHERE organization_id IS NULL` × 9 → all **0** | no |
| 2 — no child disagrees with its parent | `[migration-verify]` | 7 join checks, e.g. `SELECT count(*) FROM applications a JOIN job_postings j USING(job_id) WHERE a.organization_id <> j.organization_id` → **0**. This is the drift risk spec `decision.md` D3 says it cannot close at schema level — not closeable, but measurable | no |
| 3 — no behaviour changed | `[unit]` | `nx test api` matches the 182-test baseline | yes |
| 4 — client regenerates and type-checks | `[build]` | `nx affected -t lint` + `-t build`, after cache clear | yes |
| 5 — null org rejected | `[migration-verify]` | `INSERT INTO departments … ` with no `organization_id` → NOT NULL violation | no |
| 6 — `CandidateSkill` queryable, enum wired | `[migration-verify]` | insert + select one row through the generated client | no |

**No `[e2e]` row, deliberately.** Tuần 1 changes nothing a browser could observe — criterion 3 asserts
exactly that. An e2e test here would assert that nothing happened. The browser work belongs to Tuần 2,
when the boundary starts refusing requests.

## Restructure rider

Not applicable — no tracked path is moved or renamed.

## Material assumptions still open

| Assumption | Why material | How settled |
|---|---|---|
| Docker can be started so the migration can actually be applied | Steps 8-9 cannot run without it; the schema and SQL can still be authored | Ask the human to start Docker Desktop at step 8. If it stays down, author via `migrate diff --script` and stop before applying — do **not** report an unapplied migration as done |
| A failed migration leaves no half-applied state (Postgres DDL is transactional) | Determines whether a mid-failure needs manual cleanup | `ASSUMPTION` — a platform property, not run here. Mitigated by the migration being purely additive: no column is dropped, so a failed run is recoverable either way |
| Row volume in the live database | Affects runtime only, not correctness — one seed org means every row takes the same id | Observed at step 9 when the counts print |
