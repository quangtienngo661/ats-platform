# Decisions — GĐ2 tuần 1: luồng ứng viên

**Ngày:** 2026-10-03 · D1–D4 và D6–D8 do người dùng chọn qua `AskUserQuestion` cùng ngày; D5 là mặc định của người làm, chưa hỏi (dễ đảo).
Cả ba lát đã code (2026-10-03 và 2026-10-04): mọi `File:` trỏ tới nơi thật.

---

## D1 — Ứng viên được nhận dữ liệu gì từ API lịch phỏng vấn và lịch sử đơn?

| Option | Pros | Cons |
|---|---|---|
| A — Tối thiểu | Không lộ liên lạc nhân sự, không lộ ghi chú nội bộ | Thêm nhánh `candidate` ở 3 service method |
| B — Tối thiểu + `rejectionReason` | Ứng viên biết lý do bị từ chối | Recruiter phải được báo trước rằng ô này hiển thị cho ứng viên |
| C — Giữ nguyên API, chỉ ẩn trên UI | Ít việc nhất | Email/SĐT nhân sự và `notes` vẫn nằm trong response (DevTools) |

**Chosen:** B. Với người gọi là candidate:
- Lịch: `interviewer.fullName`, tên vị trí, tên tổ chức, `startAt`, `durationMinutes`, `interviewType`, `onlineMeetingLink`, `location`, `status`. Không có `scheduler`, không có email/SĐT/role/status của nhân sự, không có dữ liệu `candidate.user`.
- Lịch sử: `id`, `fromStatus`, `toStatus`, `changedAt`; `rejectionReason` **chỉ** ở dòng từ chối mới nhất và chỉ khi đơn đang `rejected` (thu hẹp bởi D8). Không có `notes`, `changedBy`, `user`.
- Lọc ở API, không ẩn ở UI. Áp cho `GET /interviews/schedules/my`, `GET /interviews/schedules/:id`, `GET /applications/:id/history`, `GET /applications/:id`.
- Hệ quả: khi làm form từ chối (GĐ2 tuần 2), nhãn phải nói rõ "ứng viên sẽ thấy lý do này".

**Mechanism:** select/map riêng cho candidate trong service (không đổi payload của staff).
**File:** `apps/api/src/common/utils/include-options.util.ts` (`candidateScheduleSelect`), `apps/api/src/app/interviews/interviews.service.ts` (`getMySchedules`, `getScheduleById`). Phần lịch sử đơn: `candidateHistorySelect` (cùng file) và `apps/api/src/app/applications/candidate-history.ts`.

| | |
|---|---|
| **Authorised by** | survey §S1 (payload lộ `User` nhân sự), §S2 (payload lộ `notes`); lựa chọn của người dùng 2026-10-03 |
| **Diverges from reference?** | Không có hệ thống tham chiếu |
| **The answer, out loud** | Ứng viên chỉ nhận đủ để đi phỏng vấn và theo dõi đơn; mọi thứ nội bộ bị cắt ngay ở API. |

---

## D2 — Phỏng vấn trực tiếp chưa có địa điểm

| Option | Pros | Cons |
|---|---|---|
| A — Thêm cột `location` | Lịch onsite có địa chỉ thật | Migration + sửa form recruiter |
| B — Để tuần sau | Không đụng schema | Lịch onsite của ứng viên không có địa chỉ |

**Chosen:** A. `InterviewSchedule.location String?` (nullable, chỉ thêm cột).
**Hệ quả bắt buộc (không phải quyết định mới):** form recruiter hiện gán cứng `onsite` và không có link (survey §S1), nên form phải có thêm: chọn hình thức `online`/`onsite`, link họp (online), địa điểm (onsite). Thiếu phần này thì ứng viên luôn thấy "trực tiếp, không địa chỉ".

**Mechanism:** migration thêm cột; DTO tạo/sửa lịch nhận `location`; quy tắc bắt buộc theo hình thức (spec R3).
**File:** `libs/backend/database/prisma/schema.prisma`, `libs/backend/database/prisma/migrations/20261005000000_add_interview_schedule_location/migration.sql`, `apps/api/src/app/interviews/interview-schedule.rules.ts` (`resolveInterviewPlace`), `apps/api/src/app/interviews/dto/create-interview.dto.ts`, `update-interview.dto.ts`, `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx`, `apps/web/src/servers/interviews/interviews.action.ts` (`normalizeSchedulePayload`).

