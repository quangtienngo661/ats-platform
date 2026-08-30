---
paths:
  - "apps/web/**"
---

# Web — Overview

Next.js App Router frontend for the ATS Platform, role-partitioned (admin/recruiter/candidate/public) with a real-time AI mock-interview experience over Socket.IO. The platform's first build phase is complete (a couple months of finished work); this codebase is now in its next stage — treat the conventions in the other `.claude/rules/web/*.md` files as established, not as scaffolding to redo.

Scope: this rule set covers `apps/web` (the Next.js App Router frontend) only. See the repo-root `CLAUDE.md` for the monorepo as a whole (NestJS API, shared libs, Prisma location). Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton these files follow.
