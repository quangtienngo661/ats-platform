# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this file covers `apps/web` (the Next.js App Router frontend) only. See the repo-root `CLAUDE.md` for the monorepo as a whole (NestJS API, shared libs, Prisma location).

Detailed guidance for this app (conventions, tests, commands, safety rules) lives in the project brain
imported by the repo-root `CLAUDE.md` (§10, Web). Don't duplicate that content into this file.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
