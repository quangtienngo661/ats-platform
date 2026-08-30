# Kiến trúc Database

> Snapshot: 2026-07-16. Nguồn: `libs/backend/database/prisma/schema.prisma` (565 dòng, 22 model, đọc trực tiếp toàn bộ) + migration SQL thực tế đã áp dụng (`libs/backend/database/prisma/migrations/`). File này tự chứa đủ ngữ cảnh để đọc độc lập ở session mới, không cần đọc lại schema.prisma từ đầu trừ khi cần verify số liệu mới hơn ngày snapshot. (Snapshot trước ghi nhầm "24 model/566 dòng" — đếm lại trực tiếp ra 22 model/565 dòng, khớp breakdown §2; sửa lại ở đây, không phải model bị xoá.)

## 1. Tổng quan

PostgreSQL 15 + Prisma ORM (`^7.8`, generator `prisma-client`, adapter `@prisma/adapter-pg`). Schema/migration chỉ nằm ở `libs/backend/database/prisma/` — không có bản sao nào khác trong repo (`apps/api` không có `prisma/` riêng).

## 2. 22 model, theo domain

```
Auth/User    → User (bảng gốc, class-table inheritance), RefreshToken
Organization → Department
Candidate    → Candidate, CV, CVParsedData
Recruiter    → Recruiter
Job          → JobCategory (tự tham chiếu, có cây cha-con), Skill, JobPosting, JobPostingSkill
Application  → Application, ApplicationHistory (append-only audit trail)
AI Screening → CVScreening, AiConfig, AiUsageLog
Interview    → InterviewTopic, InterviewSession, InterviewQnA, InterviewResult, InterviewSchedule
Notification → Notification
```

`User → Candidate?` / `User → Recruiter?` là class-table inheritance: 1 user chỉ có 1 trong 2 (hoặc không cái nào nếu là `admin`), tránh cột null tràn lan kiểu single-table.

## 3. Điểm thiết kế tốt (giữ nguyên, không cần sửa)

- **Append-only audit trail**: `ApplicationHistory` ghi từng lần đổi status (`fromStatus`/`toStatus`/`changedBy`/`changedAt`) thay vì ghi đè trực tiếp lên `Application.status`.
- **Named relations phân biệt vai trò trên cùng 1 bảng đích**: `InterviewSchedule.scheduler`/`interviewer` đều trỏ tới `User` nhưng qua 2 relation tên riêng (`ScheduledBy`/`Interviewer`).
- **JSON chỉ dùng cho dữ liệu AI-derived/bán cấu trúc**: `CVParsedData.{skills,experience,education,...}`, `CVScreening.{matchedSkills,missingSkills}`, `InterviewQnA.{expectedPoints,coveredPoints,missedPoints}` — không lạm dụng JSON cho dữ liệu quan hệ rõ ràng.
- **`Decimal(5,1)` cho mọi điểm số** (`CVScreening.overallScore`, v.v.) — tránh sai số dấu phẩy động.
- **Polymorphic reference không dùng FK cứng ở đúng chỗ cần**: `Notification.relatedEntityId`/`AiUsageLog.referenceId` là string tự do, không có FK — đúng pattern cho log/notification cần trỏ tới nhiều loại entity khác nhau mà không muốn ràng buộc cứng.

## 4. Vấn đề kỹ thuật đã xác nhận trực tiếp (không phải suy đoán)

### 4.1 Thiếu index trên nhiều cột FK

Verify bằng cách grep toàn bộ `CREATE INDEX` trong migration SQL đã áp dụng — các cột sau **không có index riêng** (chỉ có unique kép hoặc không có gì):

```
applications.job_id, applications.candidate_id   (chỉ có unique kép job_id+candidate_id)
cv_screenings.cv_id, cv_screenings.config_id
job_postings.department_id, job_postings.category_id
interview_sessions.candidate_id, interview_sessions.topic_id
cvs.candidate_id
application_history.changed_by
```

Postgres không tự tạo index cho cột FK (khác MySQL/InnoDB). Đã đưa vào `docs/migration-roadmap.md` Phase 1 Technical debt.

### 4.2 FK bắc cầu qua ranh giới microservice dự kiến (Phase 4)

Roadmap dự kiến 9 service (`user-service`, `job-service`, `application-service`, `cv-service`, `ai-service`, `interview-service`, `notification-service`, `auth-service`, `video-service`). Nhiều model có FK Prisma (cascade thật, không phải soft reference) bắc cầu qua ≥2 service dự kiến:

| Model               | FK sang                                                     | Service liên quan                      |
| ------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `Application`       | `candidateId`, `jobId`, `cvId`                              | user-, job-, cv-service                |
| `CVScreening`       | `cvId`, `applicationId`, `configId`                         | cv-, application-, ai-service          |
| `InterviewSchedule` | `applicationId`, `sessionId`, `scheduledBy`/`interviewerId` | application-, interview-, user-service |

