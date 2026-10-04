# GĐ2 tuần 1 — luồng ứng viên

Spec: [spec.md](spec.md) · quyết định: [decision.md](decision.md) · survey: [survey.md](survey.md) ·
plan lát 1: [plan-slice1-schedules.md](plan-slice1-schedules.md) · plan lát 2:
[plan-slice2-timeline.md](plan-slice2-timeline.md) · plan lát 3: [plan-slice3-job-filter.md](plan-slice3-job-filter.md).
Cả ba lát đã code (xem các mục dưới).

## Lát 1 — Lịch phỏng vấn của ứng viên

**Trạng thái (2026-10-03):** đã code xong trên nhánh `feat/gd2-candidate-flows`, chưa push, chưa có PR.
Chưa áp migration vào DB dev. Đã chạy suite đơn vị, kiểm bằng trình duyệt và API smoke trên test stack.
Hành trình E2E bằng trình duyệt đã viết nhưng **chưa chạy** (xem *Chưa xác minh*).

Commits: `8ad300c` (test đỏ múi giờ) · `2d3e149` (sửa múi giờ) · `c7afda4` (cột `location`, R3) ·
`ee4501c` (payload tối thiểu cho ứng viên) · `459b6c2` (đơn đóng thì hủy lịch) · `57d6e8f` (form chọn
hình thức) · `4742d69` (sửa chú thích về ValidationPipe) · `ad5c523` (trang `/my-interviews`) ·
`5384c16` (hành trình E2E) · `701b2ed` (ghi kết quả) · sau review cuối: `6cba251` → `1908155` (form giữ dữ
liệu đã nhập khi submit bị từ chối) và `f6ef933` → `ce43509` (drawer của recruiter hiện đúng hình thức).

### Kết quả chạy

| Lệnh | Kết quả | Log |
|---|---|---|
| `npx nx test api --runInBand` | 60 suites, 490/490 pass | [results/slice1-api-test.log](results/slice1-api-test.log) |
| `npm run test:web` | 29 files, 196/196 pass (sau đợt sửa của review cuối) | [results/slice1-web-test.log](results/slice1-web-test.log) |
| `npm run typecheck:web` (gồm `e2e/**`) | exit 0 | [results/slice1-web-typecheck.log](results/slice1-web-typecheck.log) |
| `npm run lint:web` (`--max-warnings 0`) | exit 0 | [results/slice1-web-lint.log](results/slice1-web-lint.log) |
| `npx nx lint api` | exit 0 — 300 warning, bằng baseline trước lát này | [results/slice1-api-lint.log](results/slice1-api-lint.log) |
| `npx nx build api` | exit 0 | [results/slice1-api-build.log](results/slice1-api-build.log) |
| API smoke trên test stack (Nest + PostgreSQL `ats_test`) | 18/18 | [results/slice1-api-smoke.log](results/slice1-api-smoke.log) |
| Defect múi giờ: test đỏ rồi xanh | đỏ trước sửa, xanh sau sửa | [results/slice1-tz-red.txt](results/slice1-tz-red.txt), [results/slice1-tz-green.txt](results/slice1-tz-green.txt) |

### Tiêu chí → bằng chứng

| Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|
| C1 payload tối thiểu, staff giữ nguyên | `interviews.service.spec.ts` › *candidate payload*; API smoke (không có email/SĐT/`scheduler`, có tên người phỏng vấn làm đối chứng; staff vẫn có `scheduler`) | pass |
| C2 lịch của người khác → 403 | `interviews.service.spec.ts` › *refuses a candidate the schedule of another candidate* | pass |
| C3 / R3 thiếu địa điểm, link không phải http(s) → 400 | `dto/interview-schedule.dto.spec.ts`; service *interview type and location*; API smoke (400 thật) | pass — xem rủi ro 2 về câu báo lỗi |
| C4 form chọn hình thức | `MutateInterviewScheduleModal.test.tsx`; `interviews.action.test.ts` › *interview type* | pass |
| C5 trang `/my-interviews` | `MyInterviewsClient.test.tsx`; kiểm bằng trình duyệt trên test stack, ảnh [1280](media/slice1-my-interviews-1280.jpg) · [390](media/slice1-my-interviews-390.jpg) | pass |
| C6 guest/staff/candidate | `proxy.test.ts` › *candidate interview schedule page*; `PublicHeader.test.tsx`; trình duyệt: guest bị chuyển về `/sign-in?callbackUrl=%2Fmy-interviews` | pass |
| C15 hành trình thật (phần lịch) | `e2e/gd2-candidate-schedules.e2e.ts` | **chưa chạy** |
| C16 / R7 từ chối hoặc rút đơn → hủy lịch sắp tới | `applications.service.spec.ts` › *closing an application…*; API smoke (DB: cả hai `cancelled`) | pass |
| C17 giờ 09:00 VN lưu `02:00Z` | `interview-time.test.ts`, `interviews.action.test.ts` (server `TZ=UTC`), modal test; API smoke lưu đúng instant | unit pass; **E2E qua UI chưa chạy** |
| C18 / R9 đổi hình thức xóa trường cũ | service › *clears the meeting link / location when switching* | pass |
| C19 3 lịch sắp tới không bị 20 lịch cũ đẩy mất; `order=desc` | `page.test.tsx`; `group-schedules.test.ts`; service `order`; API smoke `order=desc` | pass |
| E1–E3, E8–E11 | `MyInterviewsClient.test.tsx`; trình duyệt (7 trường hợp seed) | pass |
| E7 ứng viên chưa có hồ sơ → 404 | service › *still answers 404…* | pass |
| E14 hoàn tác từ chối, lịch vẫn `cancelled` | `applications.service.spec.ts` › *does not reopen interviews when a rejection is reverted* | pass |
| E18 hết phiên quay lại `/my-interviews` | `proxy.test.ts` (callbackUrl) | pass |

### Chưa xác minh / rủi ro

1. **E2E bằng trình duyệt chưa chạy.** Máy chưa có trình duyệt Playwright, và việc tải (~122 MB) đã
   bị từ chối. Ba thứ chỉ được chứng minh từng phần: C17 qua UI (form → server `TZ=UTC` → DB), phần UI
   của C15/C16, và test A6 của GĐ1 sau khi thêm bước điền địa điểm. Cách chạy:
   `TZ=UTC npm run test:e2e:web -- --grep "GĐ2"` (cần biến `WEB_E2E_*`, xem
   `docs/tasks/test-defect-fixes/README.md`).
2. **Câu báo lỗi 400 của API không phải câu cố định của R3.** `exceptionFactory` dùng chung
   (`apps/api/src/main.ts:79-86`) dịch theo tên constraint và bỏ message riêng của DTO, nên API trả về
   `Dữ liệu không hợp lệ: location không được để trống`. Recruiter dùng UI vẫn thấy câu cố định, vì
   server action kiểm trước. Muốn đổi thì phải đổi câu báo lỗi của mọi endpoint, nên để người dùng quyết.
3. **DB dev (`ats-postgres`) chưa có cột `location`.** Migration
   `20261005000000_add_interview_schedule_location` chưa áp. Container `ats-api` dev vẫn chạy code cũ.
   Cần áp migration và build lại API trước khi dùng môi trường dev.
4. **Header từ 768 đến 1023px:** menu vẫn xuống dòng (lỗi có từ trước, do khối spacer rỗng chia đôi
   chiều rộng). Từ 1024px trở lên đã nằm trên 1 dòng.
5. **Chưa push, chưa có PR, chưa deploy.**
6. **Đổi giờ một lịch onsite cũ chưa có địa điểm qua UI thì phải nhập địa chỉ.** R3 ghi lịch cũ thiếu địa
   điểm "vẫn đổi giờ được" — đúng ở API, nhưng form luôn gửi hình thức kèm địa điểm nên đòi nhập. Giữ
   nguyên vì ứng viên cần địa chỉ; cần người dùng xác nhận.

### Review cuối (một reviewer mới, xem cả nhánh `98ee357..701b2ed`)

Kết luận: *With fixes*, không có lỗi Critical. Hai lỗi Important đã sửa, mỗi lỗi có test đỏ commit trước:
- Drawer chi tiết lịch của recruiter luôn ghi "Phỏng vấn trực tiếp" và không hiện link/địa chỉ.
- Submit bị từ chối (ví dụ trùng lịch) xóa trắng địa điểm, link và thời lượng vừa nhập — đã kiểm bằng test
  đỏ trước khi sửa.

