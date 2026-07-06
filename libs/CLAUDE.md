# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this file covers `libs/backend/database` and `libs/shared/types` only. See the repo-root `CLAUDE.md` for the monorepo as a whole (NestJS API, Next.js frontend, cross-cutting conventions like the response envelope and pagination shape — not repeated here). Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton that apply across all projects.

## 1. Overview

Two shared libraries consumed by both apps: `libs/backend/database` (Prisma schema + generated client, backend-only) and `libs/shared/types` (framework-agnostic enums/interfaces, consumed by both `apps/api` and `apps/web`). No phase-specific work is scoped to these libs beyond the repo-wide Phase 0 (as of Jul 2026, `docs/migration-roadmap.md`), except where noted in §8.

## 2. Tech Stack

- **Prisma ^7.8** (`prisma-client` generator, `@prisma/adapter-pg`) — schema/migrations live only in `libs/backend/database/prisma/`, nowhere else in the repo.
- Both libs are plain TypeScript Nx libraries with no framework of their own — `database`'s only non-generated code is `src/lib/database.ts` (a stub) and `src/index.ts` (re-exports); `types` is pure interfaces/enums, no runtime logic beyond `response-format.ts`'s two builder functions.
- Neither library has a test runner wired up (§9).

## 3. Directory Structure

