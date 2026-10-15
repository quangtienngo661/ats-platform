# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this is the root file for the whole Nx monorepo — repo-wide stack, cross-module conventions, and root-level commands live here.

**Per-app detail and fix status live in the project brain, imported here.** It carries the API and web
conventions, tests, safety rules, the Status Tracker (authoritative for what is fixed vs. open) and the
architecture notes. `libs/CLAUDE.md` holds the shared-libs detail and loads when you touch `libs/`.

@~/.claude/knowledge-base/ats-platform/context.md

This file is NOT the source of truth for per-app status; the Status Tracker in the brain (§10) is. If
they disagree, fix this file.

## 1. Overview

ATS Platform — an AI-powered Applicant Tracking & Mock Interview system, built as an Nx monorepo (NestJS API, Next.js 16 web app, two shared libs). Candidates upload CVs that get AI-parsed and screened against job postings, then can take a real-time AI mock interview over Socket.IO before a human round.

Current phase: take it from the status block at the top of `docs/migration-roadmap.md` (it supersedes this paragraph). A source audit (`docs/current-state.md`, overall ~5.6/10 as of Jun 2026) found a solid backend/schema/AI pipeline but multiple broken candidate-side workflows and no production safety net (no retry, rate limiting, structured logging, or backups). Don't pre-split toward the microservices target (Phase 4, Nov–Dec 2026) ahead of schedule.

## 2. Tech Stack

