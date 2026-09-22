# Checkpoint 1 — Organization enforcement (GĐ1 Tuần 2)

**Dates:** 2026-09-14 (base branch) · 2026-09-16 (mechanism). The human asked to work directly,
without the governed skill; the two genuine design choices were still put as `AskUserQuestion` calls,
per their standing preference ("khỏi gọi skill … nhưng mà các decision có các option gì").

## Q0 — where to branch from (2026-09-14)

PR #60 (Tuần 1) was unmerged; Tuần 2 needs its schema.

- **Answered:** "Merge #60 trước, rồi cắt từ dev (khuyến nghị)".
- **What happened:** #60 was still unmerged when the human then asked to proceed directly. Merging
  is the human's action and was not taken; the branch was stacked on the Tuần 1 branch instead
  (`decision.md` D1).

## Q1 — filtering mechanism (2026-09-16)

Put with the survey finding that recruiters were already organization-isolated through the
department checks, so the real work was the admin special cases and the gap surfaces.

| Option | Cost stated |
|---|---|
| Manual via a central helper | a future endpoint that forgets the helper leaks |
| Prisma `$extends` | needs AsyncLocalStorage; socket still separate; platform bypass; unprovable with mocks |
| Postgres RLS | ALS + per-query transactions + DB role change; no test touches a real DB |

**Answered:** "Manual qua helper tập trung (khuyến nghị)".

## Q2 — propagation (2026-09-16)

| Option | Cost stated |
|---|---|
| Resolve in JwtStrategy, pass explicitly | method signatures change |
| JWT claim at login | contradicts the codebase's own freshness rule |
| AsyncLocalStorage | stated as "new dependency (nestjs-cls) or hand-rolled" — **inaccurate**, see below |

**Answered:** "Resolve trong JwtStrategy, truyền tường minh (khuyến nghị)".

**Correction.** `nestjs-cls` was already installed. The option was described with one cost it did
not have. Its remaining costs (implicit dependency; BullMQ and Socket.IO outside the request
context) still favour the choice made, and the misstatement is recorded in `decision.md` D3 rather
than left standing.
