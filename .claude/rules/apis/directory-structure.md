---
paths:
  - "apps/api/**"
---

# API — Directory Structure

- `src/app/*` — one folder per business domain, following `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto/*.dto.ts` + a `*.controller.spec.ts`/`*.service.spec.ts` pair. Async work sits in `processors/*.processor.ts` (`@Processor`). `interviews/` is the fullest example (own `session/` sub-feature: gateway + processor + service for the live Q&A loop) — **follow its module shape**, but **not** its gateway internals (see `anti-patterns.md`).
- **`dto/` (singular) is the standard** — `interviews`, `job-postings`, `notifications` use it correctly. `auth`, `candidates`, `departments`, `job-categories`, `recruiters`, `skills`, `ai-config`, `applications`, `users` currently use `dtos/` (plural) instead — legacy naming drift, not a deliberate convention. Don't create another `dtos/` folder; align to `dto/` opportunistically when you're already touching one of those modules. `ai-usage-logs` and `cv-screenings` have no dto folder at all (as of Jul 2026) — add one before adding new endpoints to either.
- `cvs/cv-parsed-data/` and `job-postings/job-posting-skills/` are helper-service subfolders (service + spec only, no controller/module) — intentional pattern for shared/derived logic scoped to one parent domain; fine to replicate for similar single-purpose helpers.
- `src/common/*` — cross-cutting infra, each with its own module: `prisma/`, `redis/`, `storage/` (local disk CV persistence), `mail/`, `pdf/` (thin `pdf-parse` wrapper), `socket-io/` (shared emit layer — see `code-conventions.md`), `external-apis/gemini/` (single Gemini entry point — see `code-conventions.md`), `guards/`+`decorators/` (`RolesGuard`/`@Roles()`, `OwnershipGuard`/`@Resources()`), `filters/global-exception.filter.ts` + `interceptors/transform.interceptor.ts` (global response shaping, registered in `main.ts`), `interceptors/cv-upload.interceptor.ts` (Multer config), `configs/gemini.config.ts` + `constants/gemini-api.ts` (model/prompt constants).
- `src/test-utils/unit-test-helpers.ts` — shared Jest mock factories, see `testing.md`.
- `src/main.ts` — bootstrap: global prefix `api`, global `ValidationPipe` (whitelist + forbidNonWhitelisted, Vietnamese messages), `cookie-parser`, CORS locked to `CLIENT_URL`/`localhost:3000`, global interceptor + filter, Swagger UI mounted at `/api` via `SwaggerModule.setup('api', ...)` (shares the same path as the global API prefix — worth a distinct path like `/api/docs` per the roadmap, but the docs endpoint does exist today).
