# ATS Platform — Migration Roadmap

> Target: Production-ready, feature-complete ATS with RAG, Video Call, Voice AI, and Microservices
> Timeline: July 2026 → January 2027

Quyết định kiến trúc quan trọng (lý do, trade-off, lựa chọn đã cân nhắc) được ghi chi tiết dưới dạng ADR ở `docs/architecture-decisions/` — file này chỉ giữ checklist + timeline, không lặp lại phần giải thích "tại sao".

---

## Progress Log

Mốc tiến độ quan trọng, cập nhật mỗi khi hoàn thành một phần đáng kể — không thay thế checklist từng phase bên dưới (vẫn dùng `[x]`/`[ ]` ở đó), chỉ tóm tắt theo thời gian để dễ nhìn lại khi viết báo cáo.

- **2026-07-06 → 07**: Phase 0 hoàn tất toàn bộ (BullMQ retry, rate limiting, structured logging, magic-byte validation, async `startSession()`, Helmet, env validation, Swagger). Ngoài phạm vi Phase 0, dọn thêm: bỏ direct Prisma access ở `cvs.controller.ts`/`interview.gateway.ts`, xoá `@WebSocketServer()` thừa, type hết `any` ở 5 BullMQ processor + `cv-screenings.service.ts`. Chi tiết: `.claude/rules/apis/anti-patterns.md` Status Tracker.
- **2026-07-11**: Phát hiện + fix container `ats-api` (docker-compose.yml prod) crash-loop do `@napi-rs/canvas` cài nhầm bản glibc trong khi base image là Alpine (musl). Xem [ADR 0001](architecture-decisions/0001-docker-base-image-glibc.md). Đã sửa `apps/api/Dockerfile`, **đang chờ verify sau rebuild**.
- **2026-07-11**: Rà soát `schema.prisma` cho kế hoạch RAG + microservices — phát hiện thiếu index trên nhiều cột FK, chưa chốt nguồn dữ liệu embed (`Candidate.profileData` vs `CVParsedData.*`), chưa gán service sở hữu cho bảng dùng chung (`Department`/`Skill`/`JobCategory`/`AiConfig`). Đã đưa vào checklist Phase 1/2/4 bên dưới.
- **2026-07-12 → 14**: Audit toàn bộ service layer đối chiếu schema (`docs/audit/`) + research so sánh với ATS thật (`docs/research/`) + kiểm chứng lại từng mục Phase 0 trên code. **Kết quả: Phase 0 chưa thật sự xong — vài mục đã tick nhưng không có tác dụng lúc chạy** (chi tiết ở Phase 0 bên dưới). Phát sinh **Phase 0.5 — Stabilization**, chèn trước khi chạy tiếp Phase 1.
- **2026-07-15**: Research 2 hướng mở rộng: (1) tích hợp voice cho AI mock interview, (2) các tính năng khác biệt hoá so với ATS lớn ngoài phạm vi 2 brief 2026-07-13. Chi tiết: [`docs/research/2026-07-15-voice-video-microservices-differentiators.md`](research/2026-07-15-voice-video-microservices-differentiators.md). Kết luận chính: voice nên dùng **LiveKit Agents + Gemini Live** (tái dùng key Gemini + LiveKit đã định ở Phase 3, không cần vendor thứ 3) và nên làm **sau** Phase 3 vì phụ thuộc server LiveKit đã tồn tại. Thêm **Phase 1.5** (AI co-pilot gợi ý hành động trên Kanban, panel "ứng viên đáng xem lại", Judge0 coding assessment — không phụ thuộc RAG/video/microservices nên làm sớm được) và **Phase 3.5** (Voice AI, sau Phase 3) vào roadmap bên dưới. Số thứ tự Phase 0–5 giữ nguyên, dùng hậu tố `.5` để không phải sửa lại các file khác đang trỏ theo số phase.
- **2026-07-16**: (1) Refactor `AiRecommendation`: bỏ mức `hire` — sàng lọc CV giờ chỉ đề xuất `interview`/`reject`, quyết định tuyển thật sự chỉ đến từ recruiter tự chuyển trạng thái Kanban tuần tự (`applied → screening → interview → offer → hired`), không suy ra thẳng từ điểm CV nữa. Migration DB + code đã áp dụng và verify (6/6 test pass, build sạch). (2) Vá 2 lỗ hổng tài liệu tự phát hiện: `docs/architecture/*` (chụp 07-11, sai hẳn trạng thái Phase 0/0.5) đã cập nhật lại cho đúng 07-16; viết 3 ADR còn thiếu — [0003](architecture-decisions/0003-microservices-transport-and-migration-strategy.md) (chiến lược NATS+gRPC+Strangler Fig), [0004](architecture-decisions/0004-service-ownership-shared-reference-tables.md) (service sở hữu bảng dùng chung — Accepted sau khi chủ dự án xác nhận), [0005](architecture-decisions/0005-voice-ai-livekit-agents-gemini-live.md) (voice AI). Bảng chỉ mục `docs/architecture-decisions/README.md` cũng được vá (thiếu dòng ADR 0002).

