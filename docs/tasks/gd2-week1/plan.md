# Plan — GĐ2 tuần 1: luồng ứng viên

> **Đã thay thế (2026-10-03).** Người dùng chọn triển khai theo 3 lát cắt (spec § "Cách triển khai"). Plan chi tiết của từng lát sẽ được lập riêng; bảng dưới giữ làm phác thảo tổng thể, không dùng để thực thi.

**Ngày:** 2026-10-03 · Chờ duyệt cùng [spec.md](spec.md). Chỉ ghi việc còn phải làm; sự thật nằm ở [survey.md](survey.md), lựa chọn ở [decision.md](decision.md).
**Lịch dự kiến:** 05/10 → 09/10, có thể tràn sang 10/10 (khoảng 5,5–6 ngày công sau khi thêm D6–D8). Ước lượng, chưa đo.

## Steps

Thứ tự: phần đổi hành vi hiện có viết test đỏ trước. Bước 0 là **defect** nên tách hai commit: test tái hiện trước, sửa sau.

| # | Step | Files | Rests on |
|---|---|---|---|
| 0a | **Defect múi giờ — RED.** Test `interviews.action` chạy với `TZ=UTC` và `TZ=Asia/Ho_Chi_Minh`: nhập 09:00 ngày 05/10 (trình duyệt VN) phải ra `2026-10-05T02:00:00.000Z`. Lưu output đỏ (dưới `TZ=UTC` hiện ra `09:00Z`). Commit riêng `test(web): …`. | `apps/web/src/servers/interviews/interviews.action.test.ts` (mới) | survey §S1 (đo múi giờ); D7 |
| 0b | **Defect múi giờ — fix.** Form tính `startAt` ISO ở client và gửi lên; action chỉ kiểm ISO hợp lệ, bỏ `toLocalDateTimeIso`. Form sửa điền sẵn ngày/giờ quy đổi ở client. Test 0a xanh. Commit riêng `fix(web): …`. | `apps/web/src/servers/interviews/interviews.action.ts:58-95`, `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx` | D7; spec R8, C17 |
| 1 | Test RED cho payload ứng viên: C1, C2, C7, C20 (lý do từ chối theo D8). | `apps/api/src/app/interviews/interviews.service.spec.ts`, `apps/api/src/app/applications/applications.service.spec.ts` | survey §S1, §S2; D1, D8 |
| 2 | Select/map riêng cho candidate: `candidateScheduleSelect`; rẽ nhánh trong `getMySchedules`, `getScheduleById`; map lịch sử trong `getApplicationHistory`, `getApplicationById` (bỏ `notes`/`changedBy`/`user`; `rejectionReason` chỉ ở dòng từ chối mới nhất khi đơn đang `rejected`). Bước 1 xanh, test staff cũ vẫn xanh. | `apps/api/src/common/utils/include-options.util.ts`, `apps/api/src/app/interviews/interviews.service.ts:325-401`, `apps/api/src/app/applications/applications.service.ts:485-503, 575-591` | D1, D8 |
| 3 | Test RED rồi làm R7: trong transaction của `withdraw` và `updateStatus` (khi sang `rejected`), `updateMany` lịch `scheduled` có `startAt > now` của đơn → `cancelled`. C16, E14. | `applications.service.ts` (`withdraw` từ `:287`, `updateStatus` `:505-573`), spec tương ứng | survey §S1 (không có chỗ hủy lịch); D6 |
| 4 | Migration `interview_schedules.location VARCHAR(255) NULL`; schema `location String? @db.VarChar(255)`; `prisma generate`; kiểm trên DB local. | `libs/backend/database/prisma/schema.prisma:607-626`, `libs/backend/database/prisma/migrations/<ts>_add_interview_schedule_location/migration.sql` | D2 |
| 5 | DTO + service: R3 (bắt buộc theo hình thức, `ValidateIf`), R9 (đổi hình thức xóa trường cũ), thêm `order` (`asc`/`desc`) cho truy vấn lịch (R10). Test C3, C18, C19 đỏ trước rồi xanh. | `apps/api/src/app/interviews/dto/create-interview.dto.ts`, `update-interview.dto.ts`, `get-interview-schedules-query.dto.ts`, `interviews.service.ts` (`updateSchedule` từ `:403`, `getMySchedules` `:325-389`) | survey §S1; D2; spec R3, R9, R10 |
| 6 | Lọc tin R4/R5: `salaryMin`, `salaryMax`, `skillIds` (≤ 20, UUID) trong query DTO; điều kiện giao khoảng và `jobPostingSkills.some` trong `findAll`; `min > max` → 400. `GET /job-postings/filter-options` (OptionalJwt) khai báo **trước** `@Get(':id')`. Test C10, C12, E15, E16. | `apps/api/src/app/job-postings/dto/job-posting.dto.ts:21-55`, `job-postings.service.ts:186-234`, `job-postings.controller.ts:93-106` | survey §S3; D3. `ASSUMPTION`: `Skill` có quan hệ ngược `jobPostingSkills` — kiểm khi làm |
| 7 | Kiểu + action web: `ICandidateInterviewSchedule`, `location` trong `IInterviewSchedule`; thay `IApplicationHistoryItem` bằng dạng API; action gửi `interviewType`, `onlineMeetingLink`, `location` (bỏ gán cứng `onsite`); action việc làm truyền 3 tham số; `getJobFilterOptionsAction`. Test C9, phần action của C4. | `apps/web/src/types/interfaces/interview.interface.ts:12-25`, `application.interface.ts:31-37`, `apps/web/src/servers/interviews/interviews.action.ts:40-95`, `apps/web/src/servers/applications/applications.action.ts:163-170`, `apps/web/src/servers/job-postings/job-postings.action.ts` | survey §S1–§S3 |
| 8 | Form recruiter: chọn hình thức; ô link (online) / địa điểm (onsite, bắt buộc); điền sẵn khi sửa. Test C4 (component). | `MutateInterviewScheduleModal.tsx` | survey §S1; D2 |
| 9 | Trang `/my-interviews`: server page lấy 2 nhóm (sắp tới `asc`, đã qua `desc`); phần hiển thị giờ là client component (R8); nhãn đang diễn ra / đã diễn ra / đã hủy; link chỉ khi `http(s)`; fallback địa điểm. Route vào `roleProtectedPaths.candidate`, mục menu, link từ thẻ đơn `interview`. Test C5, C6, C19, E1–E3, E8–E11, E18. | `apps/web/src/app/(candidate)/my-interviews/page.tsx` (mới), `apps/web/src/components/my-interviews/` (mới), `apps/web/src/lib/role-policy.ts:10`, `apps/web/src/components/public/layout/PublicHeader.tsx:34`, `apps/web/src/components/my-applications/ui/ApplicationCard.tsx` | survey §S1; D5; spec R10 |
| 10 | Timeline: "Xem tiến trình" trên thẻ đơn, tải lịch sử, tăng dần theo thời gian, đánh dấu trạng thái hiện tại, lý do theo D8, dựng bước "Đã nộp đơn" nếu thiếu. Test C8, E4, E5, E12, E13. | `apps/web/src/components/my-applications/ui/ApplicationTimeline.tsx` (mới), `ApplicationCard.tsx` | survey §S2; D1, D8 |
| 11 | UI lọc: lương min/max (nhận "15.000.000"), chọn nhiều kỹ năng; `applyFilters`/`clearFilters` mang 3 tham số mới; page đọc/truyền params; trang chủ bỏ ô địa điểm, thay chọn hình thức. Test C13, C14, E6, E15, E17. | `apps/web/src/components/public/jobs/JobSearchClient.tsx:33-56`, `apps/web/src/app/(public)/job-postings/page.tsx`, `apps/web/src/components/public/home/HomeHero.tsx:65-67` | survey §S3; D3, D4 |
| 12 | E2E trên `docker-compose.test.yml` (web trong container, `TZ` không đặt = UTC): fixture GĐ2; `gd2-candidate.e2e.ts` với `timezoneId: 'Asia/Ho_Chi_Minh'` (C15, C17); probe API cho C11, C12. Chạy toàn bộ: `nx test api`, `test:web`, `typecheck:web`, lint, e2e; lưu output vào `results/`. | `apps/web/e2e/gd2-candidate.e2e.ts` (mới), `apps/web/e2e/support/gd2-fixtures.mjs` (mới) | spec C11, C12, C15, C17. `ASSUMPTION`: theo khuôn `gd1-fixtures.mjs` — chưa đọc |
| 13 | `README.md` kết quả; tick 3 dòng "Candidate flows" ở roadmap; cập nhật brain dự án. Không tuyên bố merge/deploy khi chưa có bằng chứng. | `docs/tasks/gd2-week1/README.md` (mới), `docs/migration-roadmap.md` (Phase 1 › Candidate flows), `.claude/knowledge-base/ats-platform/` (harness) | — |

