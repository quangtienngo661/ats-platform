# ATS Platform — Current State
> Source code audit as of June 2026. Basis for the migration roadmap.

---

## Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Backend architecture | 8.5/10 | Modular, BullMQ async, solid schema |
| AI integration | 7/10 | Pipeline exists, missing RAG + scoring consistency |
| Workflow completeness | 5.5/10 | Multiple flows broken on the Candidate side |
| Feature depth | 5/10 | Recruiter side workable, Candidate side lacking |
| Production readiness | 4/10 | No logging, retry, rate limiting, or backup |
| Frontend UX | 6.5/10 | Kanban polished, several UI flows disconnected |
| Observability | 2/10 | Only AiUsageLog, nothing else |
| Security | 5.5/10 | Auth solid, missing Helmet, rate limiting, file validation |

**Overall: ~5.6/10**

---

## Strengths

### Schema design
- Class-table inheritance: `User → Candidate / Recruiter` (avoids null column sprawl)
- Append-only audit trail: `ApplicationHistory` (fromStatus, toStatus, changedAt, notes)
- Named relations: `Interviewer` vs `ScheduledBy` on the same `User` target
- JSON columns used only for AI-derived / semi-structured data
- `@db.Decimal(5,1)` for all score fields — no floating point errors
- Indexes aligned with real query patterns: `[userId, isRead]`, `[actionType, createdAt]`, `[sessionId, orderIndex]`
- 17 native PostgreSQL enums via Prisma — validated at DB level

### AI pipeline
- 4 distinct action types: `cv_parsing`, `cv_scoring`, `mock_interview`, `job_parsing`
- Multi-model routing: Flash for lightweight tasks, Pro for heavy reasoning
- Batch question generation (10 questions per Gemini call)
- Every Gemini call tracked in `AiUsageLog` (tokens, duration, status)
- `AiConfig` persisted in DB — weights/thresholds adjustable without redeploy
- `ThinkingLevel` configured per use case (MEDIUM / HIGH)
- Queue-level rate limit on cv-screening: 15 jobs / 60s

### Realtime
- Socket.IO rooms scoped by job (`job_{id}`) and session (`interview_{id}`)
- Kanban board updates live on new application or completed screening
- Interview session events emitted via Socket.IO gateway

### Security
- JWT access token + refresh token rotation
- Refresh token stored as hash in DB — individual tokens revocable
- `OwnershipGuard`: IDOR prevention with cross-department access logic
- `VALID_TRANSITIONS` state machine enforces legal application status changes

### Infrastructure
- Nx monorepo with shared libs: `@ats-platform/database`, `@ats-platform/types`
- GitHub Actions CI/CD using `nx affected`
- Docker Compose with healthcheck-based service dependencies
- Nginx reverse proxy with Let's Encrypt volume mounts already in place

---

## Issues

### Critical

**C1. BullMQ `attempts: 1` — retry never fires**
- `backoff: { type: 'exponential', delay: 10000 }` is configured but useless with a single attempt
- Gemini timeout → job dies permanently with no retry
- Fix: raise `attempts` to 3 per queue

**C2. No API-layer rate limiting**
- `@nestjs/throttler` is installed but not activated
- Auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`) have no request cap

**C3. Candidate cannot view their interview schedule**
- `InterviewSchedule` is created by recruiters and persisted, but no candidate route or UI exists
- Candidates have no way to know when or where their interview is

**C4. Application timeline has no UI**
- `ApplicationHistory` stores full state transition data but is never surfaced to candidates
- Candidates cannot track the journey of their own application

**C5. Recruiters cannot add internal notes on applicants**
- No `ApplicationNote` model or equivalent exists
- The most basic ATS feature is absent

**C6. `startSession()` calls Gemini synchronously inside an HTTP request**
- `interview-session.service.ts L43`: `await geminiService.generateInterviewQuestions(...)`
- Gemini timeout is 120s → HTTP request hangs → client times out before receiving a response
- Must be refactored to async queue before any load can be sustained

**C7. File upload does not validate magic bytes**
- `LocalStorageService` is ~96 bytes — real MIME type verification is absent
- Extension-only validation is bypassable

### High

**H1. No structured logging**
- `GlobalExceptionFilter` formats response payloads but logs nothing
- 5xx errors leave no trace; production debugging has no starting point

**H2. Job search missing full filter support**
- Public job listing exists but filtering by category, salary range, location type, and skill is not confirmed complete

**H3. No interview feedback form**
- After a real (non-mock) interview, recruiters have no structured evaluation form

**H4. Retry count not surfaced in UI**
- `retryCount` exists on `CVScreening` schema but is invisible to recruiters

**H5. No graceful shutdown**
- SIGTERM kills running BullMQ jobs abruptly
- In-flight Gemini calls can leave `CVScreening` or `InterviewQnA` stuck in a `processing` state

**H6. `job_parsing` not separately monitored**
- `AiActionType.job_parsing` is logged but JD parsing latency/cost has no dedicated dashboard view

### Medium

**M1. No AI job recommendation for candidates**
- `CVParsedData.skills` and `JobPosting.parsedRequirements` are both available
- A skill-matching service is all that is missing

**M2. No candidate comparison view**
- Recruiters cannot select 2–3 candidates and compare them side-by-side

**M3. No conversion funnel in analytics**
- Applied → Screening → Interview → Offer → Hired counts and percentages are not visualized

**M4. No CSV/PDF export**
- Candidate lists for a job posting cannot be exported

**M5. `Skill.synonyms` is unused**
- `Json?` field exists on the `Skill` model but CV screening ignores it for fuzzy skill matching

**M6. `CandidateSkillSource` enum has no model**
- `CandidateSkill` model was never implemented — the enum is orphaned

**M7. `JobPosting` missing `createdAt`**
- Only `publishedAt` is recorded; creation timestamp is absent

**M8. Email notifications incomplete**
- Only verification email is implemented
- Status changes and interview schedule creation do not trigger emails
