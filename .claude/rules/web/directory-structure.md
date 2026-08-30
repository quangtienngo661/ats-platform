---
paths:
  - "apps/web/**"
---

# Web — Directory Structure

`src/app/*` is partitioned into route groups by audience, each with its own `layout.tsx`:
- `(admin)` — department/job-category/skill/recruiter/user management, AI configuration, AI usage logs, company profile, interview-topic management.
- `(recruiter)` — dashboard, job postings, kanban, interview scheduling.
- `(candidate)` — profile, CVs, applications.
- `(auth)` — sign-in/register/password reset, guest-only.
- `(interview-session)` — the live AI mock-interview chat + result pages, deliberately isolated from the dashboard layouts (full-screen real-time experience).
- `(public)` — marketing/landing + public job postings listing (`/job-postings`), no auth required.

Route groups don't imply access control by themselves — that's enforced centrally in `src/proxy.ts` (see `code-conventions.md`).

Other load-bearing directories:
- `src/servers/<domain>/*.action.ts` — the only place allowed to call the backend (`code-conventions.md`).
- `src/stores/*` — one Zustand store per cross-page/real-time concern.
- `src/components/hydrators/*` — bridges server-fetched data into a Zustand store on mount (`code-conventions.md`).
- `src/components/common/*` — currently only 6 files (`Logo`, `ConfirmModal`, `SubmitButton`, `RichTextEditor`, `GlobalSocketInit`, `InitSocketRoom`). There is **no shared UI primitive layer** (no `Button`/`Card`/`Badge`/`Input`) — every `*-management/ui`, `job-postings/ui`, etc. folder reimplements its own card/header/stat markup. Don't assume a base component exists; check the specific feature's `ui/` folder for the nearest existing pattern to copy, and see `anti-patterns.md` before adding a new one from scratch.
