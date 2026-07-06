# ATS Platform — Migration Roadmap
> Target: Production-ready, feature-complete ATS with RAG, Video Call, and Microservices
> Timeline: July 2026 → January 2027

---

## Architecture targets

```
Current:  Modular Monolith (NestJS) + PostgreSQL + Redis + BullMQ + Socket.IO
Target:   Microservices via NATS + pgvector (RAG) + LiveKit (video) + Shared DB → per-service DB
```

Extraction order follows coupling depth — least coupled services first.

---

## Phase 0 — Foundation Fixes
**Duration: 2 weeks | Start: immediately**

Fixes issues that block everything else. All items use already-installed packages.

```
[ ] BullMQ: raise attempts from 1 to 3 per queue                   ~1h
[ ] Activate @nestjs/throttler — rate limit /auth/* endpoints       ~3h
[ ] Activate @nestjs/swagger — expose /api/docs                     ~2h
[ ] Fail-fast env validation on startup (Joi or class-validator)    ~2h
[ ] Add createdAt to JobPosting schema (Prisma migration)           ~30m
[ ] Winston structured logging + correlation ID middleware           ~1 day
[ ] GlobalExceptionFilter: log 5xx errors with stack trace          ~1h
[ ] Helmet security headers in main.ts                              ~1h
```

---

## Phase 1 — Complete Core Workflows
**Duration: 3–4 weeks | Month: July–August 2026**

Close broken end-to-end flows before adding new features. A demo that fails mid-workflow is worse than a demo with fewer features.

### Candidate flows
```
[ ] Candidate view of their InterviewSchedule (route + UI)          ~2 days
[ ] Application timeline visualization (backed by ApplicationHistory) ~2 days
[ ] Job search: filter by category, location type, salary, skill    ~2 days
```

### Recruiter flows
```
[ ] ApplicationNote — internal notes per application                ~2 days
[ ] Interview feedback form (structured post-interview evaluation)  ~2 days
[ ] Candidate comparison — side-by-side view for a job posting      ~2 days
[ ] Bulk trigger AI screening for multiple applicants               ~1 day
[ ] Export candidate list to CSV                                    ~1 day
```

### Technical debt
```
[ ] Refactor startSession() → async BullMQ job (remove sync Gemini call) ~2 days
[ ] File upload: magic byte validation + UUID-based safe rename      ~1 day
[ ] Graceful shutdown: SIGTERM handler + BullMQ worker drain         ~3h
[ ] Health check endpoint: GET /health (Postgres + Redis)            ~3h
[ ] CandidateSkill model + migration (resolve orphan enum)           ~1 day
```

### Email notifications
```
[ ] Email on application status change (interview, offer, rejected)  ~2 days
[ ] Email on InterviewSchedule creation → send meeting details       ~1 day
[ ] HTML email templates (nodemailer + inline styles)                ~1 day
```

---

## Phase 2 — AI Upgrade with RAG
**Duration: 3–4 weeks | Month: September 2026**

Replace direct LLM generation with retrieval-augmented generation where it adds measurable value. RAG does not replace Gemini — it enriches the prompt with retrieved context before generation.

### RAG targets by use case

| Use case | RAG benefit |
|---|---|
| CV parsing | None — extraction task, LLM already sufficient |
| JD parsing | Medium — retrieve skill taxonomy to normalize output |
| CV screening | High — retrieve historical screenings to calibrate score consistency |
| Interview question generation | Highest — retrieve from curated question bank instead of generating from scratch |

### Infrastructure
```
[ ] Enable pgvector extension on existing PostgreSQL instance        ~2h
[ ] EmbeddingService — Google text-embedding-004 via existing API key ~1 day
[ ] RagService — cosine similarity search, configurable top-K        ~2 days
```

### Features
```
[ ] Question bank schema + Admin UI (input, embed, store questions)  ~3 days
[ ] generateInterviewQuestions → inject retrieved questions as context ~2 days
[ ] CV screening: retrieve similar past screenings for calibration    ~3 days
[ ] Skill taxonomy: embed synonyms, use in fuzzy skill matching       ~2 days
[ ] AI job recommendation for candidates                             ~3 days
    (embed CVParsedData.skills → match against JobPosting embeddings)
```

### Analytics
```
[ ] Funnel conversion chart: Applied → Screening → Interview → Offer → Hired ~2 days
[ ] Time-in-stage metrics per application (uses currentStageSince)   ~1 day
[ ] AI cost estimation panel (promptTokens × model price)            ~1 day
[ ] Admin system analytics page (jobs, candidates, AI usage by month) ~2 days
```

---

## Phase 3 — Video Call Integration
**Duration: 3 weeks | Month: October 2026**

LiveKit chosen for: open-source, self-hostable via Docker, official React SDK, built-in TURN/STUN server, Node.js SDK for token management.

`InterviewSchedule.onlineMeetingLink` and `InterviewType.online` already exist in the schema — no new models required, only a room name field to add.

### Infrastructure
```
[ ] Add LiveKit service to docker-compose.yml                        ~2h
[ ] livekit.yaml config (API key, secret, TURN settings)             ~2h
```