Để lại (nhỏ, chưa sửa): web chấp nhận link không có TLD mà API từ chối (`https://meet/abc`); revert đơn về
`cancelled` không hủy lịch; test action chỉ chạy `TZ=UTC`; `?page=` không có giới hạn trên.

## Lát 2 — Timeline đơn ứng tuyển

**Trạng thái (2026-10-04):** đã code xong trên `feat/gd2-candidate-flows`, chưa push. Plan:
[plan-slice2-timeline.md](plan-slice2-timeline.md); vị trí hiển thị theo D9 (trang chi tiết).

Commits: `e8437af` (thiết kế + plan) · `20146a9` (API trả lịch sử tối thiểu cho ứng viên) · `07a3550`
(component timeline, sửa kiểu web) · `f4ade35` (trang `/my-applications/[id]`, link "Xem tiến trình") ·
`7bef728` (bước timeline trong hành trình E2E).

### Kết quả chạy

| Lệnh | Kết quả | Log |
|---|---|---|
| `npx nx test api --runInBand` | 61 suites, 503/503 pass | [results/slice2-api-test.log](results/slice2-api-test.log) |
| `npm run test:web` | 34 files, 223/223 pass (sau đợt sửa của review cuối) | [results/slice2-web-test.log](results/slice2-web-test.log) |
| `npm run typecheck:web` (gồm `e2e/**`) | exit 0 | [results/slice2-web-typecheck.log](results/slice2-web-typecheck.log) |
| `npm run lint:web` | exit 0 | [results/slice2-web-lint.log](results/slice2-web-lint.log) |
| `npx nx lint api` | exit 0, 300 warning (bằng baseline) | [results/slice2-api-lint.log](results/slice2-api-lint.log) |
| `npx nx build api` | exit 0 | [results/slice2-api-build.log](results/slice2-api-build.log) |
| API smoke trên test stack | 12/12 | [results/slice2-api-smoke.log](results/slice2-api-smoke.log) |

Suite web chạy trên working tree có sẵn các thay đổi chưa commit của một phiên khác (refactor header); những
thay đổi đó không nằm trong commit nào của lát này.

### Tiêu chí → bằng chứng

| Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|
| C7 / R1 lịch sử tối thiểu, staff giữ nguyên | `candidate-history.spec.ts`; `applications.service.spec.ts` › *application history for a candidate*; API smoke (đối chứng: staff vẫn thấy `notes`) | pass |
| C8 timeline theo thời gian, đánh dấu bước hiện tại, lý do | `build-timeline.test.ts`; `ApplicationTimeline.test.tsx`; `page.test.tsx` | pass |
| C9 kiểu web khớp API | typecheck (`IApplicationHistoryItem` mới); `applications.action.test.ts` | pass |
| C15 phần timeline | `e2e/gd2-candidate-schedules.e2e.ts` › *C8/C15* | **chưa chạy** (không có trình duyệt Playwright); phần API: smoke 12/12 |
| C20 hoàn tác thì không còn lý do | `candidate-history.spec.ts`; API smoke | pass |
| R2 đơn của người khác → 403 | service › *refuses a candidate another candidate's history*; API smoke | pass |
| E4 bước lùi | `build-timeline.test.ts`, `ApplicationTimeline.test.tsx` | pass |
| E5 đơn đã rút | `build-timeline.test.ts` | pass |
| E12 lý do trống | `candidate-history.spec.ts`, `ApplicationTimeline.test.tsx` | pass |
| E13 thiếu dòng "applied" | `build-timeline.test.ts` | pass |

### Chưa xác minh / rủi ro

1. **Chưa xem trang trên trình duyệt.** Một `next dev` khác (không phải của phiên này) đang giữ `apps/web` ở
   cổng 3000; bạn chọn bỏ qua thay vì tắt nó. Trang chỉ được chứng minh bằng component/page test.
2. **E2E bằng trình duyệt chưa chạy ở máy này** — job `web-e2e` của CI sẽ chạy khi có PR vào `dev`.
3. `GET /applications/my` của ứng viên không còn kèm `history` (hệ quả của D1). Web không dùng trường này.

### Review cuối lát 2 (reviewer mới, `5a20b0a..346b585`)

