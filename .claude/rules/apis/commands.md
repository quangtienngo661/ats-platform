---
paths:
  - "apps/api/**"
---

# API — Important Commands

Run everything through Nx from the repo root — there's no local `package.json` script runner inside `apps/api`.

```bash
# Serve (rebuilds via webpack first; runs on SERVER_PORT, default 5000, prefixed at /api, Swagger at /api)
npx nx serve api

# Test (jest, ts-jest, testMatch is src/app/**/*.spec.ts only — see testing.md)
npx nx test api
npx nx test api --testFile=interviews.service.spec.ts
npx nx test api -t "should create interview"

# Lint / build
npx nx lint api
npx nx build api                       # webpack-cli build --node-env=production, cwd apps/api
npx nx build api --configuration=development

# Prisma (schema lives in libs/backend/database, not here)
npx prisma generate --config ../../libs/backend/database/prisma.config.ts
npx prisma migrate dev --config ../../libs/backend/database/prisma.config.ts
```

Never run `prisma migrate deploy`, `prisma migrate reset`, or anything against a non-local database without asking first — there is no staging/prod separation documented yet (that lands in Phase 5).
