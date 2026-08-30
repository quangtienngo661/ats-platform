---
paths:
  - "apps/api/**"
---

# API — Testing

- Jest + `ts-jest` via `@nx/jest` — always run through `nx test api`, not raw `jest`, except where noted below.
- `apps/api/jest.config.ts` — `testMatch` globs **both** `src/app/**/*.spec.ts` and `src/common/**/*.spec.ts` (widened 2026-07-14, Phase 0.5). Before that it only matched `src/app/**`, so every spec under `src/common/**` (`gemini.service.spec.ts`, `socket-io.service.spec.ts`, `pdf.service.spec.ts`, `local-storage.service.spec.ts`) was **silently excluded** from `nx test api` and from CI — two of them had been broken for months without anyone noticing (they instantiated Nest services with no mocked dependencies). A spec that never runs is worse than no spec: it looks like coverage. If you add a spec anywhere else under `src/`, check it's actually matched.
- No coverage threshold is enforced in `jest.config.ts`.
- Mocking: use the factories in `src/test-utils/unit-test-helpers.ts` (`createPrismaMock`, `createQueueMock`, `createSocketMock`, `createJwtMock`, `createRedisMock`, `mockRequest`, `mockResponse`) instead of ad hoc mocks. `createPrismaMock()` enumerates every Prisma model/method actually used by services — when a new spec needs a model method not yet listed, add it there. Its `$transaction` mock runs the callback against a nested mock, so `prisma.$transaction(async (tx) => ...)` works without a live DB.
