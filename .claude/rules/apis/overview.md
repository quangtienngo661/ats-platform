---
paths:
  - "apps/api/**"
---

# API — Overview

NestJS backend for the ATS Platform — REST + Socket.IO API covering auth, job postings, applications/kanban, CV upload → parse → screen (Gemini), and real-time AI mock interviews.

Current phase: **Phase 0 — Foundation Fixes** (`docs/migration-roadmap.md`), hardening the existing modular monolith — retry, rate limiting, structured logging, env validation — before Phase 1 closes broken candidate-side workflows. Don't pre-split modules toward the microservices target yet; that's Phase 4 (Nov–Dec 2026).

Scope: this rule set covers `apps/api` (the NestJS backend) only. See the repo-root `CLAUDE.md` for the monorepo as a whole. Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton these files follow.
