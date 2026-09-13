# Spec — Organization schema (GĐ1 Tuần 1)

> Derived from `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` (the GĐ1 SRS). That
> document is the **input**; this one narrows it to what Tuần 1 alone delivers and tags each
> criterion with the level that proves it.

**Date:** 2026-09-13 · **Scope:** feature (one capability — the tenant data model). No endpoint is
added, changed or removed, so no `api-contract.md` is owed.

## Objective

Introduce `Organization` as the tenant boundary in the schema, denormalise `organizationId` onto all
9 org-scoped tables, add the `CandidateSkill` model, and migrate the existing single-tenant database
into one seed organization **without changing any observable API behaviour**.

The last clause is the point of the week: after Tuần 1 the columns exist and nothing filters on them.
That is deliberate — schema and enforcement land as two separate deploys, so if Tuần 2 goes wrong,
Tuần 1 is inert rather than broken.

## Constraints

| Constraint | Imposed by |
|---|---|
| `organizationId` sits **directly** on all 9 tables, including pure children — never derived by join | Spec `decision.md` D3 (keeps all three enforcement mechanisms viable) |
| `organizationId` is **NOT NULL** on all 9 after backfill; the migration is data-preserving (expand → backfill → contract) | Module spec criterion 4; technique verified — `research.md` #1 |
| `Candidate`, `CV`, `CandidateSkill` carry **no** `organizationId` — the shared candidate pool | Module spec Scope; human decision at a prior gate |
| No `UserRole.org_admin`, no `User.organizationId` in this migration | `decision.md` D2 (split) |
| Response shapes are unchanged — `organizationId` is an internal filter column, never a new DTO field | Module spec, *Cross-module contract notes* |
| Any Prisma enum change is mirrored by hand in `libs/shared/types/src/lib/enums.ts` in the same commit | `libs/CLAUDE.md` §4-5 — manual, no CI check |

## Acceptance criteria — «When … then …»

| # | Criterion | Level |
|---|---|---|
| 1 | When the migration is applied to the existing database, then **every** row across the 9 org-scoped tables has a non-null `organization_id`, and it equals the seed organization's id. | `[migration-verify]` |
| 2 | When the migration is applied, then for **every** parent→child pair in the survey's backfill tree, no child row disagrees with its parent: each of the 7 join checks returns **0**. | `[migration-verify]` |
| 3 | When the existing test suite is run against the migrated schema and regenerated client, then it passes with the **same** count as before the change — the schema change alters no behaviour any test asserts. | `[unit]` — `nx test api` |
| 4 | When `nx affected -t lint` and `nx affected -t build` run against the changed tree, then both pass — proving the regenerated Prisma client type-checks everywhere the 9 models are consumed. | `[build]` |
| 5 | When a `Department` is inserted with a null `organization_id`, then the database rejects the write. | `[migration-verify]` |
| 6 | When the `CandidateSkill` model is queried through the generated client, then it resolves, and its `source` column accepts the previously-orphaned `CandidateSkillSource` values. | `[migration-verify]` |

**`[migration-verify]` is not one of the four standard levels, and that is a finding, not a shorthand.**
This project has **no service-level test infrastructure** — `apps/api`'s jest mocks Prisma entirely
(`createPrismaMock`, whose `$transaction` runs the callback against a nested mock; see
`.claude/rules/apis/testing.md`), so no test process anywhere starts a real database. Criteria 1, 2, 5
and 6 are assertions **about data in a real database** and therefore cannot be proved at any level
this repository currently has. They are proved by SQL run against the migrated database with the
output captured into `results/`. This is surfaced at CP2 rather than silently demoted — see
*How these are tested*.

## Edge cases

| # | Edge case | Expected |
|---|---|---|
| E1 | The migration is applied a second time (`migrate deploy` re-run, or a fresh environment replaying history). | Exactly one seed organization exists. The `INSERT` uses a fixed literal UUID, so a replay against an already-migrated database is caught by Prisma's `_prisma_migrations` ledger rather than by inserting a duplicate. |
| E2 | A `Department` ends up with no resolvable `Organization` — the module spec's E2 fail-closed case. | **Structurally impossible after this migration**: `Department.organization_id` is NOT NULL with an FK, and `Recruiter.department_id` is already NOT NULL (`schema.prisma:242`). Stated rather than assumed, because the module spec specifies a fail-closed *behaviour* for a state this migration removes the possibility of. |
| E3 | The migration fails part-way (e.g. the backfill hits an unexpected row). | Nothing is left half-applied — PostgreSQL DDL is transactional and Prisma wraps a migration in one transaction. **`ASSUMPTION`** until observed: this is a property of the platform, not something run here. If it proves otherwise, the mitigation is that the whole change is additive except nothing is dropped — no column is removed by this migration, so a failed run leaves recoverable state either way. |
| E4 | `AiConfig` rows have no parent to derive an organization from (`schema.prisma:426` — no FK upward). | Assigned to the seed organization directly. Correct today because exactly one organization exists; it is the one table where the assignment is by fiat rather than derivable, and the survey records that. |

## How these are tested

Three of the six criteria have a home in the existing gates; four do not, and the gap is named rather
than papered over:

| Criterion | Proved by | Runs in CI? |
|---|---|---|
| 3 | `npx nx test api` — the existing suite, unchanged | yes |
| 4 | `npx nx affected -t lint` + `-t build` | yes |
| 1, 2, 5, 6 | SQL executed against the migrated database, output captured to `results/` | **no** — nothing in CI has a database |

**No `[e2e]` row, and the reason is stated as the workflow requires:** Tuần 1 changes no user-visible
behaviour by design. There is no journey a browser could walk that behaves differently after this
change than before it — criterion 3 asserts precisely that. An e2e test here would assert that
nothing happened, which the existing suite already does more cheaply. The browser work belongs to
Tuần 2, where the boundary starts refusing requests.
