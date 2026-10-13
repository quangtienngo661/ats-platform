# Spec — GĐ2 SP1: đánh giá ứng viên (scorecard, ghi chú, so sánh)

**Ngày:** 2026-10-13 · **Trạng thái:** chờ người dùng đọc spec · **Nguồn:** artifact "Lộ trình ĐA2 ATS Platform"
(A-01, A-07 và mục "so sánh ứng viên" trong phần đề cương giao của GĐ2), các quyết định ở [decision.md](decision.md).
Chưa có nhánh riêng và chưa commit. Nhánh hiện tại `feat/gd2-candidate-flows` đang có PR #64 mở.

## Mục tiêu

Recruiter ghi lại đánh giá của mình về ứng viên theo cấu trúc cố định (scorecard sau mỗi buổi phỏng vấn, ghi chú tự
do), rồi đặt 2–4 ứng viên của cùng một tin cạnh nhau để cân nhắc. Ứng viên **không bao giờ** thấy những dữ liệu
này. Không có gì ở đây tự đổi trạng thái đơn: quyết định tuyển vẫn do người (ADR 0002).

## Vị trí trong GĐ2

GĐ2 còn lại được tách thành 3 spec, mỗi spec có vòng spec → plan → build riêng:

| Spec | Gồm | Trạng thái |
|---|---|---|
| **SP1 (spec này)** | Scorecard (A-01), ghi chú (A-07), so sánh ứng viên | đang viết |
| SP2 | Chấm CV hàng loạt, xuất CSV (A-05) | chưa bắt đầu |
| SP3 | Email thông báo tự động (A-02) | chưa bắt đầu |

SP1 làm trước vì scorecard là đầu vào của AI co-pilot ở GĐ4. Phần C-05 còn lại (địa điểm dạng text cho tin
tuyển dụng, D4 của tuần 1) không thuộc SP1.

## Ngoài phạm vi SP1

Mẫu tiêu chí cấu hình theo tổ chức · @mention · ghi chú riêng tư · nhiều interviewer trên một lịch (panel) · ẩn
scorecard của người khác đến khi tự nộp · thông báo hoặc email cho recruiter khi có scorecard (chưa thuộc spec nào: SP3 chỉ gửi cho ứng viên) · co-pilot dùng scorecard
(GĐ4) · giữ lựa chọn so sánh qua nhiều trang · mọi thao tác tự đổi trạng thái theo điểm.

## Quy tắc

| # | Quy tắc |
|---|---|
| R1 | Chỉ người có `userId` trùng `InterviewSchedule.interviewerId` được nộp hoặc sửa scorecard của lịch đó. Người đặt lịch, org_admin khác và platform admin **không** được, trừ khi chính họ là interviewer. |
| R2 | Chỉ nộp được khi lịch ở trạng thái `completed` (`scheduled` và `cancelled` bị từ chối). |
| R3 | Scorecard sửa được cho đến khi đơn sang `hired`, `rejected` hoặc `cancelled`; sau đó chỉ đọc. |
| R4 | Mỗi lịch có tối đa một scorecard (unique theo `interviewId`). Nộp lần hai là sửa bản cũ. |
| R5 | Bốn điểm là số nguyên 1–5, chặn ở DTO và bằng `CHECK` ở DB. `recommendation` bắt buộc. `comment` tối đa 2000 ký tự, có thể trống. |
| R6 | `organizationId` của mọi bản ghi mới lấy từ bản ghi cha (lịch hoặc đơn), không nhận từ client. Bản ghi của tổ chức khác trả 404. |
| R7 | Ứng viên không đọc được scorecard hay ghi chú: route trả 403 và không có trường nào trong payload dành cho ứng viên. |
| R8 | Staff cùng tổ chức (recruiter, org_admin) đọc mọi scorecard và ghi chú của tổ chức đó. Platform admin chỉ đọc. |
| R9 | Ghi chú: staff cùng tổ chức tạo và đọc; chỉ tác giả sửa hoặc xoá (xoá cứng); platform admin không ghi. `body` được cắt khoảng trắng, không rỗng, tối đa 2000 ký tự. |
| R10 | So sánh nhận 2–4 `applicationId` khác nhau, tất cả thuộc `jobId` trong đường dẫn, và người gọi phải truy cập được phòng ban của tin đó. |
| R11 | So sánh chỉ hiển thị: không xếp hạng "tốt nhất", không ghi gì, không đổi trạng thái đơn. Điểm và nhãn AI ghi rõ là "gợi ý". |
| R12 | *(bổ sung khi viết spec, cần xác nhận)* Xoá lịch đã có scorecard bị từ chối bằng 409 thay vì cascade. |

## Thiết kế

### Dữ liệu (một migration Prisma mới)

- Enum mới `ScorecardRecommendation`: `strong_no | no | yes | strong_yes`. Không dùng lại `AiRecommendation`
  (enum đó chỉ còn `interview | reject` sau khi bỏ `hire`).
