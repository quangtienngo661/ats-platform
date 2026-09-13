# Checkpoint 1 — Multi-tenant row-level isolation (GĐ1 module spec)

> The single gate this workflow uses. Answered via `AskUserQuestion` (to satisfy
> `checkpoint-gate.py`'s Rule B before the first file write of this run) and then formally approved
> as part of the plan via `ExitPlanMode`.

**Date:** 2026-09-12 · **Stops before:** drafting `module-spec-multi-tenant.md`'s Scope section,
which needed the admin-role axis resolved first.

## What was put to the human

| Option | What it means | Cost / what it does not fix |
|---|---|---|
| B — Lean, keep admin shared | Single global `admin` role, unchanged from today. `Organization` + org-scoping on the 9 tables + closing the 4 gap surfaces (job-postings/recruiters/departments/Socket.IO) ship exactly the same as option A. | An organization cannot self-manage its own recruiters/departments/AiConfig without the global admin, until GĐ2 splits the role. |
| A — Full, split org-admin | Adds a new `org-admin` role (manages one organization) distinct from a `platform-admin` (manages organizations + shared taxonomy). | Heaviest slice of the module — new role, new guard branch, new UI gating — real risk of slipping the compressed 3-week window (week 1 was already lost to other work). |

Both options are identical on isolation *correctness* — the axis is purely how much admin-role work
ships now vs. is deferred to GĐ2.

## What they answered

"B — Mỏng, giữ admin chung (khuyến nghị)" — verbatim selection of option B.

> **Superseded later the same day (2026-09-12).** The answer recorded below was real and is left
> exactly as given. It was later **reversed to Scope A** when the approved ĐA2 proposal was read for
> the first time and found to require per-organization administration in its official scope
> (`research.md` #5). The reversal is recorded in `decision.md` (D1 + Reversals). What this checkpoint
> honestly shows is that the question was put to the human on incomplete information — the proposal
> had not yet been read when it was asked.

## What changed as a result

> **Describes the state at the time of this answer, not the delivered document** — see the supersede
> note above. As delivered, `module-spec-multi-tenant.md` states the **two-tier** administration of
> Scope A (`platform-admin` + `org-admin`, criteria 6a/6b/7).

`module-spec-multi-tenant.md`'s Scope section states a single global `admin` role. The org-admin
split is explicitly listed under "Explicitly out of scope for this build," recorded with its
rationale in `decision.md` D1. Nothing else in the plan changed — the 9-table org-scoping, the 4
gap-surface closures, and all five acceptance criteria are identical under either option.

## State at this checkpoint

| | |
|---|---|
| Suite | N/A — this is a spec-only run; nothing to run yet, no implementation exists for this module |
| Artefacts complete so far | survey · research · plan · decision · this checkpoint — all six being written in the same Stage 4 pass, `module-spec-multi-tenant.md` immediately following |
| Known open | `Organization`'s exact field-level schema (`ASSUMPTION`, in the module spec's ERD) · enforcement mechanism (extension/RLS/manual — `build-feature`'s later choice) · org-context propagation mechanism (also `build-feature`'s) |

**Report only what the output shows.** No suite ran because none exists yet for a document-only
deliverable; this is stated rather than implied.
