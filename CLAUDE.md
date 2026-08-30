# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this is the root file for the whole Nx monorepo — repo-wide stack, cross-module conventions, and root-level commands live here. Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton that apply across all projects.

**Where the per-app detail actually lives — read this before trusting anything below.** The detailed, actively-maintained guidance for each app is in path-scoped rule files, **not** in this file and not in the `apps/*/CLAUDE.md` stubs (those are pointers only, no numbered sections):

- `.claude/rules/apis/*.md` — scoped `paths: ["apps/api/**"]`, loads automatically the moment you touch a file under `apps/api/`.
- `.claude/rules/web/*.md` — scoped `paths: ["apps/web/**"]`, same for `apps/web/`.
- `libs/CLAUDE.md` — full detail for both shared libs (not stubbed; loads when you touch `libs/`).

Two consequences you must respect:

1. **This file is NOT the source of truth for per-app status.** It is always in context, so it goes stale first. `.claude/rules/apis/anti-patterns.md` has a **Status Tracker** table — that table is authoritative for what's fixed vs. open. If this file and a rule file disagree, the rule file wins; fix this file rather than "correcting" the rule file to match.
2. **If your task is about `apps/api` or `apps/web` but you haven't opened a file there yet** (planning, roadmap questions, "what should I work on next?"), the relevant rules are _not yet loaded_ — read `.claude/rules/{apis,web}/*.md` explicitly before answering. Nearly every stale-advice failure in this repo comes from skipping that step.

Note: all files in `.claude/rules/apis/` except `safety-boundaries.md` share the identical `paths` glob, so the whole set loads together — the 10-file split is editorial, not a context-saving mechanism. Don't split further expecting per-topic lazy-loading.

## 1. Overview

ATS Platform — an AI-powered Applicant Tracking & Mock Interview system, built as an Nx monorepo (NestJS API, Next.js 16 web app, two shared libs). Candidates upload CVs that get AI-parsed and screened against job postings, then can take a real-time AI mock interview over Socket.IO before a human round.

Current phase (as of Jul 2026): **Phase 0 — Foundation Fixes** (`docs/migration-roadmap.md`). A source audit (`docs/current-state.md`, overall ~5.6/10 as of Jun 2026) found a solid backend/schema/AI pipeline but multiple broken candidate-side workflows and no production safety net (no retry, rate limiting, structured logging, or backups). Phase 0 hardens what exists before Phase 1 closes those workflow gaps — don't add new candidate-facing features or pre-split toward the microservices target (Phase 4, Nov–Dec 2026) ahead of schedule. Re-check this against `docs/migration-roadmap.md` if it's been more than a few months — phases shift.

## 2. Tech Stack