- `InterviewScorecard` → `interview_scorecards`: `id`, `organizationId`, `interviewId` (**unique**, FK
  `InterviewSchedule`, `onDelete: Restrict`), `authorId` (FK `User`), `technicalSkills`, `problemSolving`,
  `communication`, `cultureFit` (`Int`, `CHECK` 1–5), `recommendation`, `comment` (`VarChar(2000)?`),
  `submittedAt`, `updatedAt`. Index theo `organizationId`.
- `ApplicationNote` → `application_notes`: `id`, `organizationId`, `applicationId` (FK, `onDelete: Cascade`),
  `authorId` (FK `User`), `body` (`VarChar(2000)`), `createdAt`, `updatedAt`. Index theo `applicationId` và
  `organizationId`.
- Quan hệ ngược được thêm vào `Organization`, `User`, `InterviewSchedule`, `Application`.

### API

| Endpoint | Ai | Ghi chú |
|---|---|---|
| `PUT /interviews/schedules/:id/scorecard` | interviewer của lịch (R1) | tạo hoặc sửa; R2, R3, R4, R5 |
| `GET /interviews/schedules/:id/scorecard` | staff (R8) | 404 nếu chưa có |
| `GET /interview-scorecards/application/:applicationId` | staff (R8) | mọi scorecard của đơn, kèm ngày, hình thức, tên interviewer |
| `POST /applications/:applicationId/notes` | staff (R9) | |
| `GET /applications/:applicationId/notes` | staff (R8) | mới nhất trước, `page`/`limit` |
| `PATCH` · `DELETE /application-notes/:id` | tác giả (R9) | |
| `GET /applications/job/:jobId/compare?applicationIds=a,b,c` | staff (R10) | không ghi gì (R11) |

Module mới `interview-scorecards` và `application-notes`; so sánh là `ApplicationComparisonService` trong module
`applications` để `applications.service.ts` không phình thêm. Quyền đi qua `TenantCaller`,
`assertCanAccessApplication` và `organizationScope` như các module hiện có.

Mỗi phần tử của kết quả so sánh gồm: ứng viên (tên), `status`, `appliedAt`; `screening` (`overallScore`,
`skillsScore`, `experienceScore`, `educationScore`, `aiRecommendation`, `matchedSkills`, `missingSkills`) hoặc
`null`; `scorecards` (số lượng, trung bình từng tiêu chí hoặc `null` nếu chưa có, danh sách `{interviewerName,
recommendation}`); `noteCount`.

### Giao diện web (tiếng Việt)

1. **Trang chi tiết ứng viên** (`CandidateDetailClient.tsx`, hiện chỉ render tab Tổng quan) thêm thanh tab
   *Tổng quan | Đánh giá phỏng vấn | Ghi chú*. Tab đánh giá có một thẻ cho mỗi buổi phỏng vấn; buổi nào mình là
   interviewer, đã `completed` và chưa có scorecard thì có nút "Nộp đánh giá" mở form (4 ô điểm 1–5, khuyến nghị,
   nhận xét). Khi đơn đã chốt, form bị khoá. Tab ghi chú có ô thêm và danh sách; sửa/xoá chỉ hiện với ghi chú của mình.
2. **Drawer lịch phỏng vấn** (`ScheduleDetailDrawer`): sau khi hoàn tất, nếu mình là interviewer, hiện liên kết
   tới tab Đánh giá của đơn đó.
3. **Danh sách ứng viên theo tin** (`jobs/[jobId]/candidates`, qua `CandidateRow`): thêm checkbox và thanh "So sánh"
   bật khi chọn 2–4 ứng viên của trang hiện tại.
4. **Trang so sánh** `jobs/[jobId]/compare?ids=…`: bảng cạnh nhau (cột là ứng viên), cuộn ngang trên điện thoại;
   `ids` sai thì báo lỗi kèm nút quay lại.
5. Route nằm dưới prefix `/jobs` của nhóm `recruiting` trong `role-policy.ts`; việc candidate bị chặn sẽ được
   kiểm bằng test chứ không giả định.
6. Server actions mới theo khuôn `servers/<miền>/*.action.ts` + test: `servers/scorecards`, `servers/notes`, và
   `compareApplicationsAction` trong `servers/applications`.

### Lỗi (tiếng Việt)

403 không phải interviewer của lịch · 409 buổi phỏng vấn chưa hoàn tất · 409 đơn đã chốt, không sửa được đánh giá ·
409 lịch đã có đánh giá, không xoá được (R12) · 400 điểm ngoài 1–5, nhận xét hoặc ghi chú quá dài hoặc rỗng,
so sánh không đủ 2–4 hoặc `ids` trùng hoặc không thuộc tin · 404 bản ghi của tổ chức khác (không lộ sự tồn tại).

## Điểm bổ sung phát hiện khi viết spec (cần người dùng xác nhận)