**Phân ngày (ước lượng):** T2 bước 0a–2 · T3 bước 3–6 · T4 bước 7–9 · T5 bước 10–11 · T6 bước 12–13 (có thể tràn sang T7).

## Which claim is proven at which tier

| Property | Proven by | **Not** provable by |
|---|---|---|
| Payload ứng viên không chứa trường nội bộ | unit-api (select/map) + e2e (response thật, C15) | screenshot |
| Giờ đặt lịch đúng múi giờ | unit-web chạy với 2 giá trị `TZ` + e2e web trong container UTC (C17) | unit chạy trên máy dev (máy dev đã ở giờ VN nên luôn "đúng") |
| Tự hủy lịch khi đơn đóng (R7) | unit-api (transaction, `updateMany`) + e2e (C15 rút đơn) | — |
| Lọc lương đúng với `NULL` trong DB | e2e/probe trên `ats_test` (C11) | unit-api với Prisma mock — chỉ thấy object `where` |
| Hiển thị lịch, timeline, bộ lọc | component (Vitest) | unit-api |
| Bố cục mobile/desktop của trang mới | trình duyệt thật ở 2 kích thước | component test (jsdom không áp CSS) |

## Cần duyệt trước khi code

Spec (R1–R10, C1–C20, E1–E19) và các bước trên. Khi bắt đầu, commit theo cụm (RED trước, fix sau cho phần đổi hành vi; bước 0 là hai commit riêng); không push/PR khi chưa được yêu cầu.
