# Spec — GĐ2 tuần 1: luồng ứng viên

**Ngày:** 2026-10-03 · **Nhánh:** `feat/gd2-candidate-flows` · Nguồn: đề cương ĐA2 (GĐ2: "Ứng viên: xem lịch phỏng vấn, timeline đơn ứng tuyển, lọc tìm việc"), [survey.md](survey.md), [decision.md](decision.md) D1–D5.
**Trạng thái:** đã duyệt. Lát 1 (lịch phỏng vấn) đã code ngày 2026-10-03, kết quả ở [README.md](README.md). Lát 2–3 chưa code.

## Mục tiêu

Ứng viên tự xem được lịch phỏng vấn của mình, theo dõi được đơn đã đi qua những bước nào, và lọc tin tuyển dụng theo lương và kỹ năng — chỉ nhận dữ liệu cần cho việc đó.

## Ngoài phạm vi tuần này

Ghi chú, form đánh giá, so sánh, chấm hàng loạt, CSV, email (tuần 2–4). Nhắc lịch qua Socket.IO/email. Địa điểm dạng text cho tin tuyển dụng (D4). Tìm kiếm full-text trong mô tả tin.

## Cách triển khai — 3 lát cắt theo tính năng (chốt 2026-10-03)

Mỗi lát tự đủ BE + FE + test và demo được; plan chi tiết lập cho lát 1 trước, lát sau lập khi lát trước xong.

| Lát | Nội dung | Rule | Tiêu chí / edge case |
|---|---|---|---|
| 1 — Lịch phỏng vấn | Defect múi giờ, cột `location`, form recruiter, payload tối thiểu cho lịch, tự hủy lịch khi đơn đóng, trang `/my-interviews` | R1 (lịch), R2, R3, R7, R8, R9, R10 | C1–C6, C15 (phần lịch + rút đơn), C16–C19; E1–E3, E7–E11, E14, E18 |
| 2 — Timeline | Payload tối thiểu cho lịch sử (D1, D8), sửa kiểu web, component timeline | R1 (lịch sử), R2 | C7–C9, C15 (phần timeline), C20; E4, E5, E12, E13 |
| 3 — Lọc tìm việc | Lương, kỹ năng, `filter-options`, bỏ ô địa điểm trang chủ | R4, R5, R6 | C10–C14; E6, E15–E17, E19 |

### Thiết kế lát 1 (đã duyệt 2026-10-03)

- **DB:** migration chỉ thêm `interview_schedules.location VARCHAR(255) NULL`.
- **API:**
  - Một `candidateScheduleSelect` trong `include-options.util.ts` là nguồn duy nhất cho dạng dữ liệu lịch của ứng viên; `getMySchedules` và `getScheduleById` rẽ nhánh candidate dùng nó; payload staff không đổi.
  - Thêm tham số `order` (`asc` | `desc`) cho truy vấn lịch.
  - DTO tạo/sửa áp R3; `updateSchedule` áp R9.
  - `withdraw` và `updateStatus` (khi sang `rejected`) gọi `updateMany` lịch `scheduled` có `startAt > now` → `cancelled`, trong transaction đang có (R7).
- **Web:**
  - Defect múi giờ làm trước, hai commit (test đỏ → sửa): form tính `startAt` ISO ở trình duyệt; server action chỉ kiểm ISO hợp lệ; form sửa điền sẵn giờ quy đổi ở client.
  - Form recruiter thêm chọn hình thức và ô link (online) hoặc địa điểm (onsite, bắt buộc).
  - Trang `/my-interviews`: server page gọi 2 lần — (1) lịch `scheduled` từ hôm qua trở đi, tăng dần; (2) lịch sử, giảm dần, có "Xem thêm". Client component chia nhóm theo R10 và hiển thị giờ theo múi giờ trình duyệt. Giao diện theo khung và phong cách của `my-applications`.
  - Thêm route vào `role-policy`, mục menu, và link từ thẻ đơn ở trạng thái `interview`.