| | |
|---|---|
| **Authorised by** | survey §S1; lựa chọn của người dùng |
| **Diverges from reference?** | Không |
| **The answer, out loud** | Lịch phỏng vấn phải đủ thông tin để ứng viên đến được: link nếu online, địa chỉ nếu trực tiếp. |

---

## D3 — Lọc tìm việc làm tới đâu?

| Option | Pros | Cons |
|---|---|---|
| A — Lương + kỹ năng, endpoint công khai mới | Danh sách kỹ năng chỉ gồm kỹ năng có tin đang mở | Thêm 1 endpoint |
| B — Lương + kỹ năng, mở `GET /skills` | Ít việc | Hiện cả kỹ năng không có tin (lọc ra 0) |
| C — Chỉ lương | Nhẹ nhất | Thiếu một tiêu chí của roadmap |

**Chosen:** A.
- Lương: khoảng của ứng viên **giao** với khoảng của tin; tin chỉ ghi một đầu thì coi khoảng là đúng giá trị đó; tin không ghi lương bị loại khi đang lọc lương. Cùng đơn vị đang lưu (hiển thị bằng `toLocaleString('vi-VN')`).
- Kỹ năng: chọn nhiều, khớp **bất kỳ** (OR).
- Danh sách kỹ năng: `GET /job-postings/filter-options` (OptionalJwt), trả các kỹ năng gắn với tin `active`.

**Mechanism:** thêm `salaryMin`, `salaryMax`, `skillIds` vào query DTO và `where` của `findAll`; endpoint filter-options.
**File:** `apps/api/src/app/job-postings/dto/job-posting.dto.ts` (`FindJobPostingsQueryDto`), `job-posting-filters.ts` (`jobPostingFilters`), `job-postings.service.ts` (`findAll`, `getFilterOptions`), `job-postings.controller.ts` (`filterOptions`); web: `apps/web/src/components/public/jobs/JobSearchClient.tsx`, `apps/web/src/lib/job-filter-params.ts`, `apps/web/src/lib/salary-input.ts`.

| | |
|---|---|
| **Authorised by** | survey §S3; roadmap Phase 1 "Job search: filter by category, location type, salary, skill"; lựa chọn của người dùng |
| **Diverges from reference?** | Không |
| **The answer, out loud** | Ứng viên lọc được theo mức lương mong muốn và kỹ năng của mình, chỉ trên kỹ năng thực sự có tin tuyển. |

---

## D4 — Ô "Địa điểm" bị khóa ở trang chủ

**Chosen:** bỏ ô; thay bằng chọn hình thức làm việc (`remote`/`onsite`/`hybrid`), dẫn sang `/job-postings?locationType=…`. Không thêm cột địa điểm cho JobPosting.
**File:** `apps/web/src/components/public/home/HomeHero.tsx`, `apps/web/src/lib/work-types.ts`.

| | |
|---|---|
| **Authorised by** | survey §S3 (không có cột địa điểm); lựa chọn của người dùng |
| **The answer, out loud** | Không giữ một ô tìm kiếm không làm gì; dùng tiêu chí đã có dữ liệu. |

---

## D5 — Ứng viên xem lịch ở đâu? (mặc định, chưa hỏi)

**Chosen:** trang riêng `/my-interviews` (sắp tới / đã qua, xuyên mọi đơn), thêm vào menu ứng viên; thẻ đơn ở trạng thái `interview` có link sang trang này. Lý do: một ứng viên có thể có nhiều lịch ở nhiều đơn; nhét vào từng thẻ đơn khó xem tổng thể. Đổi được dễ nếu bạn muốn khác.
**File:** `apps/web/src/app/(candidate)/my-interviews/page.tsx`, `apps/web/src/components/my-interviews/MyInterviewsClient.tsx`, `apps/web/src/lib/role-policy.ts`, `apps/web/src/components/public/layout/PublicHeader.tsx`.

---

## D6 — Đơn bị rút/từ chối thì lịch sắp tới ra sao? (người dùng chọn)

| Option | Pros | Cons |
|---|---|---|
| A — Tự hủy lịch | Dữ liệu đúng cho cả recruiter và ứng viên | Đổi hành vi của `withdraw`/`updateStatus` |
| B — Chỉ đánh dấu phía ứng viên | Không đụng dữ liệu | Recruiter vẫn thấy lịch `scheduled` của đơn đã đóng |