---

## Architecture targets

```
Current:  Modular Monolith (NestJS) + PostgreSQL + Redis + BullMQ + Socket.IO
Target:   Microservices via NATS + pgvector (RAG) + LiveKit (video + voice AI agent) + Shared DB → per-service DB
```

Extraction order follows coupling depth — least coupled services first.

---

## Phase 0 — Foundation Fixes

**Duration: 2 weeks | Start: immediately**

Fixes issues that block everything else. All items use already-installed packages.

> **Cảnh báo (2026-07-14):** các dấu `[x]` dưới đây từng sai sự thật. Một lượt kiểm chứng trực tiếp trên code (không tin checkbox) cho thấy 2 mục "đã xong" thực chất **không hoạt động lúc chạy**. Đã đánh dấu lại bên dưới. Bài học: tick checkbox khi code được *viết*, không phải khi hành vi được *chứng minh*.

```
[~] BullMQ: raise attempts from 1 to 3 per queue                   ~1h
    → SAI. `forRoot` có attempts:3, nhưng 3 module gọi registerQueue kèm
      `defaultJobOptions` — @nestjs/bullmq gộp NÔNG nên nó ĐÈ CHẾT attempts/backoff.
      cv-processing + cv-screening chạy 1 lần, không retry. Sửa ở Phase 0.5.
[~] Activate @nestjs/throttler — rate limit /auth/* endpoints       ~3h
    → MỘT PHẦN. Chỉ phủ login/register/forgot-password; refresh/logout/reset-password
      bỏ trống, và bộ đếm nằm trong RAM (restart là reset). Sửa ở Phase 0.5.
[x] Activate @nestjs/swagger — expose /api/docs                     ~2h (mounted at /api, shares the global prefix, not a distinct /api/docs path — see other-notes.md)
    → Đã có, nhưng phơi ra cả ở production (không có rào NODE_ENV). Sửa ở Phase 0.5.
[x] Fail-fast env validation on startup (Joi or class-validator)    ~2h (done via class-validator)
    → Kiểm chứng OK: không tìm thấy env var nào app đọc lúc chạy mà thiếu trong schema validate.
[x] Add createdAt to JobPosting schema (Prisma migration)           ~30m
[x] Winston structured logging + correlation ID middleware           ~1 day
    → Checkbox này TRƯỚC ĐÂY ghi `[ ]` nhưng đã làm xong ở commit 1d2ebf2.
      Giới hạn: correlation ID chỉ đi theo request HTTP, KHÔNG vào BullMQ job hay
      Socket.IO handler — tức là không lần vết được đúng phần AI chạy nền.
[x] GlobalExceptionFilter: log 5xx errors with stack trace          ~1h
    → Chỉ có thẩm quyền trên HTTP; lỗi ném ra từ processor/gateway không đi qua đây.
[x] Helmet security headers in main.ts                              ~1h
    → Kiểm chứng OK, CSP có tùy chỉnh, CORS không dùng wildcard.
```

**Mô hình chung của Phase 0:** mọi thứ nó xây đều là **lưới an toàn hình dạng HTTP**, trong khi nửa rủi ro nhất của hệ thống chạy **bất đồng bộ** (BullMQ + Socket.IO). Phase 0 bảo vệ phần dễ và bỏ trống đúng phần AI. Đó là lý do Phase 0.5 tồn tại.

---

## Phase 0.5 — Stabilization

**Duration: ~1 week | Start: 2026-07-14**

Vá lỗi, **không thêm tính năng**. Chỉ đụng `apps/api`, không đụng `apps/web`. Cơ sở: `docs/audit/2026-07-12-*.md` (3 audit service-vs-schema) và lượt kiểm chứng Phase 0.