`InterviewsService.removeSchedule` hiện **xoá cứng** lịch bất kể trạng thái, kể cả `completed`
(`apps/api/src/app/interviews/interviews.service.ts:499-505`, kiểm bằng cách đọc code). Nếu thêm scorecard mà không
xử lý thì xoá lịch sẽ hoặc lỗi 500 do FK, hoặc (nếu cascade) âm thầm mất đánh giá. Đề xuất R12: FK `Restrict` và
`removeSchedule` trả 409 khi lịch đã có scorecard. Lịch chưa có scorecard xoá như cũ. Phương án khác là cascade
(mất đánh giá khi xoá lịch) hoặc cấm xoá mọi lịch `completed` (đổi hành vi hiện có rộng hơn cần thiết); spec chọn
`Restrict` vì không mất dữ liệu và chỉ đổi hành vi đúng trường hợp có đánh giá.

## Tiêu chí chấp nhận

| # | Tiêu chí | Kiểm bằng |
|---|---|---|
| C1 | Interviewer nộp scorecard cho lịch `completed` → tạo; nộp lần hai → sửa cùng một bản ghi | API unit |
| C2 | Người đặt lịch, org_admin khác, platform admin và ứng viên không nộp được (403) | API unit |
| C3 | Lịch `scheduled` hoặc `cancelled` → 409 | API unit |
| C4 | Đơn `hired`/`rejected`/`cancelled`: PUT → 409, GET vẫn đọc được | API unit |
| C5 | Điểm 0, 6, 3.5 hoặc thiếu → 400; `INSERT` trực tiếp điểm 0 hoặc 6 bị DB từ chối | API unit + probe PostgreSQL thật |
| C6 | Hai scorecard cùng `interviewId` bị DB từ chối | probe |
| C7 | Lịch hoặc đơn của tổ chức khác → 404 ở mọi endpoint | API unit |
| C8 | Payload dành cho ứng viên (`applications/my`, `applications/:id`, `:id/history`, `schedules/my`) không chứa scorecard hay ghi chú; route scorecard/ghi chú trả 403 cho ứng viên | API unit + smoke |
| C9 | Ghi chú: tạo/đọc/sửa/xoá đúng quyền R9; `body` rỗng hoặc quá dài → 400 | API unit |
| C10 | Xoá đơn thì ghi chú bị xoá theo | probe |
| C11 | So sánh: đúng 2–4 `id` không trùng thuộc tin; sai → 400; tin của tổ chức khác → 404; thiếu screening → `screening: null` | API unit |
| C12 | So sánh không ghi gì và không có trường xếp hạng | API unit |
| C13 | Xoá lịch đã có scorecard → 409; lịch chưa có → xoá như cũ | API unit + probe |
| C14 | Web: form scorecard kiểm hợp lệ; form khoá khi đơn chốt; sửa/xoá chỉ trên ghi chú của mình; chọn 2–4; bảng so sánh; candidate bị chặn khỏi `/jobs/:id/compare` | Vitest |
| C15 | Hành trình thật: recruiter A hoàn tất lịch và nộp scorecard → recruiter B thấy, thêm ghi chú, so sánh 2 ứng viên; API phía ứng viên không có dữ liệu đó | Playwright |

### Edge case

| # | Trường hợp | Hành vi |
|---|---|---|
| E1 | Interviewer bị vô hiệu hoá sau khi đặt lịch | Không ai nộp thay; scorecard cũ vẫn đọc được |
| E2 | Lịch `completed` rồi đơn sang `hired` trước khi nộp | PUT → 409 (R3), không có scorecard |
| E3 | Hai lần PUT gần như đồng thời | Một bản ghi (unique), lần sau thắng |
| E4 | Lịch bị hủy sau khi đã có scorecard | Chặn bởi chuyển trạng thái: `completed`/`cancelled` không đổi sang nhau; không phát sinh |
| E5 | Đơn trong so sánh bị `cancelled` | Vẫn so sánh được, hiển thị trạng thái |
| E6 | Đơn có screening `failed` hoặc chưa chạy | Cột AI hiện "chưa có"; không lỗi |
| E7 | `ids` có phần tử không phải UUID | 400, không văng trang |
| E8 | Ghi chú bị xoá khi đang mở ở máy khác | Sửa → 404, UI báo và tải lại |
| E9 | Chọn 5 ứng viên | Nút So sánh tắt, có chú thích |
| E10 | Xoá một ghi chú của người khác bằng gọi API trực tiếp | 403 |

## Kiểm thử và quy trình

Theo khuôn tuần 1: test viết cùng tính năng, và mọi lỗi tìm thấy khi làm thì test đỏ commit trước, sửa commit sau.
Probe PostgreSQL thật trên test stack cho `CHECK`, unique, FK và cascade vì mock không chứng minh được chúng. Kết quả
và log ghi vào thư mục này như `gd2-week1/results`.

## Chưa xác minh

- Cách `role-policy.ts` khớp prefix `/jobs` cho `/jobs/:id/compare` (sẽ có test).
- Trang danh sách ứng viên theo tin (`jobs/[jobId]/candidates/page.tsx`) là server component hay client: quyết
  định chỗ đặt state chọn 2–4 sẽ chốt ở plan sau khi đọc file.
- Chưa có bằng chứng người dùng thật cần ba thứ này; spec bám đề cương và artifact kế hoạch.
