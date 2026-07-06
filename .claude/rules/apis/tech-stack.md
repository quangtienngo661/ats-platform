---
paths:
  - "apps/api/**"
---

# API — Tech Stack

- NestJS ^11 (`@nestjs/common`, `core`, `jwt`, `passport`, `websockets`, `platform-socket.io`, `bullmq`, `swagger` — mounted at `/api` in `main.ts`, `throttler` — wired into `auth.module.ts`/`auth.controller.ts` for login/register/forgot-password, see `code-conventions.md`)
- TypeScript ~5.9.2
- Prisma ^7.8 / `@prisma/client` ^7.5 with `@prisma/adapter-pg` — schema lives in `libs/backend/database`, not here
- PostgreSQL + Redis (`ioredis` ^5.10) via `docker-compose-dev.yml` locally
- BullMQ ^5.71 (`@nestjs/bullmq` ^11.0.4) for async queues (CV parsing, CV screening, interview evaluation, verification email)
- Socket.IO ^4.8 for real-time (interview sessions, kanban updates, notifications)
- `@google/genai` ^1.46.0 — Gemini calls, always through `GeminiService` (see `code-conventions.md`)
- `class-validator` / `class-transformer` for DTO validation
- Jest ^30 + `ts-jest`, run via `@nx/jest` — never invoke `jest` directly except for the excluded specs noted in `testing.md`
- Build: webpack via `@nx/webpack`; Nx 22.7.2 orchestrates every command from the repo root