Quy trình cho từng nhóm: code → **review độc lập** (`/code-review`) → **verify chạy thật** (agent `verify-runner`, gọi API thật + đọc DB thật, không chỉ unit test).

### Nhóm 1 — Bảo mật ✅ (verified 2026-07-14)

```
[x] Vá leo quyền: PATCH /candidates/me nhận `userInfo` chỉ @IsObject() rồi spread
    thẳng vào prisma.user.update() → candidate tự set role:admin. Siết thành DTO
    lồng chỉ cho fullName + phoneNumber.                                     ~2h
[x] UserStatus.inactive không chặn login: enforce ở login, refresh, JwtStrategy
    (đọc lại DB mỗi request) VÀ ở handshake Socket.IO.                       ~3h
[x] GET /job-postings + /:id lộ tin draft/closed: thêm OptionalJwtAuthGuard,
    chỉ recruiter/admin thấy tin chưa công bố (candidate đăng nhập cũng KHÔNG). ~2h
[x] Rào Swagger sau NODE_ENV !== 'production'                                ~15m
[x] Thêm ThrottlerGuard cho POST /auth/reset-password                        ~15m
```

### Nhóm 2 — Độ tin cậy luồng bất đồng bộ ✅ (verified 2026-07-14, 100% PASS)

Chi tiết bằng chứng: `docs/audit/2026-07-14-phase-0.5-verification.md`.

```
[x] Gỡ `defaultJobOptions` khỏi mọi registerQueue; dồn hết default về forRoot
    → mọi queue thật sự kế thừa attempts:3 + backoff. Verify: log thật cho thấy
    3 lần thử với backoff ~10s/~20s trên cv-processing.                      ~1h
[x] cv-screenings.processor nuốt lỗi (không rethrow) → BullMQ ghi job là
    `completed` dù thất bại. Thêm rethrow theo khuôn interview.processor.
    Verify: screening thật kết thúc status=failed + error_log, đúng như kỳ vọng.
    (Chưa tự tay kiểm tra riêng việc job vào đúng "failed set" của BullMQ trong
    Redis — cờ này do unit test cv-screenings.processor.spec.ts phủ.)         ~2h
[x] Throttler storage → Redis (tự implement trên ioredis, không thêm dep).
    Verify: key `throttle:*` có thật trong Redis; restart container `ats-api`
    xong gọi login ngay vẫn 429 — bộ đếm sống qua restart.                   ~3h
[x] Trần retry: chặn retrigger screening khi retryCount >= 3.
    Verify: gọi lại trigger-screening với retry_count=3 → 409 tiếng Việt.     ~1h
[x] Session phỏng vấn treo `in_progress` vĩnh viễn → job quét định kỳ
    (queue `interview-maintenance`, 5 phút/lần) + dấu hoạt động trong Redis.
    Verify: log thật xác nhận `Session verify-test-session-001 abandoned
    after inactivity` + `Swept 1 stale interview session(s)`, DB xác nhận
    status=abandon.                                                          ~1 ngày
[x] Mở rộng jest testMatch sang src/common/** — 6 spec ở đó TRƯỚC ĐÂY không
    bao giờ chạy trong `nx test api` lẫn CI.                                 ~1h
```

### Nhóm 3 — Toàn vẹn nghiệp vụ ✅ (verified 2026-07-14, 100% PASS)

Chi tiết bằng chứng: `docs/audit/2026-07-14-phase-0.5-verification.md`.

