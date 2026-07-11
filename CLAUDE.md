# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this is the root file for the whole Nx monorepo — repo-wide stack, cross-module conventions, and root-level commands live here. `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`, and `libs/CLAUDE.md` each cover only what differs from this file — don't duplicate their content back into this one. Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton that apply across all projects.

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
- `docs/` — `current-state.md` (source audit) and `migration-roadmap.md` (Phase 0–5 plan) are the canonical, current project-status references. `overall-assessment-4th-july.md` is an earlier draft covering the same ground — prefer the two split docs over it. `claude-md-structure.md` is a local copy of the section skeleton defined in `~/.claude/CLAUDE.md`. `docs/architecture-decisions/` holds ADRs (numbered `NNNN-slug.md`, template at `0000-template.md`) — the "why/trade-offs" for significant migration decisions; `migration-roadmap.md` links out to these rather than repeating the rationale inline.
- `important-notes/` — ~30 ad hoc design/planning markdown files (implementation plans, ERD/sequence diagrams, progress assessments) accumulated over the build, not dated/organized the way `docs/` is. Treat `docs/` as authoritative for current status and roadmap; check `important-notes/` for background before assuming a feature was never designed.
- `docker-compose.yml` (prod-shaped, 5 containers: Postgres, Redis, API, web, Nginx gateway) vs `docker-compose-dev.yml` (local Postgres+Redis only) — see §7.
- `nginx/` — reverse proxy + Let's Encrypt config for the Docker Compose prod deploy (see root `README.md`).

## 4. Code Conventions

Cross-cutting conventions both apps rely on — backend/frontend-specific conventions live in their own CLAUDE.md, not here:

- **API response envelope**: `{ success, status, data }` on success / `{ success: false, status, message }` on error — built from `ResponseFormat`/`successResponse`/`errorResponse` in `@ats-platform/types`. Never redefine an equivalent shape.
- **Pagination**: `{ items, pagination: { page, limit, total, totalPages } }` everywhere a list crosses a service/API/server-action boundary — the canonical type is `IPaginatedResponse<T>` in `@ats-platform/types`.
- **Enums**: import from `@ats-platform/types` (`enums.ts`), not `@ats-platform/database` — the latter leaks a Node.js module into Next.js Client Components. See `libs/CLAUDE.md` for why they're hand-duplicated instead of re-exported.
- **User-facing strings** (validation errors, toasts, thrown exception messages) are predominantly Vietnamese on both sides — match this for new UI/error text; internal/log-only messages stay in English.
- Path aliases: `@ats-platform/database` and `@ats-platform/types` resolve via `tsconfig.base.json`; `apps/web`'s `@/*` is local to that project.

## 5. Current Anti-patterns — Do Not Follow

Per-app anti-patterns (BullMQ retry config, synchronous Gemini call, `dto`/`dtos` folder drift, Tailwind hex sprawl, `extractMessage` duplication, etc.) are documented in `apps/api/CLAUDE.md` §5 and `apps/web/CLAUDE.md` §5 — don't repeat them here. Repo-wide:

- **Nx module boundaries aren't enforced by tags.** `eslint.config.mjs`'s `@nx/enforce-module-boundaries` rule sets `sourceTag: '*'` → `onlyDependOnLibsWithTags: ['*']`, i.e. every project is allowed to depend on every other. Don't assume the linter would catch `apps/web` importing `libs/backend/database`, or `libs/shared/types` importing backend-only code — check the actual import.
- **`docs/` was added the same day as this CLAUDE.md set and was still uncommitted as of Jul 2026** (`git status --short` showed it untracked alongside the CLAUDE.md files) — re-check `git status` rather than trusting this note once time has passed; if something in `docs/` visibly contradicts the code you're reading, trust the code and flag the discrepancy rather than silently trusting the doc.

## 6. Important Commands

```bash
npm install                                          # from repo root, once

# Local infra
docker-compose -f docker-compose-dev.yml up -d       # Postgres + Redis for local dev
docker-compose -f docker-compose.yml up --build -d   # prod-shaped — don't run locally without asking, see §7

# Prisma (schema lives in libs/backend/database, not apps/api — see libs/CLAUDE.md for all variants)
npx prisma generate --config libs/backend/database/prisma.config.ts

# Run one app (each has its own dev/serve target — see that app's CLAUDE.md)
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

Nx (`@nx/jest`) orchestrates Jest per project. Only `apps/api` has a jest config today (`apps/api/jest.config.ts`) — see that project's CLAUDE.md for running a single test/file and for the shared mock-factory helpers. `apps/web` has no test runner wired up at all (no jest config, no spec files). No coverage threshold is enforced anywhere in the repo.

## 10. Other Notes

- `README.md` — architecture diagram, AI mock-interview flow, BullMQ queue table, deployment instructions.
- `docs/current-state.md`, `docs/migration-roadmap.md` — current status and roadmap, referenced from both `apps/api/CLAUDE.md` and this file.
- `important-notes/` — historical design/planning docs, not kept current.
- `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`, `libs/CLAUDE.md` — per-project detail; this file only holds what's genuinely repo-wide.
- Solo-developer project (per the roadmap's risk register) — no per-module ownership split exists.
