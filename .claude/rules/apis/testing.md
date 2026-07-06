---
paths:
  - "apps/api/**"
---

# API — Testing

- Jest + `ts-jest` via `@nx/jest` — always run through `nx test api`, not raw `jest`, except where noted below.
- `apps/api/jest.config.ts:13` — `testMatch` only globs `src/app/**/*.spec.ts` (confirmed Jul 2026). Specs under `src/common/**` (`gemini.service.spec.ts`, `pdf.service.spec.ts`, `local-storage.service.spec.ts`, `socket-io.service.spec.ts`) exist but are **silently excluded** from `nx test api` and from CI as currently configured. Run them with a direct `jest` invocation targeting the file if you touch that code; don't assume they're part of the normal test run. Worth widening the glob before Phase 4 starts moving code across service boundaries.
- No coverage threshold is enforced in `jest.config.ts`.
- Mocking: use the factories in `src/test-utils/unit-test-helpers.ts` (`createPrismaMock`, `createQueueMock`, `createSocketMock`, `createJwtMock`, `createRedisMock`, `mockRequest`, `mockResponse`) instead of ad hoc mocks. `createPrismaMock()` enumerates every Prisma model/method actually used by services — when a new spec needs a model method not yet listed, add it there. Its `$transaction` mock runs the callback against a nested mock, so `prisma.$transaction(async (tx) => ...)` works without a live DB.
