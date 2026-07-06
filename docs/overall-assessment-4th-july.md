# ATS Platform — Overall Assessment
> Source: Source code audit + Feature gap analysis + Technical evaluation
> Date: June 2026

---

## 1. Current Scorecard

| Dimension | Score | Notes |
|---|---|---|
| **Backend architecture** | 8.5/10 | Modular, BullMQ async, solid schema design |
| **AI integration** | 7/10 | Pipeline exists, missing RAG + scoring consistency |
| **Workflow completeness** | 5.5/10 | Multiple flows broken on the Candidate side |
| **Feature depth** | 5/10 | Recruiter side workable, Candidate side lacking |
| **Production readiness** | 4/10 | No structured logging, retry, rate limiting, or backup |
| **Frontend UX** | 6.5/10 | Kanban polished, several UI flows disconnected |
| **Observability** | 2/10 | Only AiUsageLog, nothing else |
| **Security** | 5.5/10 | Auth solid, missing Helmet, rate limiting, file validation |

**Overall: ~5.6/10** — Strong foundation, significant work remaining.

---

## 2. Strengths — Do Not Touch

### Schema design
Prisma schema with 24 models reflects deliberate design choices:
- Class-table inheritance (User → Candidate/Recruiter) avoids null column sprawl
- Append-only audit trail (`ApplicationHistory`) instead of overwriting status directly
- Named relations distinguish `Interviewer` vs `ScheduledBy` on the same target table
- JSON columns used selectively (only for AI-derived/semi-structured data)
- `@db.Decimal(5,1)` for scores — avoids floating point errors
- Indexes aligned with real query patterns (`[userId, isRead]`, `[actionType, createdAt]`, `[sessionId, orderIndex]`)

### AI pipeline depth
- 4 distinct action types: `cv_parsing`, `cv_scoring`, `mock_interview`, `job_parsing`
- Multi-model routing: Flash for lightweight tasks, Pro for heavy reasoning
- Batch question generation (10 questions in one Gemini call) reduces latency
- Every Gemini call logged to `AiUsageLog` (tokens, duration, status)
- `AiConfig` stored in DB — tunable without redeploy
- `ThinkingLevel` configured per use case (MEDIUM / HIGH)
- Queue-level rate limiting on cv-screening (15 jobs/60s)

### Realtime architecture
- Socket.IO rooms scoped by job (`job_{id}`) and session (`interview_{id}`)
- Kanban board updates live on new application or completed screening
- Interview session events emitted in real time

### Security foundation
- JWT access token + refresh token rotation
- Refresh token stored as hash in DB — individual tokens revocable
- `OwnershipGuard` prevents IDOR with cross-department access logic
- `VALID_TRANSITIONS` state machine enforces legal application status changes

### Monorepo setup
- Nx workspace with shared libs (`@ats-platform/database`, `@ats-platform/types`)
- GitHub Actions CI/CD using nx affected (only lint/test/build what changed)
- Docker Compose with healthcheck-based service dependencies

---

## 3. Issues — Classified by Severity

### Critical — Affects production and demo

**C1. BullMQ `attempts: 1` — retry never fires**
```typescript
defaultJobOptions: {
  attempts: 1,       // fix to 3
  backoff: { type: 'exponential', delay: 10000 }
}
```
Backoff is configured but useless with a single attempt. Gemini timeout → job dies permanently.

**C2. No rate limiting at the API layer**
`@nestjs/throttler` is installed but not activated. Auth endpoints have no request limits.

**C3. Candidate cannot view their interview schedule**
`InterviewSchedule` is created by recruiters and persisted in DB, but there is no route or UI for the candidate to see it. A demo reviewer will ask this immediately.

**C4. Application timeline has no UI**
`ApplicationHistory` stores full data (`fromStatus`, `toStatus`, `changedAt`, `notes`) but candidates have no visual timeline of their application journey.

**C5. Recruiter cannot add internal notes on an applicant**
No `ApplicationNote` model or equivalent. This is the most basic feature of any ATS.

**C6. `startSession()` calls Gemini synchronously inside an HTTP request**
```typescript
const aiResult = await this.geminiService.generateInterviewQuestions(...);
```
Gemini timeout is 120s. The HTTP request hangs for up to 120s before the client times out. Must be refactored to async queue before any scaling.

