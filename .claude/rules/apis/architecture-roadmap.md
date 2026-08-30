---
paths:
  - "apps/api/**"
---

# API — Architecture & Key Decisions

Full scorecard and rationale: `docs/current-state.md`. Full phased plan: `docs/migration-roadmap.md`.

Today: modular monolith (NestJS) + PostgreSQL + Redis + BullMQ + Socket.IO. Target (Jan 2027): microservices via NATS (async) + gRPC (sync, e.g. auth token validation), pgvector for RAG, LiveKit for video — extracted in coupling order (`ai-service` first, core `job`/`application` services last). Roadmap shape:

```
Phase 0 (now, ~2wk)   Foundation fixes: retry, rate limiting, logging, env validation, Helmet
Phase 1 (Jul–Aug 26)  Complete core candidate/recruiter workflows; async startSession(); file validation
Phase 2 (Sep 26)      RAG: pgvector + EmbeddingService + RagService, question bank, CV screening calibration
Phase 3 (Oct 26)      LiveKit video call integration
Phase 4 (Nov–Dec 26)  Strangler Fig extraction into microservices
Phase 5 (Dec 26–Jan27)Production hardening: backups, CI/CD, observability, security
```

Guiding principle from the roadmap: prioritize working end-to-end flows and visible AI features over architectural purity — don't refactor toward microservices ahead of Phase 4.