Kết luận *Yes*, không có Critical/Important. Một mục Minor được nâng lên và đã sửa, test đỏ commit trước
(`f1e6af2` → `b4a91bb`): trang chi tiết đưa nguyên đơn (gồm lý giải AI của bước sàng lọc, CV, dòng ứng viên)
vào HTML vì props của client component bị serialize; giờ chỉ đưa tên vị trí, khoa, trạng thái, ngày nộp và
lịch sử. Web 223/223 sau khi sửa.

Để lại (nhỏ): bước "Hiện tại" là dòng cuối sau khi sắp xếp, không đối chiếu `status` (chỉ sai khi hai dòng
trùng giờ — chưa có đường code nào tạo ra); đơn không tồn tại (404) hiện trang "thử lại" thay vì `notFound()`;
`IApplicationDto.history` mang kiểu của ứng viên trong khi staff nhận dòng đầy đủ; logic chờ mount lặp ở hai
component.

## Lát 3 — Lọc tìm việc

**Trạng thái (2026-10-04):** đã code xong trên `feat/gd2-candidate-flows`, chưa push. Plan:
[plan-slice3-job-filter.md](plan-slice3-job-filter.md). Lát 3 làm xong thì **cả ba lát của tuần 1 đã code**.

Commits: `29079f9` (thiết kế + plan) · `2fc0b32` (API lọc lương và kỹ năng) · `1c20d22` (endpoint
`filter-options`) · `2c3d355` (thăm dò trên DB thật) · `8bc464f` (action, kiểu dữ liệu, helper nhập lương) ·
`4d34b65` (panel bộ lọc) · `7219901` (trang chủ chọn hình thức) · `456319c` → `7b941b9` (chip kỹ năng trên
thẻ việc làm, test đỏ trước) · `a48b3a3` (hành trình E2E) · `150eb7d` (ghi kết quả) · sau review cuối: `8aec8bc` →
`187d511` (bộ lọc theo URL, báo lỗi khi panel đóng) và `3b9138b` (chặn chiều cao panel).

### Kết quả chạy

| Lệnh | Kết quả | Log |
|---|---|---|
| `npx nx test api --runInBand` | 62 suites, 533/533 pass | [results/slice3-api-test.log](results/slice3-api-test.log) |
| `npm run test:web` | 42 files, 298/298 pass (sau đợt sửa của review cuối) | [results/slice3-web-test.log](results/slice3-web-test.log) |
| `npm run typecheck:web` (gồm `e2e/**`) | exit 0 | [results/slice3-web-typecheck.log](results/slice3-web-typecheck.log) |
| `npm run lint:web` | exit 0 | [results/slice3-web-lint.log](results/slice3-web-lint.log) |
| `npx nx lint api` | exit 0, 300 warning (bằng baseline) | [results/slice3-api-lint.log](results/slice3-api-lint.log) |
| `npx nx build api` | exit 0 | [results/slice3-api-build.log](results/slice3-api-build.log) |
| Thăm dò trên PostgreSQL thật (test stack) | 29/29 | [results/slice3-api-smoke.log](results/slice3-api-smoke.log) |

Suite web chạy trên working tree có sẵn các thay đổi chưa commit của một phiên khác (refactor header); những
thay đổi đó không nằm trong commit nào của lát này.

### Tiêu chí → bằng chứng

| Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|
| C10 hình dạng `where`, 400 cho giá trị xấu | `job-posting-filters.spec.ts`; `job-posting.dto.spec.ts`; `job-postings.service.spec.ts` › *salary and skill filters*; thăm dò (400 thật) | pass |
| C11 bốn tin lương (một đầu, không lương), biên hai đầu, tin draft không hiện | thăm dò trên PostgreSQL thật (NULL-semantics không kiểm được bằng mock) | pass |
| C12 kỹ năng khớp bất kỳ; `filter-options` công khai, không trùng, theo tên, không bị `:id` nuốt | service/controller spec; thăm dò (200, không 404) | pass |
| C13 URL có `salaryMin`/`salaryMax`/`skillIds`, "Xóa bộ lọc" | `JobSearchClient.test.tsx`, `page.test.ts`, `job-filter-params.test.ts` | pass |
| C14 trang chủ chọn hình thức làm việc | `HomeHero.test.tsx` | pass |
| E6 không có kỹ năng → ẩn mục kỹ năng | service spec; `JobSearchClient.test.tsx` | pass |
| E15 `min = max`, nhập "15.000.000" | `salary-input.test.ts`; service spec; `JobSearchClient.test.tsx` | pass |
| E16 kỹ năng không tồn tại → 0 kết quả; hơn 20 → 400 | DTO spec; thăm dò | pass |
| E17 đổi bộ lọc ở trang > 1 → về trang 1; xóa cả ba tham số | `JobSearchClient.test.tsx` | pass |
| E19 staff mở trang công khai | giữ nguyên hành vi có sẵn, không đổi | ghi nhận |
| D10 chip kỹ năng trên thẻ việc làm | `JobCard`/`JobDetailHero`/`JobDetailSidebar` test (đỏ `456319c`, xanh `7b941b9`) | pass |
| Hành trình trình duyệt (C11–C14) | `e2e/gd2-job-filter.e2e.ts` | **chưa chạy** |

