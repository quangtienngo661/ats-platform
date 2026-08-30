# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this file covers `apps/api` (the NestJS backend) only. See the repo-root `CLAUDE.md` for the monorepo as a whole. Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton that apply across all projects.

Detailed guidance for this app lives in `.claude/rules/apis/*.md` at the repo root, one topic per file, each scoped with `paths: ["apps/api/**"]` so it only loads when you're actually working in this app:

- `overview.md` — what this app is, current phase
- `tech-stack.md` — NestJS/Prisma/BullMQ versions and libraries in use
- `directory-structure.md` — module shape, `dto/` vs `dtos/` split, `common/` infra
- `code-conventions.md` — response envelope, pagination, BullMQ, Gemini, real-time conventions
- `anti-patterns.md` — known bad patterns, refactor-now vs leave-alone
- `commands.md` — serve/test/lint/build/prisma commands
- `safety-boundaries.md` — generated files, env vars, destructive actions
- `architecture-roadmap.md` — today's architecture vs. Phase 0–5 target
- `testing.md` — jest setup, excluded specs, mock factories
- `other-notes.md` — pointers to README/docs/important-notes

Don't duplicate that content back into this file — update the relevant rule file instead.