```
[x] `isReverted: true` bypass hoàn toàn VALID_TRANSITIONS (applied → hired trong
    1 call) và bỏ qua notification. Giờ chỉ được lùi về trạng thái đơn ĐÃ TỪNG
    đi qua (đọc từ ApplicationHistory), và đi chung đường notification.
    Verify: revert sang trạng thái chưa từng có → 400; revert hợp lệ → 200 +
    notification thật được tạo (trước đây không bao giờ tạo).                ~3h
[x] ScheduleStatus không validate transition (completed → scheduled được chấp
    nhận). Thêm map transition. Verify: PATCH completed→scheduled → 400.      ~1h
[x] JobStatus không validate transition + publishedAt bị reset mỗi lần lưu
    tin đang active. Thêm map + chỉ stamp publishedAt lần đầu.
    Verify: closed→active → 400; resave active không đổi publishedAt.        ~2h
[x] remove() xoá cha khi còn con → P2003 thô lọt ra 500 (Department, User,
    Skill, Recruiter). Chặn trước với thông báo tiếng Việt.
    Verify: xoá department còn recruiter / user còn đơn ứng tuyển / skill còn
    gắn tin → đều 400 tiếng Việt, không phải 500 thô.                        ~2h
[x] SkillsService.create() dup-check sai (findUnique theo name+category nhưng
    chỉ `name` là unique) → trùng tên khác category lọt qua rồi ném P2002.
    Verify: tạo skill trùng tên khác category → 400 "Kỹ năng đã tồn tại".     ~30m
[x] RecruitersService.update() không validate FK (create() thì có).           ~1h
[x] Đổi createdBy của tin tuyển dụng sang recruiter khác phòng ban mà
    departmentId không đổi → dữ liệu mâu thuẫn vĩnh viễn. Đồng bộ lại.        ~1h
```

### Nhóm 4 — Lưới an toàn vận hành 🟡 (verified 2026-07-14, 1 lỗi thật phát hiện)

Chi tiết bằng chứng + 1 lỗi chưa sửa: `docs/audit/2026-07-14-phase-0.5-verification.md`.

```
[x] GET /health — ping thật Postgres + Redis, trả 503 nếu hỏng.
    PHÁT HIỆN: khi Redis bị đóng băng (không phải tắt hẳn — mô phỏng bằng
    `docker pause`), health check TREO LUÔN thay vì trả 503, vì redis.ping()
    không có timeout. Chưa sửa (đúng quy tắc verify — chỉ báo cáo). Đường
    "mọi thứ bình thường" (200) đã verify PASS.                               ~3h
[~] Graceful shutdown: app.enableShutdownHooks() → BullMQ worker drain +
    Prisma disconnect thay vì bị giết ngang. Code đã có (PrismaService vốn đã
    định nghĩa onModuleDestroy, giờ enableShutdownHooks() mới khiến nó thực sự
    được gọi) nhưng chưa quan sát được log xác nhận lúc restart. Kịch bản tự
    chạy: §4.2 trong file verify.                                            ~1h
[x] scripts/backup-db.sh — pg_dump → gzip → ./backups, prune theo tuổi.      ~2h
```

> `[~]` = code đã viết + unit test pass, **nhưng chưa chứng minh bằng verify chạy thật**.
> Chỉ đổi thành `[x]` sau khi `verify-runner` xác nhận hành vi trên app thật — đây
> chính xác là cái bẫy đã làm Phase 0 tick nhầm. Đừng lặp lại nó ở đây.

### Cố ý KHÔNG làm (là câu hỏi thiết kế, không phải bug)