**Chosen:** A. Khi đơn chuyển sang `cancelled` (rút) hoặc `rejected`, mọi lịch `scheduled` có `startAt > now` của đơn đó chuyển sang `cancelled` trong **cùng transaction** với việc đổi trạng thái. Lịch đã qua giờ giữ nguyên.
**Hệ quả:** hoàn tác một lần từ chối **không** khôi phục lịch đã hủy; recruiter đặt lại nếu cần (ghi rõ trong UI hoàn tác là việc của tuần sau, không làm tuần này).
**File:** `apps/api/src/app/applications/applications.service.ts` (`cancelUpcomingSchedules`, gọi từ `withdraw` và `updateStatus`).

| | |
|---|---|
| **Authorised by** | survey §S1 (không có chỗ nào hủy lịch); lựa chọn của người dùng |
| **The answer, out loud** | Đơn đã đóng thì buổi phỏng vấn của nó cũng đóng, để không ai đến một buổi không còn ý nghĩa. |

---

## D7 — Sửa lệch múi giờ khi đặt lịch (người dùng chọn) — đây là **defect có sẵn**

| Option | Pros | Cons |
|---|---|---|
| A — Trình duyệt gửi giờ đã quy đổi | Đúng ở mọi môi trường và mọi múi giờ người nhập | Sửa form + action |
| B — Cố định `+07:00` ở server | Đơn giản | Sai nếu người dùng ở múi giờ khác |
| C — Đặt `TZ` cho container | Một dòng | Môi trường nào quên đặt là lệch lại |

**Chosen:** A. Form tính `startAt` ISO (UTC) từ ngày/giờ đã nhập theo múi giờ trình duyệt và gửi trường đó; server action chỉ kiểm tra ISO hợp lệ, không tự dựng `Date` từ chuỗi ngày/giờ. Hiển thị giờ (recruiter và ứng viên) làm ở client component để dùng múi giờ trình duyệt; form sửa điền sẵn ngày/giờ cũng quy đổi ở client.
**Quy trình:** vì là lỗi đang tồn tại, làm theo thứ tự defect: test tái hiện (đỏ) commit trước, sửa commit sau.
**File:** `apps/web/src/lib/interview-time.ts` (`localDateTimeToIso`, `isAbsoluteIso`), `apps/web/src/servers/interviews/interviews.action.ts` (`normalizeSchedulePayload`), `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx` (ô ẩn `startAt`).

| | |
|---|---|
| **Authorised by** | survey §S1 (đo: UTC trong container → 09:00 thành 16:00 VN); lựa chọn của người dùng |
| **The answer, out loud** | Giờ được quy đổi ở nơi biết chắc múi giờ của người nhập — trình duyệt — chứ không để server đoán. |

---

## D8 — Lý do của một lần từ chối đã được hoàn tác (người dùng chọn)

**Chosen:** chỉ hiện `rejectionReason` khi **trạng thái hiện tại** của đơn là `rejected`, và chỉ ở dòng từ chối mới nhất. Bước từ chối đã hoàn tác vẫn hiện trong timeline nhưng không kèm lý do. Bổ sung cho D1.
**File:** `apps/api/src/app/applications/candidate-history.ts` (`toCandidateHistory`), gọi từ `applications.service.ts` (`getApplicationHistory`, `getApplicationById`).

| | |
|---|---|
| **Authorised by** | survey §S2 (hoàn tác được từ `rejected`); lựa chọn của người dùng |
| **The answer, out loud** | Ứng viên chỉ đọc lý do của quyết định đang có hiệu lực. |

---

## D9 — Timeline của một đơn hiện ở đâu (người dùng chọn 2026-10-04)

| Option | Pros | Cons |
|---|---|---|
| A — Trang chi tiết `/my-applications/[id]` | Có URL riêng (mở từ thông báo, e2e đi thẳng); server page tải một lần | Phải chuyển trang |
| B — Mở rộng ngay trong thẻ | Không rời danh sách | Không có URL; thêm trạng thái tải/lỗi trong thẻ |
| C — Drawer bên phải | Giữ danh sách phía sau | Trên mobile chiếm cả màn hình; không có URL |

**Chosen:** A. Thẻ đơn có link "Xem tiến trình"; `role-policy` không cần đổi vì `/my-applications` đã bao cả đường dẫn con.
**Mechanism:** server page gọi `getApplicationByIdAction`, render `ApplicationTimeline` (client).
**File:** `apps/web/src/app/(candidate)/my-applications/[id]/page.tsx`, `apps/web/src/components/my-applications/ApplicationDetail.tsx`, `apps/web/src/components/my-applications/timeline/`.

| | |
|---|---|
| **Authorised by** | lựa chọn của người dùng 2026-10-04, kèm bản phác ba phương án |
| **The answer, out loud** | Mỗi đơn có một trang riêng để xem đơn đã đi tới đâu. |