**C7. File upload does not validate magic bytes**
`LocalStorageService` is ~96 bytes. Real MIME type validation (not just extension) is unclear.

### High — Affects UX quality and demo impression

**H1. No structured logging**
`GlobalExceptionFilter` formats responses but logs nothing. Debugging production errors has no starting point.

**H2. Job search missing full filter support**
Public job listing exists, but filtering by category, salary range, location type, and skill is not confirmed to be fully implemented.

**H3. No interview feedback form**
After a real (non-mock) interview, recruiters have no structured form to record evaluation.

**H4. Retry count not surfaced in UI**
`retryCount` exists on `CVScreening` schema but is not visible to recruiters.

**H5. No graceful shutdown**
SIGTERM → running BullMQ jobs are killed abruptly. Mid-flight Gemini calls can leave data in an inconsistent state.

**H6. `job_parsing` action type not monitored separately**
`AiActionType.job_parsing` exists in the enum and is logged, but JD parsing latency and cost have no dedicated dashboard view.

### Medium — Feature gaps affecting depth

**M1. No AI job recommendation for candidates**
`CVParsedData.skills` and `JobPosting.parsedRequirements` are both available. A matching service is all that's missing.

**M2. No candidate comparison view for recruiters**
No side-by-side comparison of 2–3 candidates for the same job posting.

**M3. No conversion funnel in analytics**
Recruiter dashboard needs: Applied → Screening → Interview → Offer → Hired with counts and percentages.

**M4. No CSV/PDF export**
Cannot export a candidate list for a job posting.

**M5. `Skill.synonyms: Json?` is unused**
Field exists on the `Skill` model but CV screening does not use it for fuzzy skill matching.

**M6. `CandidateSkillSource` enum has no corresponding model**
`CandidateSkill` model is not implemented — the enum is orphaned.

**M7. `JobPosting` missing `createdAt`**
Only `publishedAt` exists. Creation timestamp is not recorded.

**M8. Email notifications incomplete**
Only verification email is implemented. Status changes and interview schedule notifications do not send emails.

---

## 4. Unified Roadmap

### Phase 0 — Foundation Fixes (2 weeks, start now)

```
[ ] Fix BullMQ attempts: 1 → 3                              ~1h
[ ] Activate @nestjs/throttler — rate limit auth endpoints  ~3h
[ ] Activate Swagger — /api/docs                            ~2h
[ ] Fail-fast environment variable validation               ~2h
[ ] Add createdAt to JobPosting (migration)                 ~30m
[ ] Winston structured logging + correlation ID middleware  ~1 day
[ ] GlobalExceptionFilter: log 5xx with stack trace         ~1h
```

### Phase 1 — Complete Core Workflows (3–4 weeks)

```
Candidate flows:
[ ] Candidate view of interview schedule                    ~2 days
[ ] Application timeline UI (backed by ApplicationHistory)  ~2 days
[ ] Job search: full filter + sort                          ~2 days

Recruiter flows:
[ ] ApplicationNote (internal notes on applicants)          ~2 days
[ ] Interview feedback form                                 ~2 days
[ ] Candidate comparison view                               ~2 days
[ ] Bulk trigger AI screening                               ~1 day
[ ] Export candidate list to CSV                            ~1 day

Technical:
[ ] Refactor startSession() → async queue                   ~2 days
[ ] File upload: magic byte validation + safe rename        ~1 day
[ ] Graceful shutdown (SIGTERM handler + BullMQ drain)      ~3h
[ ] Health check endpoint (/health — Postgres + Redis)      ~3h
```

### Phase 2 — AI Upgrade with RAG (3–4 weeks)

```
Infrastructure:
[ ] Add pgvector extension to PostgreSQL                    ~2h
[ ] EmbeddingService (Google text-embedding-004)            ~1 day
[ ] RagService (cosine similarity search, top-K retrieval)  ~2 days

Features:
[ ] Question bank: admin UI + embedding pipeline            ~3 days
[ ] generateInterviewQuestions → RAG-augmented              ~2 days
[ ] CV screening: historical calibration via RAG            ~3 days
[ ] AI job recommendation for candidates                    ~3 days
    (CVParsedData.skills ←match→ JobPosting requirements)

Analytics:
[ ] Funnel conversion chart (Applied → Hired)               ~2 days
[ ] Time-in-stage metrics (using currentStageSince)         ~1 day
[ ] AI cost estimation dashboard (tokens × price)           ~1 day
[ ] Admin system-wide analytics page                        ~2 days
```