- **Lỗi:** 400 có thông báo tiếng Việt; ứng viên chưa có hồ sơ → 404 như hiện tại; lỗi tải trang dùng `error.tsx` sẵn có của `(candidate)`.
- **Kiểm thử:** unit-api C1–C3, C16, C18, C19; unit-web/component C4–C6, C17, E1–E3, E8–E11, E18; e2e C15 (phần lịch, rút đơn) và C17 (web trong container UTC, trình duyệt giờ VN).

### Thiết kế lát 2 (duyệt 2026-10-04)

Plan: [plan-slice2-timeline.md](plan-slice2-timeline.md).

- **API:**
  - `candidateHistorySelect` (`include-options.util.ts`) cùng hàm `toCandidateHistory` là nguồn duy nhất cho dạng lịch sử của ứng viên.
  - `getApplicationHistory` và `getApplicationById` rẽ nhánh `candidate`, trả lịch sử theo `changedAt` tăng dần; staff không đổi.
  - `rejectionReason` chỉ gắn vào dòng `toStatus = rejected` mới nhất, khi đơn đang `rejected`, sau khi cắt khoảng trắng và bỏ nếu rỗng. Lý do phải lọc theo `toStatus` vì `updateStatus` ghi lý do ở mọi lần đổi trạng thái.
  - Hệ quả của D1: `GET /applications/my` của ứng viên không còn kèm `history`.
- **Web:**
  - Sửa kiểu `IApplicationHistoryItem` cho khớp API (C9).
  - `buildTimeline` sắp tăng dần, dựng bước "Đã nộp đơn" từ `appliedAt` khi thiếu (E13), đánh dấu bước lùi (E4) và bước hiện tại.
  - Trang `/my-applications/[id]` (D9) gọi một lần `GET /applications/:id`; thẻ đơn có link "Xem tiến trình".
  - Giờ định dạng ở client theo múi giờ trình duyệt.
- **Kiểm thử:** unit-api C7, C20, E12; unit-web/component C8, C9, E4, E5, E12, E13; e2e C15 (phần timeline) chạy ở CI `web-e2e`.

## Business rules

- **R1 — Dữ liệu tối thiểu cho ứng viên (D1).** Khi người gọi là `candidate`, API chỉ trả:
  - lịch: `interviewId`, `startAt`, `durationMinutes`, `interviewType`, `onlineMeetingLink`, `location`, `status`, `interviewer.fullName`, `application.applicationId`, `jobPosting.jobId`, `jobPosting.title`, `organization.name`;
  - lịch sử: `id`, `fromStatus`, `toStatus`, `changedAt`, và `rejectionReason` chỉ ở dòng từ chối mới nhất, khi đơn **đang** `rejected` (D8).
  Payload của staff không đổi.