- **Auto-reject theo `minimumScoreThreshold`** — research cho thấy để nguyên mới là ĐÚNG (GDPR Art. 22 cấm quyết định tuyển dụng hoàn toàn tự động). Ghi lại thành [ADR 0002](architecture-decisions/0002-no-auto-reject-on-ai-score.md) để lần sau không ai "sửa" nó thành tự động.
- `OwnershipGuard` per-recruiter vs per-department — cần chốt mô hình tổ chức trước.
- Nhiều `InterviewSchedule` cho một `Application` — có thể là cố ý (phỏng vấn nhiều vòng).

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
[x] Refactor startSession() → async BullMQ job (remove sync Gemini call) ~2 days — done 2026-07, see Progress Log
[x] File upload: magic byte validation                               ~1 day — %PDF- signature check done 2026-07; UUID-based safe rename not separately verified, confirm before fully closing
[ ] Graceful shutdown: SIGTERM handler + BullMQ worker drain         ~3h
[ ] Health check endpoint: GET /health (Postgres + Redis)            ~3h
[ ] CandidateSkill model + migration (resolve orphan enum)           ~1 day — blocks Phase 2 skill-taxonomy/RAG matching, do early
[ ] Minimal PostgreSQL backup (pg_dump cron, local disk)             ~2h — moved up from Phase 5 per Risk Register; full S3/R2 pipeline stays in Phase 5
[ ] Add missing indexes on FK columns: applications.job_id/candidate_id, cv_screenings.cv_id/config_id, job_postings.department_id/category_id, interview_sessions.candidate_id ~1h
```

### Email notifications

```
[ ] Email on application status change (interview, offer, rejected)  ~2 days
[ ] Email on InterviewSchedule creation → send meeting details       ~1 day
[ ] HTML email templates (nodemailer + inline styles)                ~1 day
```

---

## Phase 1.5 — Differentiator Features

**Duration: ~1–1.5 weeks | Start: after Phase 1**

Product/UX differentiators that need none of Phase 2's RAG, Phase 3's video, or Phase 4's microservices infra — pulled forward because there's no reason to wait. Source: [`docs/research/2026-07-15-voice-video-microservices-differentiators.md`](research/2026-07-15-voice-video-microservices-differentiators.md) Part 3. All three extend the existing "AI surfaces, human decides" principle already adopted in [ADR 0002](architecture-decisions/0002-no-auto-reject-on-ai-score.md) — none auto-execute a pipeline action.

```
[ ] AI co-pilot panel on Kanban card: rule-based suggestion engine over existing
    CVScreening.overallScore + InterviewResult (e.g. "clears both thresholds —
    advance to interview?"), Gemini only used to phrase the suggestion text, not
    to decide. Recruiter clicks to approve/dismiss, nothing auto-executes.       ~3 days
[ ] "Candidates worth revisiting" panel on JobPosting: query rejected/not-hired
    applications with CVScreening.overallScore above a threshold, joined against
    the new job's required Skills. No new Prisma model needed.                  ~2 days
[ ] Self-hosted Judge0 coding assessment: add Judge0 container to
    docker-compose-dev.yml, CodingAssessment/CodingSubmission models, Monaco
    editor on the candidate side, BullMQ job submits code + polls Judge0 REST
    API, pass/fail-per-test-case surfaced next to the CV screening score.       ~1 week
```

---

## Phase 2 — AI Upgrade with RAG

**Duration: 3–4 weeks | Month: September 2026**

Replace direct LLM generation with retrieval-augmented generation where it adds measurable value. RAG does not replace Gemini — it enriches the prompt with retrieved context before generation.

### RAG targets by use case

| Use case                      | RAG benefit                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------- |
| CV parsing                    | None — extraction task, LLM already sufficient                                   |
| JD parsing                    | Medium — retrieve skill taxonomy to normalize output                             |
| CV screening                  | High — retrieve historical screenings to calibrate score consistency             |
| Interview question generation | Highest — retrieve from curated question bank instead of generating from scratch |

### Infrastructure

```
[ ] Decide source-of-truth for candidate structured data before EmbeddingService:
    Candidate.profileData (Json) vs CVParsedData.* currently both exist, no documented precedence ~half day (decision + ADR)
[ ] Enable pgvector extension on existing PostgreSQL instance        ~2h
[ ] EmbeddingService — Google text-embedding-004 via existing API key ~1 day
[ ] RagService — cosine similarity search, configurable top-K        ~2 days
    Note: Prisma has no native vector type — use Unsupported("vector(N)") + raw SQL for similarity queries
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
[ ] Same migration: merge scheduledDate+scheduledTime → scheduledAt, add interviewDurationMinutes
    (currently "30 min buffer" is hard-coded in code, not configurable data)  ~30m
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

## Phase 3.5 — Voice AI for Mock Interview

**Duration: 2–3 weeks | Start: after Phase 3 (depends on the LiveKit server it stands up)**

Adds voice (candidate speaks, AI speaks back) to the existing text-only AI mock interview. Sequenced after Phase 3, not before/parallel — the recommended architecture has the AI join the LiveKit room Phase 3 already builds, so there is nothing to build against until that server exists. Source: [`docs/research/2026-07-15-voice-video-microservices-differentiators.md`](research/2026-07-15-voice-video-microservices-differentiators.md) Part 1–2.

Chosen approach: **LiveKit Agents + Gemini Live** — reuses the existing `GOOGLE_API_KEY`/`GeminiService` credential and the LiveKit server from Phase 3, no third AI vendor. The AI joins the interview room as a participant; a LiveKit Agents worker process streams room audio to Gemini Live and pipes the spoken response back onto the AI's track.

```
[ ] Stand up a LiveKit Agents worker (Node, @livekit/agents-plugin-google) as its
    own deployable process — NOT embedded in the NestJS app, so it slots directly
    into Phase 4 Step 7 (video-service extraction) instead of needing a second
    migration later.                                                            ~3 days
[ ] Wire RealtimeModel to gemini-2.5-flash-native-audio-preview (the mature
    model — gemini-3.1-flash-live-preview has documented compatibility gaps:
    no mid-session config updates, no agent handoff, no async function calls).  ~2 days
[ ] Reuse the existing question-generation + follow-up-branching logic from the
    text mock interview — voice is a modality change on top of the same
    architecture, not a redesign (every real voice-AI competitor researched
    keeps this same branching pattern).                                        ~3 days
[ ] Design and tune the silence-timeout ("candidate is done answering") pacing
    deliberately — this is the actual documented UX failure mode competitors
    (Apriora, Ribbon) hit, not raw latency.                                     ~2 days
[ ] Candidate-side voice UI: mic capture, LiveKit room join, waveform/speaking
    indicator (reuse @livekit/components-react already planned for Phase 3).    ~3 days
```

**Fallback if scope is tight — ship this instead and stop:**
```
[ ] Web Speech API bolt-on: browser SpeechRecognition transcribes the candidate's
    spoken answer into the same text field already sent over Socket.IO;
    SpeechSynthesis reads the AI's question aloud. Zero new vendor, zero new
    infra, zero backend changes. Disclose the Firefox gap and lack of real
    turn-detection openly rather than hiding them.                              ~2 days
```

**Explicitly out of scope:** OpenAI Realtime API, ElevenLabs, Deepgram, Vapi/Retell/Bland (all third vendors, no reuse benefit); migrating to Vertex AI just for Gemini Live GA/SLA status; avatar/video-generation on top of voice; telephony/PSTN integration.

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
[ ] Minimal outbox pattern (event_outbox table + publisher poll) — avoids the dual-write
    problem (DB write succeeds, event publish fails) before any service depends on events ~2 days

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
[x] Decide owning service for shared reference tables: Department, Skill, JobCategory
    → job-service; AiConfig → ai-service. See [ADR 0004](architecture-decisions/0004-service-ownership-shared-reference-tables.md) (Accepted 2026-07-16).
[ ] Application/CVScreening/InterviewSchedule each FK across ≥2 planned services today —
    plan soft-reference (ID only, no Prisma relation) before splitting; no proposal exists
    yet, needs its own ADR before this step actually runs                    ~1 day (decision + ADR)
[ ] job-service, application-service                                 ~2 weeks
[ ] interview-service (depends on ai-service + video-service)        ~1 week

Step 7: video-service
[ ] Extract LiveKitService as standalone microservice                ~1 week
    (if Phase 3.5's voice-AI worker was built, it already lives as its own
    process — fold it in here rather than extracting it separately)
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
August 2026     Phase 1 complete — all core workflows demo-ready; Phase 1.5 differentiators
September 2026  Phase 2 — RAG + analytics
October 2026    Phase 3 — Video Call
Late Oct/Nov    Phase 3.5 — Voice AI (depends on Phase 3's LiveKit server)
November 2026   Phase 4 start — ai-service + notification-service
December 2026   Phase 4 continued + Phase 5 start
January 2027    Phase 4 complete + Phase 5 + buffer
```

---

## Risk Register

| Risk                                                              | Probability | Impact   | Mitigation                                                                                                                                    |
| ----------------------------------------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| RAG retrieval quality (noise)                                     | Medium      | Medium   | Offline evaluation set before deploy                                                                                                          |
| Distributed transaction failure across services                   | High        | High     | Shared DB for entire Phase 4; Saga after January                                                                                              |
| LiveKit TURN config for NAT traversal                             | Low         | Low      | Built-in TURN; coturn as fallback                                                                                                             |
| Timeline slip (solo developer)                                    | High        | High     | Phase 4 is deprioritized if Phase 1–3 slip                                                                                                    |
| Gemini API cost increase with RAG                                 | Low         | Medium   | RAG shortens prompts; net cost similar or lower                                                                                               |
| Gemini API quota/billing exhaustion (distinct from cost increase) | Medium      | High     | Already occurred in dev, 2026-07 (RESOURCE_EXHAUSTED on the real key) — set up billing alerts, keep a mocked-response fallback path for demos |
| PostgreSQL data loss before backup is set up                      | Medium      | Critical | Do backup setup in Phase 1 (moved up from Phase 5), see Technical debt checklist                                                              |

---

## Guiding principle

Feature completeness is visible. Architectural patterns are not.

Prioritize in this order: working end-to-end flows → AI features users see → video call → microservices.