- **Nx 22.7.2** orchestrates every command from the repo root; no project has its own `dev`/`test`/`build` npm scripts — always invoke through `nx`.
- **apps/api** — NestJS ^11 REST + Socket.IO backend. See `apps/api/CLAUDE.md`.
- **apps/web** — Next.js ^16.2.4 / React ^19 App Router frontend. See `apps/web/CLAUDE.md`.
- **libs/backend/database** — Prisma ^7.8 schema/migrations, the only copy in the repo (`@ats-platform/database`). See `libs/CLAUDE.md`.
- **libs/shared/types** — framework-agnostic enums/interfaces shared between API and web (`@ats-platform/types`). See `libs/CLAUDE.md`.
- **PostgreSQL 15 + Redis** via `docker-compose-dev.yml` locally; **BullMQ** (`@nestjs/bullmq`) for async queues; **Socket.IO** for real-time.
- **Google Gemini** (`@google/genai`) for CV parsing/screening/mock-interview generation, always through `GeminiService` — see `apps/api/CLAUDE.md`.
- **TypeScript ~5.9.2** everywhere; **ESLint 9** via `@nx/eslint-plugin`; **Jest ^30** via `@nx/jest` — only `apps/api` currently has a jest config (see §9).
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs `nx affected` lint/build plus `nx test api` on every PR into `dev`. `.github/workflows/cd.yml` exists but is **empty** — no deploy automation yet (that's Phase 5).

## 3. Directory Structure

- `apps/api`, `apps/web` — the two deployable apps, each with their own CLAUDE.md.
- `libs/backend/database`, `libs/shared/types` — the two shared libs, covered together in `libs/CLAUDE.md`.
- `docs/` — `current-state.md` (source audit) and `migration-roadmap.md` (Phase 0–5 plan) are the canonical, current project-status references — `migration-roadmap.md` is the one to edit day-to-day (checklists, Progress Log). `2026-07-16-six-month-development-plan.md` is a **point-in-time synthesis** of the same roadmap for reporting/presentation purposes (current state + phase-by-phase plan + ADR list + risks + deliberately-out-of-scope items, all in one file) — read it for a quick overview, but re-derive it from `migration-roadmap.md` if it's more than a few weeks old, don't edit it as a living doc. `overall-assessment-4th-july.md` is an earlier draft covering the same ground — prefer the two split docs over it. `claude-md-structure.md` is a local copy of the section skeleton defined in `~/.claude/CLAUDE.md`. `docs/architecture-decisions/` holds ADRs (numbered `NNNN-slug.md`, template at `0000-template.md`) — the "why/trade-offs" for significant migration decisions; `migration-roadmap.md` links out to these rather than repeating the rationale inline. `docs/architecture/` holds a point-in-time architecture snapshot (`system.md`, `database.md`, `infrastructure.md`, dated in each file's header) meant to be portable into a fresh session without re-reading the whole codebase — re-verify against code if the snapshot date is more than a few weeks old, don't trust it blindly. `docs/audit/` holds dated service-vs-schema audits (`YYYY-MM-DD-<scope>.md`, static reads with `file:line` evidence: dead/underused DB fields, missing state-machine validation, authorization gaps) — they are **findings as of their date, not a current status report**; the privilege-escalation hole `2026-07-12-org-job.md` describes was fixed and verified on 2026-07-14 (Phase 0.5 Nhóm 1), so read them against `.claude/rules/apis/anti-patterns.md`'s Status Tracker, which is the authoritative record of what's still open. **`docs/audit/2026-07-14-phase-0.5-verification.md` is a different kind of document — a runtime verification report (real API calls, real DB reads), not a static code read; it records which Phase 0.5 fixes are proven at runtime vs. still needing a manual test (a real bug — the health check hangs instead of returning 503 when Redis is frozen — is documented there, unfixed). `docs/audit/2026-07-14-phase-0.5-code-changes.md` is the per-file change report for that same stabilization pass (what changed in each file and why) — read it before touching any file it lists, since several fixes there depend on subtleties (e.g. the `registerQueue` shallow-merge trap) that aren't obvious from the diff alone. `docs/audit/2026-07-15-phase-0.5-business-report.md` covers the same pass again, but framed as business problem → fix, with no code — hand this one to a reader who wants to understand impact, not implementation.** `docs/research/` holds dated external-research briefs comparing this system to production ATS platforms (Greenhouse/Lever/Ashby/Workday) and to industry practice for AI screening + hiring-AI compliance — read before designing new ATS-domain features so the model doesn't diverge from what a real ATS does.
- `important-notes/` — ~30 ad hoc design/planning markdown files (implementation plans, ERD/sequence diagrams, progress assessments) accumulated over the build, not dated/organized the way `docs/` is. Treat `docs/` as authoritative for current status and roadmap; check `important-notes/` for background before assuming a feature was never designed.
- `docker-compose.yml` (prod-shaped, 5 containers: Postgres, Redis, API, web, Nginx gateway) vs `docker-compose-dev.yml` — see §7. **`docker-compose-dev.yml` now defines 4 services** (`postgres`, `redis`, `api`, `web`), not just the two datastores; `docker-compose -f docker-compose-dev.yml up -d` builds and runs the API and web containers too. This matters: because the API runs *inside* Docker, `.env` points `DATABASE_URL`/`REDIS_HOST` at the Docker-internal hostnames `postgres`/`redis`, which **do not resolve from the host** — so `npx nx serve api` on the host fails to boot. To exercise your changes, rebuild the container (`docker-compose -f docker-compose-dev.yml up -d --build api`) and hit `http://localhost:5000/api`; to reach the DB, go through `docker exec ats-postgres psql -U <user> -d <db>`.
- `nginx/` — reverse proxy + Let's Encrypt config for the Docker Compose prod deploy (see root `README.md`).

## 4. Code Conventions

Cross-cutting conventions both apps rely on — backend/frontend-specific conventions live in their own CLAUDE.md, not here:

- **API response envelope**: `{ success, status, data }` on success / `{ success: false, status, message }` on error — built from `ResponseFormat`/`successResponse`/`errorResponse` in `@ats-platform/types`. Never redefine an equivalent shape.
- **Pagination**: `{ items, pagination: { page, limit, total, totalPages } }` everywhere a list crosses a service/API/server-action boundary — the canonical type is `IPaginatedResponse<T>` in `@ats-platform/types`.
- **Enums**: import from `@ats-platform/types` (`enums.ts`), not `@ats-platform/database` — the latter leaks a Node.js module into Next.js Client Components. See `libs/CLAUDE.md` for why they're hand-duplicated instead of re-exported.
- **User-facing strings** (validation errors, toasts, thrown exception messages) are predominantly Vietnamese on both sides — match this for new UI/error text; internal/log-only messages stay in English.
- Path aliases: `@ats-platform/database` and `@ats-platform/types` resolve via `tsconfig.base.json`; `apps/web`'s `@/*` is local to that project.

## 5. Current Anti-patterns — Do Not Follow

**Do not list per-app anti-patterns here, and do not read this section as a status report.** They live in `.claude/rules/apis/anti-patterns.md` and `.claude/rules/web/anti-patterns.md`, whose Status Tracker table is the only authoritative record of what is fixed vs. still open. This file previously duplicated that list and went stale — several items it called "current" (BullMQ `attempts: 1`, synchronous Gemini call in `startSession()`) were already fixed in Jul 2026. Read the rule file; don't re-summarise it here.

Repo-wide, and true regardless of which app you're in:

- **Nx module boundaries aren't enforced by tags.** `eslint.config.mjs`'s `@nx/enforce-module-boundaries` rule sets `sourceTag: '*'` → `onlyDependOnLibsWithTags: ['*']`, i.e. every project is allowed to depend on every other. Don't assume the linter would catch `apps/web` importing `libs/backend/database`, or `libs/shared/types` importing backend-only code — check the actual import.
- **Docs can lag code; code wins.** `docs/` is committed and is the canonical status reference (`current-state.md`, `migration-roadmap.md`), but if anything in `docs/` visibly contradicts the code you're reading, trust the code and flag the discrepancy rather than silently trusting the doc. `docs/architecture/` was untracked as of Jul 2026 but is now committed — don't trust either state, re-check `git status` yourself.

## 6. Important Commands

```bash
npm install                                          # from repo root, once

# Local infra — this brings up FOUR containers (postgres, redis, api, web), not two
docker-compose -f docker-compose-dev.yml up -d
docker-compose -f docker-compose-dev.yml up -d --build api   # rebuild the API from current source
docker-compose -f docker-compose.yml up --build -d   # prod-shaped — don't run locally without asking, see §7

# Prisma (schema lives in libs/backend/database, not apps/api — see libs/CLAUDE.md for all variants)
npx prisma generate --config libs/backend/database/prisma.config.ts

# Run one app on the HOST — note `nx serve api` will NOT boot while the dev compose
# .env is in use (DATABASE_URL/REDIS_HOST are Docker-internal hostnames, see §3).
# To exercise API changes, rebuild the api container instead.
npx nx serve api
npx nx dev web

# Cross-project — this is what CI actually runs (.github/workflows/ci.yml)
npx nx affected -t lint
npx nx affected -t build
npx nx test api --runInBand --silent                 # apps/web has no test target, see §9

# Everything, not just affected
npx nx run-many --target=lint
npx nx run-many --target=test
npx nx run-many --target=build
```

Never run the prod `docker-compose.yml`, or any `prisma migrate deploy`/`reset`, against a real or shared environment without asking first — see §7.

## 7. Safety Rules / Boundaries

- `.env` holds real secrets (`.env.example` is the template) — never commit real values into `.env.example`, and check any diff touching env handling before staging.
- `docker-compose.yml` is prod-shaped (5 containers, Nginx + SSL) — only run it locally if deliberately testing the prod build; default to `docker-compose-dev.yml`.
- Never hand-edit `libs/backend/database/src/generated/prisma` (the generated Prisma client) — see `libs/CLAUDE.md`.
- Destructive actions that need confirmation first: `prisma migrate reset`/`deploy`, force-push, flushing Redis, deleting BullMQ jobs/queues, and anything under `nginx/` or the prod `docker-compose.yml` that would affect a live deploy.

## 8. Architecture & Key Decisions

Full source audit: `docs/current-state.md`. Full phased plan: `docs/migration-roadmap.md`. System design (architecture diagram, AI mock-interview phase-by-phase flow, BullMQ queue table): root `README.md` — kept current, read it before `important-notes/`.

Today: modular monolith (NestJS) + PostgreSQL + Redis + BullMQ + Socket.IO, one deploy unit. Target (Jan 2027, per the roadmap): microservices via NATS (async) + gRPC (sync), pgvector for RAG, LiveKit for video — extracted least-coupled-first (`ai-service`, then `notification-service`, `auth-service`, `cv-service`, core `job`/`application`/`interview` services last). This is a **stated future direction, not current architecture** — don't refactor toward it ahead of Phase 4.

## 9. Testing

Nx (`@nx/jest`) orchestrates Jest per project. Only `apps/api` has a jest config today (`apps/api/jest.config.ts`) — see `.claude/rules/apis/testing.md` for running a single test/file, the shared mock-factory helpers, and which specs are silently excluded from `nx test api`. `apps/web` has no test runner wired up at all (no jest config, no spec files) — `.claude/rules/web/testing.md`. No coverage threshold is enforced anywhere in the repo.

## 10. Other Notes

- `README.md` — architecture diagram, AI mock-interview flow, BullMQ queue table, deployment instructions.
- `docs/current-state.md`, `docs/migration-roadmap.md` — current status and roadmap.
- `docs/audit/`, `docs/research/` — dated service-vs-schema audits and external ATS-comparison research (§3). Audits are findings, not fixes: nothing in them has been patched unless the code says so.
- `important-notes/` — historical design/planning docs, not kept current.
- `.claude/rules/apis/*.md`, `.claude/rules/web/*.md` — the real per-app detail (see the Scope note at the top). `apps/api/CLAUDE.md` and `apps/web/CLAUDE.md` are pointer stubs to those, nothing more — don't cite a section number from them, they have none.
- `libs/CLAUDE.md` — full detail for both shared libs; this file only holds what's genuinely repo-wide.
- Solo-developer project (per the roadmap's risk register) — no per-module ownership split exists.
