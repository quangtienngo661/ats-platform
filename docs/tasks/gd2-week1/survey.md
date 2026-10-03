# Survey — GĐ2 tuần 1: luồng ứng viên

**Ngày:** 2026-10-03 · **Nhánh:** `feat/gd2-candidate-flows`, tách từ `98ee357` (`refactor/fe-best-practices`, gồm portal org_admin + refactor FE chưa merge — PR #63 đang mở).
**Phạm vi đề cương (GĐ2, 28/09–25/10):** "Ứng viên: xem lịch phỏng vấn, timeline đơn ứng tuyển, lọc tìm việc." Khảo sát chỉ đọc code; chưa sửa gì.

## Baseline đã chạy (2026-10-03)

- `npx nx test api --runInBand --silent`: **59 suites / 462 tests pass**.
- `npm run test:web`: **19 files / 130 tests pass**.
- Chưa có component test nào trong `apps/web/src/components/my-applications/` hay `components/public/`. E2E hiện có: `ai-configuration`, `fe-best-practices`, `gd1-org-admin`, `session-policy` (`apps/web/e2e/`).

## S1 — Lịch phỏng vấn của ứng viên

- API đã có `GET /interviews/schedules/my`, cho phép `candidate` — `apps/api/src/app/interviews/interviews.controller.ts:50-51`.
- Với candidate, service lọc theo `candidateId` của chính người gọi, **xuyên mọi tổ chức** (đúng mô hình Candidate dùng chung) — `apps/api/src/app/interviews/interviews.service.ts:336-344`. Hỗ trợ `status`, `fromDate`, `toDate`, phân trang, sắp `startAt asc` — `:355-388`.
- **Payload thừa dữ liệu:** `scheduleIncludeOptions` trả nguyên `User` của `interviewer` và `scheduler` (chỉ bỏ `passwordHash`), tức gồm `email`, `phoneNumber`, `role`, `status`, `emailVerified`, `organizationId`, `createdAt` — `apps/api/src/common/utils/include-options.util.ts:119-143`, các trường theo `libs/backend/database/prisma/schema.prisma:166-181`. Không có token/mật khẩu.
- Model `InterviewSchedule`: `interviewType` (`online` | `onsite`), `startAt`, `durationMinutes`, `onlineMeetingLink?`, `status` (`scheduled` | `completed` | `cancelled`). **Không có trường địa điểm** cho phỏng vấn trực tiếp — `schema.prisma:607-626`, enum `:116-128`.
- **Form đặt lịch của recruiter không cho chọn hình thức:** action gán cứng `interviewType: InterviewType.onsite` và không gửi `onlineMeetingLink` — `apps/web/src/servers/interviews/interviews.action.ts:40-46, 87-95`; form chỉ có ứng viên, người phỏng vấn, ngày, giờ, thời lượng (`apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx`). Nghĩa là mọi lịch tạo từ web đều là `onsite`, không link, không địa chỉ. API thì nhận `interviewType` và `onlineMeetingLink?` — `apps/api/src/app/interviews/dto/create-interview.dto.ts:11-24`.
- Web đã có `getMyInterviewSchedulesAction` — `apps/web/src/servers/interviews/interviews.action.ts:174`; hiện chỉ trang recruiter dùng — `apps/web/src/app/(recruiter)/interviews/page.tsx:71`. Kiểu `IInterviewSchedule` ở web mang `interviewer`/`scheduler` — `apps/web/src/types/interfaces/interview.interface.ts:12-25`.
- **Rút đơn / bị từ chối không hủy lịch:** `applications.service.ts` không có lệnh nào cập nhật `InterviewSchedule` (grep `interviewSchedule.update*|ScheduleStatus.cancelled` trong file: 0 kết quả). Lịch của đơn đã đóng vẫn `scheduled`.
- **Lệch múi giờ khi đặt lịch:** `interviews.action.ts` là `'use server'`; `toLocalDateTimeIso` dựng `new Date("<date>T<time>:00")` trên server — `interviews.action.ts:58-63`. Compose chỉ đặt `TZ: Asia/Ho_Chi_Minh` cho `postgres` (`docker-compose.yml:16`, `docker-compose-dev.yml:16`); `docker-compose.test.yml` không đặt `TZ` ở đâu; `apps/web/Dockerfile` không có `TZ`/tzdata. Đo 2026-10-03: trong `ats-api` (cùng base `node:24-bookworm-slim` với web) `"2026-10-05T09:00:00"` → `09:00Z` (TZ = UTC, tức 16:00 giờ VN); trên máy host (Asia/Saigon) → `02:00Z`. Chưa đo trực tiếp container web (không chạy lúc khảo sát).
- **Đổi hình thức không xóa trường cũ:** `updateSchedule` chỉ copy `interviewType`/`onlineMeetingLink` khi có trong request, không xóa link khi chuyển sang `onsite` — `interviews.service.ts:403-440`.
- **Phân trang:** mặc định `limit = 20`, sắp `startAt` tăng dần, không có tham số đổi chiều sắp — `interviews.service.ts:330-331, 373`. Ứng viên có > 20 lịch nhận 20 lịch cũ nhất.
- Hiển thị giờ phía recruiter dùng `toLocaleTimeString('vi-VN')` không chỉ định `timeZone` — `apps/web/src/components/interview-schedule/ui/ScheduleCard.tsx:10`, `ScheduleDetailDrawer.tsx:21-25`.
- Ứng viên chưa có route xem lịch: `(candidate)/` chỉ có `mock-interview`, `my-applications`, `my-cvs`, `profile`. Route ứng viên phải khai báo ở `apps/web/src/lib/role-policy.ts:10` (`candidate: ['/job-postings', '/my-applications', '/my-cvs', '/profile']`) và menu ở `apps/web/src/components/public/layout/PublicHeader.tsx:34`.

## S2 — Timeline đơn ứng tuyển

- API đã có `GET /applications/:id/history` cho cả `candidate` — `apps/api/src/app/applications/applications.controller.ts:106-112`.
- Quyền sở hữu kiểm ở service: candidate chỉ đọc đơn có `candidate.userId === caller.userId`, ngược lại 403 — `apps/api/src/app/applications/applications.service.ts:158-188`.
- **Payload lộ dữ liệu nội bộ:** trả mọi cột `ApplicationHistory` gồm `notes`, `rejectionReason`, `changedBy` và `user { userId, fullName, role }` — `applications.service.ts:575-591`; model `schema.prisma:450-468`. `notes`/`rejectionReason` do recruiter nhập khi đổi trạng thái — `applications.service.ts:560-563`.
- Cùng dữ liệu đó còn đi ra ở `GET /applications/:id` (cho phép `candidate`, có `OwnershipGuard`): include `history` đủ cột kèm `user` — `applications.controller.ts:114-123`, `applications.service.ts:485-503`. Web hiện không đọc `history` từ route này (không có chỗ nào dùng `.history` của đơn).
- Kanban hiện chỉ kéo thả, không gửi `notes`/`rejectionReason` — `apps/web/src/components/kanban/KanbanClient.tsx:141`; action có sẵn tham số — `apps/web/src/servers/applications/applications.action.ts:120-134`. Hai cột này đang gần như trống, nhưng sẽ có dữ liệu khi làm "ghi chú"/"form đánh giá" (GĐ2 tuần 2).
- **Hợp đồng FE–BE lệch:** `IApplicationHistoryItem` ở web là `{ historyId, applicationId, status, notes?, changedAt }` — `apps/web/src/types/interfaces/application.interface.ts:31-37`; API trả `{ id, fromStatus, toStatus, changedBy, notes, rejectionReason, changedAt, user }`. `getApplicationHistoryAction` (`apps/web/src/servers/applications/applications.action.ts:163`) **chưa được dùng ở đâu**, nên lỗi đang nằm im.
- Nộp đơn tạo dòng đầu `fromStatus: null → applied` — `applications.service.ts:258-266`; rút đơn cũng ghi lịch sử — `:326`.
- `rejected` không có bước tiếp trong `VALID_TRANSITIONS` (`applications.service.ts:35-54`), nhưng **hoàn tác** (`isReverted`) được quay về bất kỳ trạng thái đơn từng có — `:519-526`; Kanban gọi hoàn tác khi kéo ngược — `apps/web/src/components/kanban/KanbanClient.tsx:159`. Một đơn có thể bị từ chối rồi quay lại `interview`.
- Thẻ đơn hiện có thanh bước trạng thái tĩnh `PIPELINE_STEPS` — `apps/web/src/components/my-applications/ui/ApplicationCard.tsx:27`; `GET /applications/my` không kèm history — `applications.service.ts:272-284`.

## S3 — Lọc tìm việc

- `GET /job-postings` dùng `OptionalJwtAuthGuard` (khách và candidate đều xem được) — `apps/api/src/app/job-postings/job-postings.controller.ts:93-94`.
- Non-staff chỉ thấy tin `active` của mọi tổ chức; lọc hiện có: `departmentId`, `categoryId`, `locationType`, `search` (chỉ trên `title`, không phân biệt hoa thường) — `apps/api/src/app/job-postings/job-postings.service.ts:186-234`. Query DTO: `status`, `locationType`, `departmentId`, `categoryId`, `search`, `page`, `limit` — `apps/api/src/app/job-postings/dto/job-posting.dto.ts:21-55`.
- Dữ liệu cho lọc mới đã có: `JobPosting.salaryMin/salaryMax` (`Decimal?`) — `schema.prisma:350-351`; `JobPostingSkill (jobId, skillId, isRequired)` — `:369-383`. **Không có cột địa điểm dạng text**, chỉ `locationType` (`remote` | `onsite` | `hybrid`) — `:37-43`, `:349`.
- `GET /skills` chỉ cho `admin`, `recruiter` — `apps/api/src/app/skills/skills.controller.ts:38-39`; trang công khai không lấy được danh sách kỹ năng.
- Staff đang đăng nhập xem trang việc làm sẽ đi nhánh staff: chỉ tin của tổ chức mình, mọi trạng thái — `job-postings.service.ts:199-204`.
- `applyFilters` luôn đưa về trang 1 trừ khi truyền `page` — `apps/web/src/components/public/jobs/JobSearchClient.tsx:33-44`.
- Web truyền `q`, `categoryId`, `locationType` — `apps/web/src/app/(public)/job-postings/page.tsx:8-30`, `apps/web/src/components/public/jobs/JobSearchClient.tsx:20-41`. Ô "Địa điểm" ở trang chủ bị khóa, ghi "API hiện chưa hỗ trợ tìm theo địa điểm" — `apps/web/src/components/public/home/HomeHero.tsx:65-67`.

## Ràng buộc multi-tenant liên quan

`Application`, `ApplicationHistory`, `InterviewSchedule`, `JobPosting`, `JobPostingSkill` đều có `organizationId`; `Candidate`/`CV`/`Skill` dùng chung. Mọi đọc phía ứng viên phải lọc theo chính ứng viên (không theo tổ chức) và không được trả dữ liệu của ứng viên khác.