Khi tách thật, các query dạng `prisma.application.findUnique({ include: { jobPosting, candidate, cv } })` sẽ không dùng được nữa — phải viết lại thành gọi API/event chéo service. Chưa có kế hoạch cụ thể cho việc này ngoài "Shared DB trước, Saga sau" ghi trong risk register.

### 4.3 Bảng dùng chung chưa có service sở hữu

`Department`, `Skill`, `JobCategory`, `AiConfig` được nhiều service tương lai đọc/ghi nhưng chưa gán chủ sở hữu. Đề xuất đang nằm trong roadmap Phase 4 Step 6 (chưa quyết định chính thức): `Department`/`Skill`/`JobCategory` → `job-service`; `AiConfig` → `ai-service`.

### 4.4 `CandidateSkillSource` enum mồ côi

Enum tồn tại trong schema nhưng model `CandidateSkill` chưa từng được implement. Đã có trong Phase 1 checklist ("resolve orphan enum") — **quan trọng hơn mô tả gốc**: đây còn là điều kiện tiên quyết cho RAG skill-matching (Phase 2), vì `CVParsedData.skills` hiện là JSON blob tự do, khó embed/so khớp theo từng skill riêng lẻ nếu không chuẩn hoá thành bảng quan hệ trước.

### 4.5 Dữ liệu candidate rải ở 2 chỗ, chưa rõ nguồn nào là chuẩn

`Candidate.profileData: Json?` (blob tự do) và `CVParsedData.{skills,experience,education,summary,...}` cùng tồn tại, không tài liệu nào ghi rõ cái nào là "source of truth". Cần chốt trước khi viết `EmbeddingService` (Phase 2) — embed sai nguồn sẽ phải làm lại.

### 4.6 Prisma không có kiểu `vector` gốc

Khi bật `pgvector` (Phase 2), Prisma schema phải dùng `Unsupported("vector(N)")` cho cột embedding, và phần truy vấn cosine similarity phải viết raw SQL (`$queryRaw`), không dùng được query builder thông thường của Prisma cho phần này.

### 4.7 `AiRecommendation` không còn giá trị `hire` (2026-07-16)

Migration `20260716120000_remove_hire_from_ai_recommendation` xoá `hire` khỏi enum `AiRecommendation` (`schema.prisma:79-84`, còn lại `interview`/`reject`). `CvScreeningsService.determineRecommendation()` (`apps/api/src/app/cv-screenings/cv-screenings.service.ts:313-323`) giờ chỉ so `overallScore` với `minimumScoreThreshold` để trả `interview` hoặc `reject` — không còn nhánh khuyến nghị tuyển thẳng. Quyết định tuyển (`hired`) chỉ xảy ra sau, thủ công, qua luồng Kanban `ApplicationStatus` bình thường (`applied → screening → interview → offer → hired`), không đi qua `aiRecommendation`. Nhất quán với nguyên tắc "AI đề xuất, người quyết" đã ghi ở [ADR 0002](../architecture-decisions/0002-no-auto-reject-on-ai-score.md) — `minimumScoreThreshold`/`aiRecommendation` không phải trường chết, chỉ cố ý không bao giờ tự động hoá quyết định cuối, xem `.claude/rules/apis/anti-patterns.md`.

**Lưu ý trạng thái git:** tính tới snapshot này, thay đổi schema + migration trên vẫn nằm ở working tree, **chưa commit**.

## 5. Câu hỏi/quyết định còn mở (chưa chốt, cần quyết định trước khi code)

1. Nguồn dữ liệu chuẩn để embed cho RAG: `Candidate.profileData` hay `CVParsedData.*`?
2. Service sở hữu chính thức cho `Department`/`Skill`/`JobCategory`/`AiConfig`.
3. Chiến lược soft-reference (bỏ FK cứng, chỉ giữ ID) cho `Application`/`CVScreening`/`InterviewSchedule` khi tách service — làm lúc nào, làm thế nào.

Khi quyết định xong bất kỳ mục nào ở trên, ghi thành ADR tại `docs/architecture-decisions/` (xem template `0000-template.md`) và cập nhật lại mục tương ứng trong `docs/migration-roadmap.md`.

## 6. Liên quan tới kế hoạch migrate

- Phase 1 (`docs/migration-roadmap.md`): thêm index thiếu (§4.1), làm `CandidateSkill` model (§4.4).
- Phase 2 (RAG): §4.5 và §4.6 là 2 việc phải chốt trước khi viết `EmbeddingService`/`RagService`.
- Phase 4 (Microservices): §4.2 và §4.3 là rào cản kỹ thuật chính khi tách `application-service`/`job-service`/`cv-service`/`interview-service` — nên giải quyết ở đầu Step 6 (Core services), không phải khi đã tách xong mới phát hiện.
