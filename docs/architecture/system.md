# Kiến trúc hệ thống (System Architecture)

> Snapshot: 2026-07-16. Dựa trên `README.md` (§System Architecture, §AI Mock Interview Flow, §Queues) đối chiếu trực tiếp với code — chỗ nào README lệch so với code thực tế đã ghi rõ bên dưới.

## 1. Mô hình tổng thể

Modular monolith (NestJS), tách phần xử lý AI nặng ra khỏi luồng HTTP chính bằng async queue để tránh block request khi Gemini chậm/rate-limit.

```
Client (Next.js 16, App Router SSR + Zustand state)
   │  HTTPS                         │ WebSocket (JWT handshake)
   ▼                                ▼
Nginx (SSL termination, reverse proxy)   Socket.IO Gateway
   │
   ▼
NestJS API — 15 module theo domain — Prisma ORM ──► PostgreSQL 15
   │
   │ dispatch job (BullMQ)
   ▼
Redis (broker) ──► 6 Worker (4 gọi Gemini, 1 gửi email, 1 quét bảo trì) ──► ghi kết quả vào DB ──► emit qua Socket.IO
```

## 2. 15 module domain + 1 module hạ tầng (`apps/api/src/app/*`)

`auth`, `users`, `candidates`, `recruiters`, `departments`, `job-categories`, `skills`, `job-postings`, `applications`, `cvs`, `cv-screenings`, `ai-config`, `ai-usage-logs`, `interviews`, `notifications`. Cộng thêm `health` (thêm 2026-07-14, Phase 0.5) — không phải domain nghiệp vụ, chỉ `HealthController`/`HealthService` phục vụ `GET /health` (xem `infrastructure.md` §8).

Mỗi module theo khuôn `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto(s)/*.dto.ts` (+ `*.spec.ts` cùng cặp). `interviews/` có thêm `session/` sub-feature (gateway + processor + service cho vòng lặp Q&A trực tiếp) — đầy đủ nhất, dùng làm mẫu hình module khi viết module mới.

Đây chính là ranh giới sẽ dùng làm cơ sở tách microservice ở Phase 4 (`docs/migration-roadmap.md`).

## 3. Ba kiểu luồng xử lý

- **Đồng bộ (REST)**: request → controller → service → Prisma → response qua `TransformInterceptor` (envelope `{ success, status, data }`).
- **Bất đồng bộ (BullMQ)**: service dispatch job → processor xử lý nền → ghi kết quả DB → emit Socket.IO. Dùng cho mọi việc gọi Gemini (CV parse, CV screening, sinh câu hỏi phỏng vấn, chấm điểm) để không block HTTP thread.
- **Real-time (Socket.IO)**: JWT xác thực lúc handshake, room scoped theo `job_{id}` (kanban) hoặc `interview_{sessionId}` (mock interview).

## 4. BullMQ — 6 queue thực tế

| Queue                     | Xử lý                                               | Concurrency/Rate limit |
| ------------------------- | --------------------------------------------------- | ---------------------- |
| `send-verification-email` | Email xác thực tài khoản, OTP                       | 30/phút                |
| `cv-processing`           | Trích xuất dữ liệu CV (Gemini)                      | 15/phút                |
| `cv-screening`            | Chấm điểm CV theo JD (Gemini)                       | 15/phút                |
| `interview-evaluation`    | Chấm từng câu hỏi/trả lời phỏng vấn                 | concurrency 3          |
| `interview-generation`    | Sinh 10 câu hỏi phỏng vấn (batch, 1 lần gọi Gemini) | concurrency 3          |
| `interview-maintenance`   | Quét định kỳ, đánh dấu `abandon` cho phiên `in_progress` bị treo (thêm 2026-07-14, Phase 0.5) | repeat 5 phút/lần (`upsertJobScheduler`, `interviews.module.ts`) |