### Chưa xác minh / rủi ro

1. **Chưa xem trang trên trình duyệt.** Cổng 3000 và thư mục `apps/web` vẫn bị một `next dev` của phiên khác
   giữ (PID 240324, trỏ vào API dev); mình không tắt nó. Panel lọc chỉ được chứng minh bằng component test.
   Reviewer cuối nghi panel (nằm trong header `sticky`) có thể che gần hết màn hình 390px khi mở; mình đã
   thêm `max-h-[60vh]` có cuộn nhưng **chưa nhìn thấy** kết quả — cần xem bằng mắt trước khi merge.
2. **E2E bằng trình duyệt chưa chạy ở máy này** (không có trình duyệt Playwright). Phần API của cùng dữ liệu
   đã chạy trên DB thật (29/29). Hai điểm chỉ CI mới chứng minh: panel còn mở sau khi đổi URL, và không tràn ngang
   ở 390px khi panel đang mở.
3. **Đơn vị lương không thống nhất.** Form recruiter không ghi đơn vị (`placeholder` 2000/4000) còn phần hiển
   thị coi là VNĐ đầy đủ. Bộ lọc coi số đã lưu là VNĐ (D3); tin do recruiter nhập theo đơn vị khác sẽ không khớp.
4. **Tin công khai còn lộ danh sách ứng viên và liên hệ recruiter** (`jobPostingIncludeOptions`, đọc từ code, chưa
   chạy thử) — đã tạo task riêng; lát này cố ý không đụng phần `include`.
5. **Nhãn hình thức làm việc không thống nhất** ("On-site" ở trang chi tiết, "Tại văn phòng (Onsite)" ở thẻ,
   "Văn phòng" ở bộ lọc và trang chủ): có từ trước, không sửa.
6. **Chưa push, chưa có PR, chưa deploy.**

### Review cuối lát 3 (reviewer mới, `b53779b..150eb7d`)

Kết luận *With fixes*, không có Critical. Hai lỗi Important đã sửa, test đỏ commit trước (`8aec8bc` →
`187d511`):
- Next giữ state của trang khi chỉ query đổi (đã đọc trong `layout-router.js`), nên sau Back hoặc link "Tìm việc
  làm" ở header, chip và ô lương vẫn hiện bộ lọc của URL cũ và lần lọc kế tiếp áp lại chúng. Giờ các ô theo URL
  mới nhất.
- Lương sai lúc panel đang đóng thì bấm "Tìm" hay "Tiếp" không có phản hồi nào, vì câu lỗi nằm trong panel. Giờ
  panel tự mở để hiện lỗi.

Một mục nghi vấn đã giảm nhẹ nhưng chưa xác minh (panel quá cao trên điện thoại, xem rủi ro 1).

Để lại (nhỏ): regex UUID phía web lỏng hơn của API (một chuỗi dạng UUID giả vẫn làm trang văng — đã chạy thử
`isUUID`); gõ "15tr" thành ngưỡng 15 VND không báo gì; câu lỗi chưa gắn `aria-describedby`; `jobSkillsOf` không
có guard nếu `skill` biến mất khỏi payload (task sửa lỗ hổng tin công khai phải giữ `skill`); kỹ năng đã chọn
nhưng không còn trong danh sách vẫn tính vào giới hạn 20; script thăm dò chỉ commit log.
