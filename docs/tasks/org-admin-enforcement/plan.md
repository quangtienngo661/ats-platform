# Plan — what remains (GĐ1 Tuần 2)

> Only the work still to do. This run had no plan-mode gate: the human asked to work directly, and
> the design choices were put as questions instead (`checkpoint-1.md`, `checkpoint-2.md`). What was
> built is in `decision.md`, `spec.md` and the diff; what was run is in `operation.md`; this file is the
> remainder.

**As of 2026-09-19:** migrations applied locally, CHECK constraint probed, the two-organization walk
passed (39/39) against the rebuilt API — surfacing one real defect, fixed by migration `20260919053000`
(D11) — and the organization picker was looked at in a browser as the platform admin (`operation.md` §5).
Unit gate as of 2026-09-18: test 314/314 · lint 0 errors · build 4/4.

| # | Remaining | Rests on |
|---|---|---|
| 1 | Re-run the gate (test · lint · build) since a migration was added, then commits in this order: (a) the `/users/me` RED test alone, (b) its fix; (c) the per-organization default probe + its RED output, (d) the migration; then the feature commits. Only when the human asks | `rules/git-conventions.md` (defect = test first) |
| 2 | Push + PR, stacked on PR #60 or re-based once #60 is merged — the human's call | `checkpoint-1.md` Q0 |
| 3 | Tuần 3, not this run: web routing and UI for `org_admin` (`proxy.ts` sends it to `/403`), org-admin management screens, an organization label on the admin's department and AI-config lists (two "Mặc định" configs are indistinguishable today), `org_admin` in the user-management `ROLES` lists | `survey.md` web section · `decision.md` D10 · `operation.md` §5 |

**Recorded, pre-existing, not this run's:** the socket `join_job_room` race at handshake; the web Docker
image failing `npm ci` on `node:24-alpine`; and the AI-config form's "Hủy"/"X" buttons submitting the form
(confirmed in the browser — a cancelled form creates the config). All three in `operation.md`.
