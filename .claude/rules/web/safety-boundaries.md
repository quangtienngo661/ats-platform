---
paths:
  - "apps/web/**"
---

# Web — Safety Rules / Boundaries

- Don't hand-edit generated files: `next-env.d.ts`, `tsconfig.tsbuildinfo`.
- `NEXT_PUBLIC_*` env vars are exposed to the client bundle — never put secrets behind that prefix.
- `src/proxy.ts` gates auth/role access for the entire app — treat changes here as high-blast-radius; a missed entry in `privatePaths` or `roleProtectedPaths` silently opens or locks out a whole route (see `anti-patterns.md` for a live example of this class of bug).
- `Dockerfile` changes affect the deploy image — confirm before changing build stages.
