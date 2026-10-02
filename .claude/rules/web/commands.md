---
paths:
  - "apps/web/**"
---

# Web — Important Commands

Run everything through Nx from the repo root — there's no local `package.json` script runner inside `apps/web`.

```bash
npx nx dev web              # dev server, CLIENT_PORT (default 3000) — target is "dev", not "serve"
npx nx build web             # @nx/next:build, outputs to dist/apps/web, output: 'standalone'
npx nx lint web
```

Frontend quality commands are wired into `apps/web/project.json` and the root scripts:

```bash
npm run lint:web             # source lint, Next/Hooks/a11y, zero warnings
npm run typecheck:web        # shared declarations, application and test types
npm run test:web             # Vitest and Testing Library
npm run test:e2e:web         # Playwright with separate test API/fixtures
npx nx typecheck web
npx nx test web
npx nx e2e web
```

For E2E, start `docker compose -f docker-compose.test.yml up -d --build --wait`, run `node apps/web/e2e/support/prepare-local.mjs`, and provide the documented sample account/organization environment variables. Stop that named test stack after the run.

Path alias `@/*` → `apps/web/src/*` is set up two ways that must stay in sync if changed: `tsconfig.json` (`paths`) for type-checking, and `next.config.js`'s webpack `alias` for bundler resolution.