- **R2 — Phạm vi.** Ứng viên chỉ thấy lịch/lịch sử của đơn mình, ở mọi tổ chức đã ứng tuyển (giữ hành vi hiện có, survey §S1, §S2).
- **R3 — Hình thức phỏng vấn (D2).** `online` bắt buộc `onlineMeetingLink` là URL `http(s)`; `onsite` bắt buộc `location` (không rỗng, ≤ 255 ký tự). Áp khi tạo lịch; khi sửa, chỉ kiểm tra lại nếu request đổi `interviewType`, `location` hoặc `onlineMeetingLink` (lịch cũ thiếu địa điểm vẫn đổi giờ được).
- **R4 — Lương (D3).** Khoảng ứng viên `[min, max]` (mỗi đầu tùy chọn) giao với khoảng của tin, **biên tính cả hai đầu** (`≥`, `≤`); tin chỉ ghi một đầu coi như khoảng một giá trị; tin không ghi lương bị loại khi đang lọc lương. `min > max` hoặc số âm → 400.
- **R5 — Kỹ năng (D3).** `skillIds` nhiều giá trị (UUID, tối đa 20), khớp bất kỳ. Danh sách chọn lấy từ `GET /job-postings/filter-options`: kỹ năng gắn với tin `active`, không trùng, sắp theo tên, xem được khi chưa đăng nhập.
- **R6 — Không chặn quyền đã có.** Non-staff vẫn chỉ thấy tin `active`, dù lọc gì (survey §S3).
- **R7 — Đơn đóng thì lịch đóng (D6).** Khi đơn chuyển sang `cancelled` hoặc `rejected`, mọi lịch `scheduled` có `startAt > now` của đơn đó thành `cancelled` trong cùng transaction. Lịch đã qua giờ giữ nguyên. Hoàn tác không khôi phục lịch.
- **R8 — Giờ (D7, sửa defect).** `startAt` do trình duyệt quy đổi sang ISO UTC rồi gửi; server không dựng `Date` từ chuỗi ngày/giờ. Hiển thị giờ và điền sẵn form sửa làm ở client theo múi giờ trình duyệt.
- **R9 — Đổi hình thức xóa trường cũ.** `online → onsite` thì `onlineMeetingLink = null`; `onsite → online` thì `location = null`.
- **R10 — Nhóm lịch phía ứng viên.** "Sắp tới" = `scheduled` và `startAt + durationMinutes > now` (gồm buổi đang diễn ra); mọi lịch còn lại (đã qua giờ, `completed`, `cancelled` — kể cả lịch hủy có giờ ở tương lai) vào nhóm "Đã qua & đã hủy". "Sắp tới" sắp tăng dần, nhóm còn lại giảm dần; không bị cắt bởi `limit` mặc định 20 (API thêm tham số `order`).

## Acceptance criteria — «When … then …»

Mức kiểm tra: **unit-api** = Jest với Prisma mock (chứng minh logic và hình dạng `where`/payload, không chứng minh kết quả truy vấn thật); **component** = Vitest + Testing Library; **unit-web** = Vitest cho action/policy; **e2e** = Playwright trên `docker-compose.test.yml` (`ats_test`), dùng API và PostgreSQL thật.