### Backend
```
[ ] LiveKitService — create room, generate participant tokens         ~2 days
[ ] Auto-close room after scheduled time + 30 min buffer             ~3h
[ ] Integrate with InterviewSchedule: trigger room creation on save   ~1 day
[ ] Notification to candidate with meeting link on schedule creation  ~1 day
[ ] Add livekitRoomName to InterviewSchedule schema                  ~30m
```

### Frontend
```
[ ] VideoCallRoom page — @livekit/components-react                   ~3 days
[ ] Waiting room: candidate enters, recruiter admits                  ~1 day
[ ] In-call text chat via existing Socket.IO                         ~2 days
[ ] Screen share (LiveKit built-in, expose toggle button)            ~2h
[ ] Call timer + recording indicator                                  ~1 day
```

---

## Phase 4 — Microservices Extraction
**Duration: 4–6 weeks | Month: November–December 2026**

Strategy: Strangler Fig — extract services incrementally from the monolith. Keep Shared DB throughout this phase; per-service DB split is post-January.

Transport: NATS for async event messaging + gRPC for sync inter-service calls (e.g. auth token validation).

### Target architecture
```
Internet → Nginx → NestJS API Gateway
                       ├── auth-service      (JWT, refresh token)
                       ├── user-service      (users, candidates, recruiters)
                       ├── job-service       (postings, categories, skills, departments)
                       ├── application-service (applications, kanban, history)
                       ├── cv-service        (upload, PDF parse, CV pipeline)
                       ├── ai-service        (Gemini wrapper + RAG)
                       ├── interview-service (schedule, mock interview, video call)
                       ├── notification-service (in-app + email)
                       └── video-service     (LiveKit room management)
```

### Extraction order
```
Step 1: Transport layer setup
[ ] NATS server in docker-compose                                    ~2h
[ ] NestJS hybrid app mode (HTTP + Microservice transport)           ~1 day

Step 2: ai-service (isolated — receives input, calls Gemini, returns output)
[ ] Extract GeminiService + RagService + EmbeddingService            ~1 week
[ ] Circuit breaker pattern (closed → open → half-open)              ~2 days
[ ] Retry with backoff inside the service boundary                    ~1 day

Step 3: notification-service (event consumer only)
[ ] Extract NotificationsService + MailService + BullMQ mail queue   ~1 week

Step 4: auth-service (stateless token handling)
[ ] Extract AuthModule + RefreshToken logic                          ~1 week
[ ] gRPC endpoint for token validation (called by API gateway)       ~2 days

Step 5: cv-service
[ ] Extract CVs module + PdfService + cv-processing queue            ~1 week

Step 6: Core services (highest coupling — do last)
[ ] job-service, application-service                                 ~2 weeks
[ ] interview-service (depends on ai-service + video-service)        ~1 week

Step 7: video-service
[ ] Extract LiveKitService as standalone microservice                ~1 week
```

---

## Phase 5 — Production Hardening
**Duration: 2–3 weeks | Month: December 2026 – January 2027**

Run in parallel with Phase 4 where possible.

```
Data safety (start immediately, do not wait for Phase 5):
[ ] Automated pg_dump → compress → upload to S3/R2 (daily)          ~2 days
[ ] Redis AOF persistence (append-only file mode)                    ~2h
[ ] Verify backup restore monthly (automated test script)            ~1 day

CI/CD:
[ ] Docker image build + push per service on merge to main           ~2 days
[ ] Staging environment: auto-deploy on push to develop              ~2 days
[ ] Production: manual approve gate before deploy                    ~1 day
[ ] Prisma migrate run as pre-deploy step                            ~2h

Observability:
[ ] Grafana Loki: ship Winston logs from all services                ~2 days
[ ] Prometheus metrics endpoint per service (/metrics)               ~2 days
[ ] Grafana dashboards: error rate, p95 latency, queue depth, AI cost ~2 days
[ ] Alert rules: error rate > 1%, queue depth > 100, latency p95 > 2s ~1 day

Security:
[ ] Dependency audit (npm audit + Dependabot)                        ~2h
[ ] PII masking in logs (email, phone)                               ~1 day
[ ] Basic load test (k6 or Artillery) before production launch       ~1 day
```

---

## Timeline Summary

```
July 2026       Phase 0 complete + Phase 1 in progress
August 2026     Phase 1 complete — all core workflows demo-ready
September 2026  Phase 2 — RAG + analytics
October 2026    Phase 3 — Video Call
November 2026   Phase 4 start — ai-service + notification-service
December 2026   Phase 4 continued + Phase 5 start
January 2027    Phase 4 complete + Phase 5 + buffer
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| RAG retrieval quality (noise) | Medium | Medium | Offline evaluation set before deploy |
| Distributed transaction failure across services | High | High | Shared DB for entire Phase 4; Saga after January |
| LiveKit TURN config for NAT traversal | Low | Low | Built-in TURN; coturn as fallback |
| Timeline slip (solo developer) | High | High | Phase 4 is deprioritized if Phase 1–3 slip |
| Gemini API cost increase with RAG | Low | Medium | RAG shortens prompts; net cost similar or lower |
| PostgreSQL data loss before backup is set up | Medium | Critical | Do backup setup in Phase 0, not Phase 5 |

---

## Guiding principle

Feature completeness is visible. Architectural patterns are not.

Prioritize in this order: working end-to-end flows → AI features users see → video call → microservices.
