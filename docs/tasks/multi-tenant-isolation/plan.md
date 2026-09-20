# Plan — Multi-tenant row-level isolation (GĐ1 module spec)

> Stage 3. Only the work still to do — one module, one `module-spec-multi-tenant.md`. Findings live
> in `survey.md` and `research.md`; this file names what remains and what it rests on.

**Date:** 2026-09-12 · Approved at the single gate (`ExitPlanMode`), scope axis resolved beforehand
via `AskUserQuestion` — see `checkpoint-1.md`.

> **Note (2026-09-12, later the same day):** Step 1 below says "single global `admin` (Scope B)".
> That was true when this plan was approved and is left unedited as the historical record. Scope was
> **reversed to A** (two-tier: `platform-admin` + `org-admin`) after the approved ĐA2 proposal was
> read and found to place per-organization administration inside its official scope — see
> `research.md` #5 and `decision.md` D1 + Reversals. The delivered
> `module-spec-multi-tenant.md` reflects **A**, not the B written below.

## Steps

| # | Step | Files | Rests on |
|---|---|---|---|
| 1 | Write `module-spec-multi-tenant.md`'s Scope + Constraints: the 9-org-scoped / 13-global table split, `Organization` 1:N `Department`, single global `admin` (Scope B) | `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` | `survey.md` (schema read) · `decision.md` D1 |
| 2 | Write Business rules: org derivation via `Recruiter.departmentId`, ADR 0002 unaffected, `CandidateSkill` seeded now for GĐ3 | same file | `survey.md` · project brain §3/§8 (ADR 0002, RAG risk #1) |
| 3 | Write ≥3 acceptance criteria covering: same-org list scoping, cross-org resource+socket refusal, shared-candidate-pool application scoping, migration backfill completeness, AiConfig per-org | same file | `survey.md` (all 9 enforcement sites + 3 gap surfaces) · `decision.md` D2 |
| 4 | Write ≥2 edge cases, including the 3 previously-unscoped surfaces gaining the same check (E1), a `Recruiter`/`Department` with no resolvable organization (E2), the dead `interview-schedule` guard branch left alone (E3), `Notification` needing no org column (E4) | same file | `survey.md` · `research.md` #3 |
| 5 | Write an `ASSUMPTION`-labeled ERD (mermaid) proposing `Organization`'s own fields — not derivable from any requirement, my own design | same file | `ASSUMPTION` (see below) |
| 6 | Write a short UC list, one per acceptance criterion's actor+goal | same file | Step 3 |
| 7 | Write `decision.md` (D1 admin-scope choice, D2 gap-surfaces-in-scope choice, both with filled `Defence` blocks) | `docs/tasks/multi-tenant-isolation/decision.md` | `checkpoint-1.md` · survey.md |
| 8 | Write `checkpoint-1.md` recording the `AskUserQuestion` put to the human and the answer | `docs/tasks/multi-tenant-isolation/checkpoint-1.md` | This session's `AskUserQuestion` call |
| 9 | Create a specification index. No `evidence/` folder exists anywhere in this project (survey.md) and no `task-artefacts:` convention is declared, so — rather than importing a folder shape this project has never used — the index is written as `docs/tasks/specification.md`, a sibling of this task's folder, matching the project's own `docs/` convention instead of forcing `evidence/specification.md` in from a different context | `docs/tasks/specification.md` | This deviation from the skill's own "commonly `evidence/specification.md`" wording is recorded here rather than silently substituted |

## Which claim is proven at which tier

Not applicable — this run produces a specification document, not code. Nothing here is proven by a
test tier; a criterion here is proven when a later `build-feature` run implements this module and
that run's own `spec.md` tags each criterion with the test level that proves it.

## Restructure rider

Not applicable — no tracked path is moved or renamed by this run.

## Material assumptions still open

| Assumption | Why it is material | How it will be settled |
|---|---|---|
| `Organization`'s exact schema fields (`name`, `slug`, `status`, …) beyond "needs an identity" | The module spec's ERD illustrates a concrete shape; if the real requirement differs, the ERD (not the acceptance criteria, which are field-shape-independent) would need revision | Confirmed at `build-feature`'s own Survey/Plan stage when this module is actually implemented, or by the human reviewing the ERD in the module spec now |
| A `Department` can exist with no resolvable `Organization` mid-migration (edge case E2) | If unhandled, a migration bug here fails open (over-visible) rather than closed (under-visible) — a security-relevant gap, not a cosmetic one | The module spec states the required "fail closed" behaviour as edge case E2; `build-feature`'s implementation is verified against it directly |