### Phase 3 — Video Call Integration (3 weeks)

```
Infrastructure:
[ ] LiveKit server in docker-compose.yml                    ~2h
[ ] livekit.yaml config                                     ~2h

Backend:
[ ] LiveKit room management service (create, token, close)  ~2 days
[ ] Integrate with InterviewSchedule (online type)          ~1 day
[ ] Notification: send meeting link to candidate            ~1 day

Frontend:
[ ] VideoCallRoom component (@livekit/components-react)     ~3 days
[ ] Waiting room (candidate joins, recruiter admits)        ~1 day
[ ] In-call chat (using existing Socket.IO)                 ~2 days
[ ] Screen share toggle (LiveKit built-in)                  ~2h
```

### Phase 4 — Microservices Extraction (4–6 weeks)

```
Step 1: Transport layer
[ ] NATS server in docker-compose                           ~2h
[ ] NestJS hybrid app mode (HTTP + Microservice)            ~1 day

Step 2: ai-service (least coupled)
[ ] ai-service: GeminiService + RAG as standalone service   ~1 week
[ ] Circuit breaker + retry inside ai-service               ~2 days

Step 3: notification-service
[ ] notification-service: in-app + email                   ~1 week

Step 4: auth-service
[ ] auth-service: JWT, refresh token management             ~1 week

Step 5: cv-service
[ ] cv-service: upload + parsing pipeline                   ~1 week

Step 6: Core services (after Phase 1–4 are stable)
[ ] job-service, application-service, interview-service     ~2–3 weeks

Step 7: video-service
[ ] Extract LiveKit integration as standalone service        ~1 week
```

### Phase 5 — Production Hardening (2–3 weeks)

```
[ ] Automated PostgreSQL backup (pg_dump + S3)              ~2 days
[ ] Redis AOF persistence                                   ~2h
[ ] Helmet security headers                                 ~2h
[ ] CI/CD deploy pipeline (staging → production)            ~1 week
[ ] Grafana Loki (log aggregation)                          ~2 days
[ ] Prometheus + Grafana metrics                            ~3 days
[ ] SSL auto-renewal (certbot already configured)           ~2h
[ ] Basic load testing (k6 or Artillery)                    ~1 day
```

---

## 5. Timeline

```
July 2026       Phase 0 + Phase 1 start
August 2026     Phase 1 complete (core workflows demo-ready)
September 2026  Phase 2 (RAG + Analytics)
October 2026    Phase 3 (Video Call)
November 2026   Phase 4 start (first 2 services)
December 2026   Phase 4 continued + Phase 5 start
January 2027    Phase 4 complete + Phase 5 + buffer
```

---

## 6. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| RAG retrieval quality (noise in results) | Medium | Medium | Offline evaluation before deploy |
| Microservices distributed transaction failures | High | High | Shared DB first, Saga pattern later |
| LiveKit TURN server configuration | Low | Low | LiveKit has built-in TURN; coturn as fallback |
| Timeline too tight for 1 developer | High | High | Phase 4 (Microservices) is optional if slipping |
| Gemini API cost increase with RAG | Low | Medium | RAG reduces prompt size — net cost similar |
| PostgreSQL data loss (no backup yet) | Medium | Critical | Do Phase 5 backup immediately, do not wait |

---

## 7. Verdict

### What the system is today
A **well-structured Modular Monolith** with a genuine AI pipeline, but with **multiple broken workflows on the Candidate side** and no **production safety net**.

### Non-negotiable priority order

```
1. Fix critical bugs (BullMQ attempts, startSession async)
2. Complete broken workflows (candidate schedule view, timeline UI)
3. RAG + Job Recommendation
4. Video Call
5. Microservices (extract incrementally)
6. Production hardening (run in parallel with 4–5)
```

### Key principle

RAG and Microservices are **architecture concerns** — technically impressive but invisible to end users.

Video Call, Job Recommendation, and Timeline visualization are **user-visible** — they can be demoed in 30 seconds.

If forced to choose between "polished RAG but missing features" vs "basic RAG but complete feature set" → choose the latter for the academic deliverable.
