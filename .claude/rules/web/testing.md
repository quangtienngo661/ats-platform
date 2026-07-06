---
paths:
  - "apps/web/**"
---

# Web — Testing

No test framework is wired up for `apps/web` — see `commands.md`. If asked to add tests, mirror the jest setup from `apps/api/jest.config.ts` (the `@nx/jest` plugin, `*.spec.ts` files next to source) rather than inventing a different runner.