**`libs/backend/database`**
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed_*.sql` — the only copies in the repo. There is no `apps/api/prisma`.
- `src/generated/prisma/` — the generated client (`generator client { output = "../src/generated/prisma" }`). **Not committed**: the repo-root `.gitignore`'s bare `generated` pattern matches it (verify with `git check-ignore`, not by reading `libs/backend/database/.gitignore` alone — that file's own `/generated/prisma` entry doesn't actually match, since the real output is under `src/`). A fresh checkout has no generated client until `prisma generate` runs (§6) — `src/index.ts` won't resolve otherwise.
- `src/index.ts` — re-exports `./lib/database` and `./generated/prisma/client`; this is what `@ats-platform/database` resolves to.

**`libs/shared/types`**
- `src/lib/interfaces/<domain>/*.interface.ts` — plain DTO/request/response interfaces, one folder per domain, all re-exported from `src/index.ts`.
- `src/lib/enums.ts` — hand-duplicated string-literal enums mirroring the Prisma schema enums (`export const Foo = {...} as const; export type Foo = typeof Foo[keyof typeof Foo]`, not TS `enum`). This is the canonical source for enum values across the whole repo (§4).
- `src/lib/prisma-enums.ts` — present but deliberately emptied out (§5).
- `src/lib/utils/response-format.ts` — `ResponseFormat<T>` + `successResponse()`/`errorResponse()`, the basis for the root-level response envelope convention.
- `src/lib/interfaces/pagination.interface.ts` — `IPaginationMeta` + `IPaginatedResponse<T>`, the basis for the root-level pagination convention.

## 4. Code Conventions

- **Always import enums from `@ats-platform/types`, never from `@ats-platform/database`, in frontend code.** Backend code can technically use either since it runs in Node, but stay consistent within a file — prefer `@ats-platform/types` there too so a copy-pasted snippet is safe to move to the frontend.
- **When a Prisma enum is added or changed in `schema.prisma`, mirror it by hand in `libs/shared/types/src/lib/enums.ts`.** Nothing enforces they stay in sync (§5) — this is a manual step, not a codegen step.
- `enums.ts` re-exports a few backward-compatibility aliases at the bottom (`Role` = `UserRole`, `JobPostingStatus` = `JobStatus`, `CVParsingStatus` = `ParsingStatus`, `InterviewSessionStatus` = `InterviewStatus`) for old call sites — prefer the canonical names in new code, don't add a new alias without a concrete migration reason.
- New cross-cutting interfaces belong in `libs/shared/types/src/lib/interfaces/<domain>/`, not duplicated into `apps/web/src/types` or a backend DTO file.

## 5. Current Anti-patterns — Do Not Follow

- **Enum sync between `schema.prisma` and `enums.ts` is entirely manual, with no CI check.** `src/lib/prisma-enums.ts` used to re-export Prisma's generated enums directly but was disabled — its header comment explains that leaked a Node.js module into Next.js Client Components and broke Turbopack builds. Don't re-enable that re-export to "simplify" the duplication; the fix for drift is discipline (update both files in the same commit), not reintroducing the re-export.
- **`CandidateSkillSource` enum has no corresponding model** (`docs/current-state.md` M6, audit as of Jun 2026 — verified independently against `schema.prisma`, no `CandidateSkill` model exists) — `CandidateSkill` was never implemented, so the enum is orphaned in the schema. Leave it as-is unless you're implementing the `CandidateSkill` model (Phase 2 territory, RAG-adjacent) — don't delete the enum as unused-code cleanup without checking the roadmap first.

## 6. Important Commands

Two equivalent ways to run Prisma:

```bash
# Nx targets (cwd is set to libs/backend/database, so prisma.config.ts is found automatically — no --config needed)
npx nx run database:prisma-generate
npx nx run database:prisma-migrate --args="--name=add_foo_column"
npx nx run database:prisma-deploy
npx nx run database:prisma-reset

# Raw CLI from repo root (must pass --config since prisma.config.ts isn't at repo root)
npx prisma generate --config libs/backend/database/prisma.config.ts
npx prisma migrate dev --config libs/backend/database/prisma.config.ts

# What CI actually runs (.github/workflows/ci.yml) — bypasses prisma.config.ts entirely via --schema
npx prisma generate --schema=libs/backend/database/prisma/schema.prisma
```

`prisma.config.ts` reads `DATABASE_URL` from the repo-root `.env` (resolved relative to this config file's directory as `../../../.env`). Never run `prisma-deploy` or `prisma-reset` (Nx targets or raw CLI) against anything but a disposable local database without asking first.

## 7. Safety Rules / Boundaries

- Never hand-edit `libs/backend/database/src/generated/prisma` — it's fully regenerated by `prisma generate`; any manual edit is silently lost on the next generate.
- Schema changes only via `libs/backend/database/prisma/schema.prisma` + a real migration (`prisma migrate dev`) — never hand-write a migration SQL file or edit an already-applied one.
- `prisma migrate reset` drops and recreates the database — confirm before running it against anything other than a throwaway local DB.

## 8. Architecture & Key Decisions

`libs/shared/types` exists specifically to keep Prisma (a Node-only dependency) out of the Next.js client bundle while still sharing enum/interface definitions between the two apps — see §5 for the concrete incident that shaped this (Turbopack build failures from the abandoned `prisma-enums.ts` re-export).

Per `docs/migration-roadmap.md` Phase 2 (RAG, Sep 2026): `pgvector` will be enabled on this same PostgreSQL instance and a question-bank schema will be added here — expect new models/migrations in `libs/backend/database`, not a new library, when that phase starts. Don't preemptively scaffold for it now.

## 9. Testing

Neither library has test files today. If you add tests here, mirror `apps/api`'s pattern (`*.spec.ts` next to source, run via `@nx/jest`) rather than inventing a different runner — but note neither `project.json` currently defines a `test` target, so that would need wiring up first (see `apps/web/CLAUDE.md` §9 for the same gap on that project).

## 10. Other Notes

- Both libraries have empty/minimal `project.json` targets (`types` has none at all; `database` only has the four `prisma-*` run-commands in §6) — anything beyond that comes from Nx's plugin inference (`@nx/eslint/plugin`, `@nx/jest/plugin`, `@nx/js/typescript` in `nx.json`), not an explicit target definition.
- `apps/api/CLAUDE.md` is the primary consumer of `@ats-platform/database`; `apps/web/CLAUDE.md` should only ever consume `@ats-platform/types` (§4).
