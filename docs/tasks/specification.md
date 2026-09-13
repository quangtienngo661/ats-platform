# Specification index — ats-platform

> Every module specified via `write-spec` before being built, linked here. This project has no
> `evidence/` folder and no `task-artefacts:` line in its root `CLAUDE.md`, so this index lives at
> `docs/tasks/specification.md` — a sibling of the task folders themselves — rather than at the
> harness skill's own default suggestion of `evidence/specification.md`, which would import a folder
> shape this project has never used. Noted explicitly in `docs/tasks/multi-tenant-isolation/plan.md`.

| Module | Spec | Surface observed | Observed when |
|---|---|---|---|
| Multi-tenant row-level isolation (GĐ1) | [`multi-tenant-isolation/module-spec-multi-tenant.md`](multi-tenant-isolation/module-spec-multi-tenant.md) | ats-platform source (`apps/api`, `libs/backend/database`) — no live reference system exists for this not-yet-built module; read from source | 2026-09-12 |

## Builds implementing those specs

| Build | Task folder | Implements | Landed |
|---|---|---|---|
| GĐ1 Tuần 1 — Organization schema + tenant columns | [`organization-schema/`](organization-schema/) | The data model of the multi-tenant spec: `Organization`, `organizationId` on 9 tables, `CandidateSkill`, and the backfill migration. Criteria 1-6 of its own [`spec.md`](organization-schema/spec.md); verification output in [`results/`](organization-schema/results/migration-verification.md) | 2026-09-13 |