Global default retry: `attempts: 3` + exponential backoff (`app.module.ts:39`) — mọi `.add()` không override sẽ theo default này. **Cập nhật 2026-07-14 (Phase 0.5):** trước đó điều này chỉ đúng trên giấy — 3 module (`cv-processing`, `cv-screening`, `send-verification-email`) gọi `registerQueue()` kèm `defaultJobOptions` riêng, bị `@nestjs/bullmq` gộp NÔNG nên ĐÈ CHẾT default toàn cục; `cv-processing`/`cv-screening` (2 pipeline AI, dễ lỗi nhất) thực chạy chỉ 1 lần, không retry. Đã gỡ hết `defaultJobOptions` khỏi mọi `registerQueue()`, verify bằng log thật (3 lần thử, backoff ~10s/~20s trên `cv-processing`). Chi tiết: `.claude/rules/apis/anti-patterns.md` mục "The registerQueue trap".

## 5. Tính năng lõi — AI Mock Interview (3 pha)

Thiết kế theo nguyên tắc "zero-distraction" (không hiện điểm từng câu trong lúc phỏng vấn) và "zero-latency" giữa các câu chính.

1. **Khởi tạo**: candidate chọn Topic + Difficulty → gọi `gemini-3.5-flash` sinh **10 câu hỏi trong 1 lần gọi** (batch) → lưu hết vào `InterviewQnA` với `orderIndex` 1-10 → emit câu 1 qua Socket.IO. (Từ Phase 0: bước này chạy qua queue `interview-generation`, không block HTTP request — trước đây gọi Gemini đồng bộ trong request, có thể treo tới 120s.)
2. **Vòng lặp Q&A**: candidate trả lời → Gemini (flash) quyết định có cần hỏi follow-up không → nếu có, hỏi thêm 1 câu rồi mới sang câu N+1 (đã có sẵn trong DB từ bước 1, hiển thị ngay không cần chờ); nếu không, sang thẳng câu N+1. Việc chấm điểm câu N luôn đẩy sang BullMQ (`interview-evaluation`) chạy nền, không chặn UI.
3. **Tổng hợp**: sau câu 10, đợi BullMQ chấm xong toàn bộ 10 câu → gộp lại gọi `gemini-3.1-pro-preview` (model mạnh hơn) ra `overallScore` + `strengths`/`weaknesses`/`actionPlan` → emit `session:completed`.

## 6. Auth

JWT access token (ngắn hạn) + refresh token xoay vòng, refresh token lưu dạng hash trong DB (`RefreshToken.tokenHash`) → thu hồi được từng token riêng lẻ. `RolesGuard` (`@Roles()`) chặn theo role, `OwnershipGuard` (`@Resources()`) chặn IDOR (vd. recruiter khác phòng ban không xem được ứng viên).

## 7. README.md từng lệch so với code — đã vá 2026-07-16

- README trước đây liệt kê 4 queue, thiếu `interview-generation` (thêm lúc fix Phase 0 async `startSession()`) và `interview-maintenance` (thêm 2026-07-14, Phase 0.5, quét phiên phỏng vấn treo). Đã cập nhật đủ 6 queue.
- README trước đây ghi retry policy của `cv-processing`/`cv-screening` là _"Default 1 attempt (global default)"_ — mô tả này **đúng lâu hơn dự kiến**: `app.module.ts` đã ghi `attempts: 3` từ Phase 0, nhưng lỗi `registerQueue()` (xem §4) khiến 2 queue này thực chạy 1 lần duy nhất cho tới khi Phase 0.5 sửa ngày 2026-07-14. Đã cập nhật README để phản ánh đúng: global default `attempts: 3` áp dụng cho toàn bộ 6 queue.

## 8. Liên quan tới kế hoạch migrate

- Ranh giới 15 module hiện tại ánh xạ khá rõ vào 9 service mục tiêu ở Phase 4 (`docs/migration-roadmap.md` §Phase 4 Target architecture) — nhưng `Department`/`Skill`/`JobCategory`/`AiConfig` là bảng dùng chung, chưa gán service sở hữu (xem `database.md` §5).
- Vòng lặp Q&A phỏng vấn (mục 5.2) là ví dụ thực tế tốt nhất trong hệ thống cho việc RAG sẽ chèn vào đâu (Phase 2): thay vì Gemini tự sinh câu hỏi từ đầu, sẽ retrieve từ question bank trước khi generate — không đổi luồng Socket.IO/BullMQ hiện tại, chỉ đổi nội dung prompt.
- Xem `docs/architecture-decisions/` cho các quyết định cụ thể đã chốt (vd. ADR 0001 — đổi base image Docker).
