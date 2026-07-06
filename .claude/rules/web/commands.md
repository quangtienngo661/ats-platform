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

There is **no `test` target for `apps/web`** in `project.json` — no jest config exists for this project, and no test files exist under `apps/web` today (see `testing.md`). Don't assume `nx test web` works; if you add tests here, wire up a jest config first (mirror `apps/api/jest.config.ts`) before writing test files.

Path alias `@/*` → `apps/web/src/*` is set up two ways that must stay in sync if changed: `tsconfig.json` (`paths`) for type-checking, and `next.config.js`'s webpack `alias` for bundler resolution.