---

## D10 — Chip kỹ năng trên thẻ việc làm công khai (người dùng chọn 2026-10-04)

Lỗi có sẵn: `JobCard`, `JobDetailHero`, `JobDetailSidebar` đọc `job.skills`, còn API trả `jobPostingSkills[].skill`, nên chip kỹ năng chưa bao giờ hiện.

| Option | Pros | Cons |
|---|---|---|
| A — Sửa trong lát 3, test đỏ trước | Lọc theo kỹ năng nhìn được kết quả bằng mắt | Thêm một task nhỏ, hai commit |
| B — Chỉ ghi nhận, làm sau | Lát 3 gọn hơn | Bộ lọc kỹ năng khó kiểm bằng mắt; lỗi còn mở |

**Chosen:** A.
**Mechanism:** `jobSkillsOf(job)` đọc `jobPostingSkills[].skill`; ba component đọc qua nó. Theo quy trình defect: test tái hiện commit trước, sửa commit sau.
**File:** `apps/web/src/lib/job-skills.ts`, `apps/web/src/components/public/jobs/JobCard.tsx`, `detail/JobDetailHero.tsx`, `detail/JobDetailSidebar.tsx`.

| | |
|---|---|
| **Authorised by** | lựa chọn của người dùng 2026-10-04 |
| **The answer, out loud** | Thẻ việc làm hiện đúng kỹ năng của tin, để ứng viên thấy thứ mình vừa lọc. |

---

## D11 — Câu báo lỗi 400 của API giữ dạng chung

| Option | Pros | Cons |
|---|---|---|
| A — Giữ `exceptionFactory` dùng chung | Câu báo lỗi nhất quán giữa các endpoint; UI vẫn kiểm trước và hiện câu cụ thể | API không trả nguyên câu cố định của DTO lịch phỏng vấn |
| B — Đổi câu báo lỗi cho mọi endpoint | API có thể giữ câu cụ thể của DTO | Thay đổi hợp đồng báo lỗi trên toàn API |

**Chosen:** A — người dùng chọn ngày 2026-10-12. Giữ câu báo lỗi 400 dạng chung; khép lại rủi ro 2 của lát 1.
**Mechanism:** giữ `ValidationPipe.exceptionFactory` dùng chung và bước kiểm dữ liệu lịch trong server action.
**File:** `apps/api/src/main.ts` (`exceptionFactory`), `apps/web/src/servers/interviews/interviews.action.ts` (`normalizeSchedulePayload`). Chỉ ghi quyết định, không sửa hai file này trong follow-up.

| | |
|---|---|
| **Authorised by** | lựa chọn của người dùng 2026-10-12, ghi trong brief follow-up |
| **The answer, out loud** | API giữ một dạng báo lỗi chung; recruiter vẫn nhận câu cụ thể khi nhập lịch qua UI. |

---

## D12 — Đổi giờ lịch onsite cũ chưa có địa điểm vẫn bắt nhập địa chỉ

| Option | Pros | Cons |
|---|---|---|
| A — Giữ bắt nhập địa chỉ | Ứng viên có địa chỉ để đến phỏng vấn | Recruiter phải bổ sung địa chỉ khi chỉ muốn đổi giờ lịch cũ |
| B — Cho phép bỏ trống khi chỉ đổi giờ | Đổi giờ lịch cũ nhanh hơn | Ứng viên vẫn không biết nơi phỏng vấn |

**Chosen:** A — người dùng chọn ngày 2026-10-12, vì ứng viên cần địa chỉ. Khép lại rủi ro 6 của lát 1; UI vẫn yêu cầu địa chỉ khi sửa lịch onsite cũ.
**Mechanism:** giữ form gửi hình thức cùng địa điểm và bước kiểm bắt buộc địa chỉ; API vẫn giữ cách xử lý cập nhật chỉ đổi giờ như hiện có.
**File:** `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx`, `apps/web/src/servers/interviews/interviews.action.ts` (`normalizeSchedulePayload`), `apps/api/src/app/interviews/interview-schedule.rules.ts` (`resolveInterviewPlace`). Chỉ ghi quyết định, không sửa các file này trong follow-up.

| | |
|---|---|
| **Authorised by** | lựa chọn của người dùng 2026-10-12, ghi trong brief follow-up |
| **The answer, out loud** | Khi sửa lịch phỏng vấn trực tiếp cũ, recruiter bổ sung địa chỉ để ứng viên biết phải đến đâu. |