| ID | When … then … | Mức · nơi kiểm tra |
|---|---|---|
| C1 | Khi candidate gọi `GET /interviews/schedules/my`, thì mỗi phần tử chỉ có các trường R1; không có `scheduler`, email/SĐT/role/status của `interviewer`, `candidate.user`. Staff gọi thì payload như cũ. | unit-api `interviews.service.spec.ts` |
| C2 | Khi candidate gọi `GET /interviews/schedules/:id` của mình, thì nhận payload R1; của người khác thì 403. | unit-api |
| C3 | Khi recruiter tạo lịch `onsite` thiếu `location`, hoặc `online` thiếu link / link không phải URL, thì 400 và không ghi DB. | unit-api DTO + service |
| C4 | Khi recruiter chọn "Trực tiếp" trong form, thì hiện ô địa điểm (bắt buộc); chọn "Trực tuyến" thì hiện ô link; payload gửi đúng `interviewType` đã chọn, không còn gán cứng `onsite`. | component `MutateInterviewScheduleModal`; unit-web `interviews.action` |
| C5 | Khi candidate mở `/my-interviews`, thì thấy hai nhóm theo R10 ("Sắp tới" và "Đã qua & đã hủy"), mỗi lịch có vị trí, công ty, người phỏng vấn, giờ, thời lượng, hình thức; online có link mở tab mới; onsite có địa chỉ. | component |
| C6 | Khi guest mở `/my-interviews` thì về trang đăng nhập; staff mở thì bị chuyển theo role-policy; candidate được vào và thấy mục menu. | unit-web `role-policy`/`proxy` |
| C7 | Khi candidate gọi `GET /applications/:id/history` hoặc `GET /applications/:id`, thì lịch sử chỉ có trường R1 (`rejectionReason` chỉ ở dòng rejected); staff nhận đủ như cũ. | unit-api `applications.service.spec.ts` |
| C8 | Khi candidate mở chi tiết timeline của một đơn, thì thấy các bước theo thời gian tăng dần, bắt đầu "Đã nộp đơn", trạng thái hiện tại được đánh dấu; bị từ chối có lý do thì hiện lý do. | component `my-applications` |
| C9 | Khi `getApplicationHistoryAction` nhận payload đúng dạng API (`fromStatus`, `toStatus`, `changedAt`), thì trả kiểu web khớp; kiểu cũ `historyId`/`status` bị bỏ. | unit-web với fixture dạng API |
| C10 | Khi gọi `GET /job-postings` với `salaryMin`/`salaryMax`/`skillIds`, thì `where` có điều kiện giao khoảng R4 và `jobPostingSkills.some.skillId.in`; `min > max`, số âm, `skillIds` không phải UUID → 400. | unit-api |
| C11 | Cho 4 tin active: [10tr–20tr], [chỉ min 15tr], [chỉ max 8tr], [không lương]. Khi lọc `salaryMin=12tr` thì nhận tin 1, 2; `salaryMax=9tr` thì chỉ tin 3; `[12tr, 16tr]` thì tin 1, 2. Tin draft có lương khớp không bao giờ hiện cho khách. | e2e/probe trên `ats_test` |
| C12 | Khi lọc `skillIds=[a,b]`, thì nhận tin có a hoặc b; khi gọi `GET /job-postings/filter-options` (chưa đăng nhập), thì nhận kỹ năng của tin active, không trùng, sắp theo tên; route không bị `:id` nuốt. | unit-api + e2e/probe |
| C13 | Khi ứng viên chọn khoảng lương và kỹ năng trên trang việc làm, thì URL có `salaryMin`/`salaryMax`/`skillIds`, kết quả tải lại theo đó; "Xóa lọc" đưa về mặc định. | component `JobSearchClient` |
| C14 | Khi mở trang chủ, thì không còn ô "Địa điểm" bị khóa; chọn hình thức làm việc rồi tìm thì sang `/job-postings?locationType=…`. | component `HomeHero` |
| C15 | Hành trình thật: recruiter (fixture) đã có 1 lịch online + 1 lịch onsite cho ứng viên; ứng viên đăng nhập, mở `/my-interviews` thấy cả hai với link/địa chỉ; response `schedules/my` trong trình duyệt không chứa email nhân sự; mở timeline thấy các bước của đơn; recruiter từ chối đơn thì lịch của đơn đó hiện "Đã hủy". *(Hành trình dùng từ chối, không dùng rút đơn: rút đơn chỉ được khi đơn ở `applied`, còn lịch chỉ tạo cho đơn ở `interview` — `applications.service.ts:325-329`. Rút đơn được phủ ở unit-api C16. Phần timeline thuộc lát 2.)* | e2e `apps/web/e2e/gd2-candidate-schedules.e2e.ts` (lát 1) |
| C16 | Khi rút đơn hoặc recruiter từ chối đơn, thì lịch `scheduled` chưa diễn ra của đơn đó thành `cancelled`; lịch đã qua, lịch của đơn khác không đổi; nếu transaction lỗi thì không có gì thay đổi. | unit-api `applications.service.spec.ts` |
| C17 | **(Defect, RED trước.)** Khi recruiter nhập 09:00 ngày 05/10 ở trình duyệt múi giờ VN, thì `startAt` lưu là `2026-10-05T02:00:00.000Z` dù server chạy `TZ=UTC` hay `Asia/Ho_Chi_Minh`; form sửa điền lại 09:00. | unit-web `interviews.action` (chạy với cả hai `TZ`); component modal; e2e: Playwright `timezoneId: 'Asia/Ho_Chi_Minh'` với web chạy trong container UTC |
| C18 | Khi sửa lịch `online → onsite`, thì link bị xóa; `onsite → online` thì địa điểm bị xóa. | unit-api |
| C19 | Khi ứng viên có 25 lịch (22 đã qua, 3 sắp tới), thì trang vẫn hiện đủ 3 lịch sắp tới; `order=desc` sắp giảm dần. | unit-api (`order`); component (gọi 2 nhóm) |
| C20 | Khi đơn bị từ chối rồi được hoàn tác, thì lịch sử ứng viên nhận không có `rejectionReason` ở dòng nào; khi đơn đang bị từ chối, thì chỉ dòng từ chối mới nhất có lý do. | unit-api |