- **Nx 22.7.2** orchestrates every command from the repo root; no project has its own `dev`/`test`/`build` npm scripts — always invoke through `nx`.
- **apps/api** — NestJS ^11 REST + Socket.IO backend. See `apps/api/CLAUDE.md`.
- **apps/web** — Next.js ^16.2.4 / React ^19 App Router frontend. See `apps/web/CLAUDE.md`.
- **libs/backend/database** — Prisma ^7.8 schema/migrations, the only copy in the repo (`@ats-platform/database`). See `libs/CLAUDE.md`.
- **libs/shared/types** — framework-agnostic enums/interfaces shared between API and web (`@ats-platform/types`). See `libs/CLAUDE.md`.
- **PostgreSQL 15 + Redis** via `docker-compose-dev.yml` locally; **BullMQ** (`@nestjs/bullmq`) for async queues; **Socket.IO** for real-time.
- **Google Gemini** (`@google/genai`) for CV parsing/screening/mock-interview generation, always through `GeminiService` — see `apps/api/CLAUDE.md`.
- **TypeScript ~5.9.2** everywhere; **ESLint 9** via `@nx/eslint-plugin`; **Jest ^30** via `@nx/jest` — only `apps/api` currently has a jest config (see §9).
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs `nx affected` lint/build plus `nx test api` and `npm run test:web` on every PR into `dev`. `.github/workflows/cd.yml` exists but is **empty** — no deploy automation yet (that's Phase 5).

## 3. Directory Structure

- `apps/api`, `apps/web` — the two deployable apps, each with their own CLAUDE.md.
- `libs/backend/database`, `libs/shared/types` — the two shared libs, covered together in `libs/CLAUDE.md`.
- `docs/` — `current-state.md` (source audit) and `migration-roadmap.md` (the plan; edit this one day-to-day) are the canonical status references. `architecture-decisions/` holds ADRs (`NNNN-slug.md`, template `0000-template.md`). `architecture/` holds dated snapshots — re-verify against code if the header date is more than a few weeks old. `audit/` holds dated findings, not a status report; the Status Tracker in the project brain (§10) is authoritative for what is still open, and `audit/2026-07-14-phase-0.5-code-changes.md` lists per-file subtleties (e.g. the `registerQueue` shallow-merge trap) — read it before touching a file it lists. `research/` holds external ATS-comparison briefs — read before designing new ATS-domain features. `2026-07-16-six-month-development-plan.md` and `overall-assessment-4th-july.md` are point-in-time documents, not living docs.
- `important-notes/` — ~30 ad hoc design/planning markdown files (implementation plans, ERD/sequence diagrams, progress assessments) accumulated over the build, not dated/organized the way `docs/` is. Treat `docs/` as authoritative for current status and roadmap; check `important-notes/` for background before assuming a feature was never designed.
- `docker-compose.yml` (prod-shaped, 5 containers: Postgres, Redis, API, web, Nginx gateway) vs `docker-compose-dev.yml` — see §7. **`docker-compose-dev.yml` defines 4 services** (`postgres`, `redis`, `api`, `web`); `docker-compose -f docker-compose-dev.yml up -d` builds and runs the API and web containers too. This matters: because the API runs *inside* Docker, `.env` points `DATABASE_URL`/`REDIS_HOST` at the Docker-internal hostnames `postgres`/`redis`, which **do not resolve from the host** — so `npx nx serve api` on the host fails to boot. To exercise your changes, rebuild the container (`docker-compose -f docker-compose-dev.yml up -d --build api`) and hit `http://localhost:5000/api`; to reach the DB, go through `docker exec ats-postgres psql -U <user> -d <db>`.
- `nginx/` — reverse proxy + Let's Encrypt config for the Docker Compose prod deploy (see root `README.md`).

## 4. Code Conventions

Cross-cutting conventions both apps rely on — backend/frontend-specific conventions live in their own CLAUDE.md, not here:

- **API response envelope**: `{ success, status, data }` on success / `{ success: false, status, message }` on error — built from `ResponseFormat`/`successResponse`/`errorResponse` in `@ats-platform/types`. Never redefine an equivalent shape.
- **Pagination**: `{ items, pagination: { page, limit, total, totalPages } }` everywhere a list crosses a service/API/server-action boundary — the canonical type is `IPaginatedResponse<T>` in `@ats-platform/types`.
- **Enums**: import from `@ats-platform/types` (`enums.ts`), not `@ats-platform/database` — the latter leaks a Node.js module into Next.js Client Components. See `libs/CLAUDE.md` for why they're hand-duplicated instead of re-exported.
- **User-facing strings** (validation errors, toasts, thrown exception messages) are predominantly Vietnamese on both sides — match this for new UI/error text; internal/log-only messages stay in English.
- Path aliases: `@ats-platform/database` and `@ats-platform/types` resolve via `tsconfig.base.json`; `apps/web`'s `@/*` is local to that project.

## 5. Current Anti-patterns — Do Not Follow

**Do not list per-app anti-patterns here, and do not read this section as a status report.** They live in the project brain (imported at the top; §10), whose Status Tracker table is the only authoritative record of what is fixed vs. still open. Read it; don't re-summarise it here.

Repo-wide, and true regardless of which app you're in:

- **Nx module boundaries aren't enforced by tags.** `eslint.config.mjs`'s `@nx/enforce-module-boundaries` rule sets `sourceTag: '*'` → `onlyDependOnLibsWithTags: ['*']`, i.e. every project is allowed to depend on every other. Don't assume the linter would catch `apps/web` importing `libs/backend/database`, or `libs/shared/types` importing backend-only code — check the actual import.
- **Docs can lag code; code wins.** `docs/` is committed and is the canonical status reference (`current-state.md`, `migration-roadmap.md`), but if anything in `docs/` visibly contradicts the code you're reading, trust the code and flag the discrepancy rather than silently trusting the doc.

## 6. Important Commands

```bash
npm install                                          # from repo root, once

# Local infra — this brings up four containers (postgres, redis, api, web)
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
npx nx test api --runInBand --silent                 # BE unit tests (default: no services)

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

Nx (`@nx/jest`) orchestrates Jest per project. Only `apps/api` has a jest config today (`apps/api/jest.config.ts`) — see the brain (§10, API → Tests) for the shared mock-factory helpers and the `testMatch` trap (a spec outside `src/app/**` and `src/common/**` is silently skipped). `apps/web` uses Vitest/jsdom for unit/component behavior (`npm run test:web`) and Playwright/Chromium for real-browser E2E (`npm run test:e2e:web`). E2E requires the isolated `docker-compose.test.yml` stack and guarded local fixtures — see the brain (§10, Web → Tests). No coverage threshold is enforced anywhere in the repo.

## 10. Other Notes

- `README.md` — architecture diagram, AI mock-interview flow, BullMQ queue table, deployment instructions.
- `docs/current-state.md`, `docs/migration-roadmap.md` — current status and roadmap.
- `docs/audit/`, `docs/research/` — dated service-vs-schema audits and external ATS-comparison research (§3). Audits are findings, not fixes: nothing in them has been patched unless the code says so.
- `important-notes/` — historical design/planning docs, not kept current.
- The project brain (`@`-imported at the top) — the real per-app detail. `apps/api/CLAUDE.md` and `apps/web/CLAUDE.md` are pointer stubs to it, nothing more — don't cite a section number from them, they have none.
- `libs/CLAUDE.md` — full detail for both shared libs; this file only holds what's genuinely repo-wide.
- `docs/deliveries/` — per-step plan summaries and as-built records (e.g. `gd2-sp1-evaluation.md`).
- Solo-developer project (per the roadmap's risk register) — no per-module ownership split exists.
