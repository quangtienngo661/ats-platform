# Kiến trúc hệ thống (System Architecture)

> Snapshot: 2026-07-11. Dựa trên `README.md` (§System Architecture, §AI Mock Interview Flow, §Queues) đối chiếu trực tiếp với code — chỗ nào README lệch so với code thực tế đã ghi rõ bên dưới.

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
Redis (broker) ──► 5 Worker ──► Google Gemini API ──► ghi kết quả vào DB ──► emit qua Socket.IO
```

## 2. 15 module domain (`apps/api/src/app/*`)

`auth`, `users`, `candidates`, `recruiters`, `departments`, `job-categories`, `skills`, `job-postings`, `applications`, `cvs`, `cv-screenings`, `ai-config`, `ai-usage-logs`, `interviews`, `notifications`.

Mỗi module theo khuôn `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto(s)/*.dto.ts` (+ `*.spec.ts` cùng cặp). `interviews/` có thêm `session/` sub-feature (gateway + processor + service cho vòng lặp Q&A trực tiếp) — đầy đủ nhất, dùng làm mẫu hình module khi viết module mới.

Đây chính là ranh giới sẽ dùng làm cơ sở tách microservice ở Phase 4 (`docs/migration-roadmap.md`).

## 3. Ba kiểu luồng xử lý

- **Đồng bộ (REST)**: request → controller → service → Prisma → response qua `TransformInterceptor` (envelope `{ success, status, data }`).
- **Bất đồng bộ (BullMQ)**: service dispatch job → processor xử lý nền → ghi kết quả DB → emit Socket.IO. Dùng cho mọi việc gọi Gemini (CV parse, CV screening, sinh câu hỏi phỏng vấn, chấm điểm) để không block HTTP thread.
- **Real-time (Socket.IO)**: JWT xác thực lúc handshake, room scoped theo `job_{id}` (kanban) hoặc `interview_{sessionId}` (mock interview).

## 4. BullMQ — 5 queue thực tế (README chỉ liệt kê 4, thiếu 1 — xem §6)

| Queue                     | Xử lý                                               | Concurrency/Rate limit |
| ------------------------- | --------------------------------------------------- | ---------------------- |
| `send-verification-email` | Email xác thực tài khoản, OTP                       | 30/phút                |
| `cv-processing`           | Trích xuất dữ liệu CV (Gemini)                      | 15/phút                |
| `cv-screening`            | Chấm điểm CV theo JD (Gemini)                       | 15/phút                |
| `interview-evaluation`    | Chấm từng câu hỏi/trả lời phỏng vấn                 | concurrency 3          |
| `interview-generation`    | Sinh 10 câu hỏi phỏng vấn (batch, 1 lần gọi Gemini) | concurrency 3          |

Global default retry: `attempts: 3` + exponential backoff (`app.module.ts`) — mọi `.add()` không override sẽ theo default này.

## 5. Tính năng lõi — AI Mock Interview (3 pha)

Thiết kế theo nguyên tắc "zero-distraction" (không hiện điểm từng câu trong lúc phỏng vấn) và "zero-latency" giữa các câu chính.

1. **Khởi tạo**: candidate chọn Topic + Difficulty → gọi `gemini-3.5-flash` sinh **10 câu hỏi trong 1 lần gọi** (batch) → lưu hết vào `InterviewQnA` với `orderIndex` 1-10 → emit câu 1 qua Socket.IO. (Từ Phase 0: bước này chạy qua queue `interview-generation`, không block HTTP request — trước đây gọi Gemini đồng bộ trong request, có thể treo tới 120s.)
2. **Vòng lặp Q&A**: candidate trả lời → Gemini (flash) quyết định có cần hỏi follow-up không → nếu có, hỏi thêm 1 câu rồi mới sang câu N+1 (đã có sẵn trong DB từ bước 1, hiển thị ngay không cần chờ); nếu không, sang thẳng câu N+1. Việc chấm điểm câu N luôn đẩy sang BullMQ (`interview-evaluation`) chạy nền, không chặn UI.
3. **Tổng hợp**: sau câu 10, đợi BullMQ chấm xong toàn bộ 10 câu → gộp lại gọi `gemini-3.1-pro-preview` (model mạnh hơn) ra `overallScore` + `strengths`/`weaknesses`/`actionPlan` → emit `session:completed`.

## 6. Auth

JWT access token (ngắn hạn) + refresh token xoay vòng, refresh token lưu dạng hash trong DB (`RefreshToken.tokenHash`) → thu hồi được từng token riêng lẻ. `RolesGuard` (`@Roles()`) chặn theo role, `OwnershipGuard` (`@Resources()`) chặn IDOR (vd. recruiter khác phòng ban không xem được ứng viên).

## 7. Chỗ README.md hiện đang lệch so với code (đã verify trực tiếp, chưa sửa README)

- README liệt kê 4 queue, thiếu `interview-generation` (thêm sau khi README được viết, lúc fix Phase 0 async `startSession()`).
- README ghi retry policy của `cv-processing`/`cv-screening` là _"Default 1 attempt (global default)"_ — đây là mô tả **trước Phase 0**; global default hiện tại đã là `attempts: 3` (`app.module.ts:39`).

## 8. Liên quan tới kế hoạch migrate

- Ranh giới 15 module hiện tại ánh xạ khá rõ vào 9 service mục tiêu ở Phase 4 (`docs/migration-roadmap.md` §Phase 4 Target architecture) — nhưng `Department`/`Skill`/`JobCategory`/`AiConfig` là bảng dùng chung, chưa gán service sở hữu (xem `database.md` §5).
- Vòng lặp Q&A phỏng vấn (mục 5.2) là ví dụ thực tế tốt nhất trong hệ thống cho việc RAG sẽ chèn vào đâu (Phase 2): thay vì Gemini tự sinh câu hỏi từ đầu, sẽ retrieve từ question bank trước khi generate — không đổi luồng Socket.IO/BullMQ hiện tại, chỉ đổi nội dung prompt.
- Xem `docs/architecture-decisions/` cho các quyết định cụ thể đã chốt (vd. ADR 0001 — đổi base image Docker).
