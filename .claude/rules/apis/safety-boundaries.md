---
paths:
  - "apps/api/**"
  - "libs/backend/database/**"
  - "docker-compose*.yml"
  - ".env*"
---

# API — Safety Rules / Boundaries

- Never hand-edit `libs/backend/database/src/generated/prisma` — it's the generated Prisma client, regenerate via `prisma generate` instead.
- Schema changes only via `libs/backend/database/prisma/schema.prisma` + `prisma migrate dev`, always with the `--config` flag (the config isn't at the repo root).
- `.env` holds real secrets (`.env.example` is the template) — never commit changes that add real values to `.env.example`, and double-check any file touching env vars before staging.
- `docker-compose.yml` is prod-shaped; use `docker-compose-dev.yml` for local Postgres + Redis. Don't run the prod compose file locally without asking.
- Destructive actions that need confirmation first: `prisma migrate reset`, dropping/flushing Redis, deleting BullMQ queues or jobs, any prod-facing deploy step once Phase 5 CI/CD lands.