## Edge cases

| ID | Tình huống | Kỳ vọng | Mức |
|---|---|---|---|
| E1 | Ứng viên chưa có lịch nào | Trạng thái trống có hướng dẫn | component |
| E2 | Lịch onsite cũ có `location = null` | Hiện "Nhà tuyển dụng sẽ gửi địa điểm" | component |
| E3 | Lịch bị hủy | Nằm ở "Đã qua & đã hủy", nhãn "Đã hủy", không hiện link | component |
| E4 | Đơn có bước quay lại (revert) | Timeline hiện đủ các bước theo thời gian, kể cả bước lùi | component |
| E5 | Đơn đã rút | Bước cuối "Đã rút đơn" | component |
| E6 | Không có tin active nào có kỹ năng | `filter-options` trả rỗng; UI ẩn mục kỹ năng | unit-api + component |
| E7 | User có role candidate nhưng chưa có hồ sơ Candidate | 404 như hiện tại | unit-api (giữ test cũ) |
| E8 | Buổi đang diễn ra (đã qua giờ bắt đầu, chưa hết thời lượng) | Nhóm "Sắp tới", nhãn "Đang diễn ra", link còn bấm được | component |
| E9 | Quá giờ nhưng recruiter chưa cập nhật (vẫn `scheduled`) | Nhóm "Đã qua & đã hủy", nhãn "Đã diễn ra" (không phải "Hoàn thành") | component |
| E10 | Link họp cũ không phải `http(s)` | Hiện dạng chữ, không thành link | component |
| E11 | Hai lịch trùng giờ ở hai công ty | Hiện cả hai; tuần này không cảnh báo | component |
| E12 | Bị từ chối, lý do trống hoặc chỉ khoảng trắng | Chỉ hiện "Bị từ chối", không có khung lý do rỗng | unit-api + component |
| E13 | Đơn cũ thiếu dòng `applied` đầu tiên | Dựng bước "Đã nộp đơn" từ `appliedAt` | component |
| E14 | Hoàn tác một lần từ chối | Lịch đã tự hủy vẫn `cancelled` (R7) | unit-api |
| E15 | `salaryMin = salaryMax`; nhập "15.000.000" | Hợp lệ; hiểu đúng là 15000000 | unit-api + component |
| E16 | `skillIds` không tồn tại / > 20 giá trị | 0 kết quả (không 400) / 400 | unit-api |
| E17 | Đổi bộ lọc khi đang ở trang > 1; bấm "Xóa lọc" | Về trang 1; xóa cả 3 tham số mới | component |
| E18 | Hết phiên khi đang ở `/my-interviews` | Đăng nhập lại xong quay về `/my-interviews` | unit-web `proxy` |
| E19 | Staff đang đăng nhập mở trang việc làm công khai | Chỉ thấy tin tổ chức mình (hành vi có sẵn, survey §S3); ghi nhận, không sửa tuần này | — |

## Có cần e2e không?

Có, ở ba chỗ, vì unit test với Prisma mock không thấy được: (1) response thật trong trình duyệt có lộ dữ liệu nhân sự hay không (C15); (2) PostgreSQL xử lý `NULL` trong điều kiện giao khoảng lương ra kết quả đúng (C11, C12); (3) giờ đặt lịch đúng khi web chạy trong container `TZ=UTC` còn trình duyệt ở giờ VN (C17) — đúng cấu hình mà lỗi xảy ra.
