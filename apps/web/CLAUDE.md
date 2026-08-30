# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this file covers `apps/web` (the Next.js App Router frontend) only. See the repo-root `CLAUDE.md` for the monorepo as a whole (NestJS API, shared libs, Prisma location). Always also check the global CLAUDE.md at `~/.claude/CLAUDE.md` — it defines behavioral rules (`~/.claude/rules/*.md`) and the section skeleton that apply across all projects.

Detailed guidance for this app lives in `.claude/rules/web/*.md` at the repo root, one topic per file, each scoped with `paths: ["apps/web/**"]` so it only loads when you're actually working in this app:

- `overview.md` — what this app is, current phase
- `tech-stack.md` — versions and libraries in use
- `directory-structure.md` — route groups, load-bearing folders
- `code-conventions.md` — Server Actions layer, hydrator pattern, response shapes
- `anti-patterns.md` — known bad patterns to not repeat
- `commands.md` — dev/build/lint commands, path aliases
- `safety-boundaries.md` — files/areas that need care before editing
- `architecture.md` — auth routing, real-time, dashboard data
- `testing.md` — current (lack of) test setup
- `other-notes.md` — pointers to sibling CLAUDE.md files

Don't duplicate that content back into this file — update the relevant rule file instead.
