# GĐ2 tuần 1 — luồng ứng viên

> **E2E bằng trình duyệt đã chạy (2026-10-04):** `TZ=UTC npm run test:e2e:web` trên test stack, Chrome Headless
> Shell 153 — **30/30 pass** ([results/e2e-full.log](results/e2e-full.log)), trong đó 13 test GĐ2
> ([results/e2e-gd2.log](results/e2e-gd2.log)) và A6 của GĐ1 sau khi sửa. Lần chạy đầu có 1 test fail do selector
> `getByRole('alert')` khớp cả vùng route announcer của Next (lỗi của test, đã sửa). Các mục "chưa chạy" bên dưới
> về E2E nay đã được chạy; phần "chưa xem giao diện bằng mắt" thì vẫn còn.

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
2. **Đã quyết định 2026-10-12 — [D11](decision.md#d11--câu-báo-lỗi-400-của-api-giữ-dạng-chung): giữ câu báo lỗi 400 của API dạng chung.** `exceptionFactory` dùng chung
   (`apps/api/src/main.ts:79-86`) dịch theo tên constraint và bỏ message riêng của DTO, nên API trả về
   `Dữ liệu không hợp lệ: location không được để trống`. Recruiter dùng UI vẫn thấy câu cố định, vì
   server action kiểm trước. Người dùng chọn giữ `exceptionFactory` hiện có.
3. **DB dev (`ats-postgres`) chưa có cột `location`.** Migration
   `20261005000000_add_interview_schedule_location` chưa áp. Container `ats-api` dev vẫn chạy code cũ.
   Cần áp migration và build lại API trước khi dùng môi trường dev.
4. **Header từ 768 đến 1023px:** menu vẫn xuống dòng (lỗi có từ trước, do khối spacer rỗng chia đôi
   chiều rộng). Từ 1024px trở lên đã nằm trên 1 dòng.
   Đã sửa trong follow-up 2026-10-12: bỏ spacer, giữ nhãn một dòng và thu gọn khoảng cách ở md; bằng chứng [đỏ](results/followup-task4-red.txt), [xanh](results/followup-task4-green.txt).
5. **Chưa push, chưa có PR, chưa deploy.**
6. **Đã quyết định 2026-10-12 — [D12](decision.md#d12--đổi-giờ-lịch-onsite-cũ-chưa-có-địa-điểm-vẫn-bắt-nhập-địa-chỉ): đổi giờ lịch onsite cũ qua UI vẫn phải nhập địa chỉ.** R3 ghi lịch cũ thiếu địa
   điểm "vẫn đổi giờ được" — đúng ở API, nhưng form luôn gửi hình thức kèm địa điểm nên đòi nhập. Giữ
   nguyên vì ứng viên cần địa chỉ; người dùng đã chọn giữ yêu cầu này.

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
   Đã sửa trong follow-up 2026-10-12: nhãn/placeholder/hướng dẫn nhập VNĐ đầy đủ, `min=0`, `step=500000`; [log test](results/followup-salary-labels.log). Không sửa dữ liệu cũ.
4. **Tin công khai còn lộ danh sách ứng viên và liên hệ recruiter** (`jobPostingIncludeOptions`, đọc từ code, chưa
   chạy thử) — đã tạo task riêng; lát này cố ý không đụng phần `include`.
   Đã sửa trong follow-up 2026-10-12: include theo viewer, staff giữ nguyên, candidate chỉ thấy trạng thái đơn của mình và `candidate.userId`, guest nhận `applications: []`, không có recruiter; bằng chứng [đỏ](results/followup-task1-red.txt), [xanh](results/followup-task1-green.txt).
5. **Nhãn hình thức làm việc không thống nhất** ("On-site" ở trang chi tiết, "Tại văn phòng (Onsite)" ở thẻ,
   "Văn phòng" ở bộ lọc và trang chủ): có từ trước, không sửa.
   Đã sửa trong follow-up 2026-10-12: chín component dùng `WORK_TYPE_LABELS` (Remote / Văn phòng / Hybrid), giữ fallback cũ; đây là thay đổi hợp đồng nhãn hiển thị, [log test](results/followup-salary-labels.log).
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

## Việc tiếp sau tuần 1 (2026-10-12)

Đã thực hiện bốn sửa đổi ngày 12/10 và commit ngày 13/10 (test đỏ trước, sửa sau): `6e1883d` → `64e933c` (include theo viewer) · `b27e921` → `bafcfd7` (header) · `cec76c8` → `260387e` (nhãn lương) · `fd5a14e` (nhãn hình thức làm việc, một commit vì là đổi hợp đồng nhãn hiển thị; chưa kiểm test nào trong đó đỏ trên HEAD cũ). Chưa push, chưa có PR:

- Tin công khai dùng include theo viewer: không có recruiter; candidate chỉ nhận `{ status, candidate: { userId } }` của chính mình, không có `cvId`; guest không nhận đơn nào. Staff giữ nguyên include; category, department, `jobPostingSkills[].skill` và bước sanitize vẫn còn.
- Form recruiter ghi rõ VNĐ đầy đủ: ví dụ 15000000/25000000, `min=0` và hướng dẫn dưới hai ô lương. Không sửa dữ liệu cũ.
  Follow-up sửa defect `step=500000` (brief ban đầu sai): native validation chặn 15200000 VNĐ; đã bỏ `step` ở cả hai ô, giữ `min=0`, nhãn/placeholder/hướng dẫn và kiểm `checkValidity()` bằng test [đỏ](results/followup-salary-step-red.txt) → [xanh](results/followup-salary-step-green.txt).
- Chín component dùng `WORK_TYPE_LABELS`: Remote / Văn phòng / Hybrid, giữ fallback cũ. Đây là thay đổi hợp đồng nhãn hiển thị. Không tìm thấy assertion cũ với "On-site", "Onsite", "Tại văn phòng" trong `*.test.tsx`; đã thêm coverage cho nhãn, fallback và giá trị option.
- Public header bỏ spacer rỗng, dùng `whitespace-nowrap` ở mọi độ rộng và giữ `min-w-0`. Follow-up sửa clipping thu gọn container thành `px-4 lg:px-6`, nav `gap-0.5 lg:gap-1`, link `px-1.5 lg:px-3`; bỏ `overflow-hidden` để không che link.

[D11](decision.md#d11--câu-báo-lỗi-400-của-api-giữ-dạng-chung) và [D12](decision.md#d12--đổi-giờ-lịch-onsite-cũ-chưa-có-địa-điểm-vẫn-bắt-nhập-địa-chỉ) ghi hai lựa chọn của người dùng ngày 2026-10-12.

Reviewer đã xác minh các điểm sau; không chạy lại probe, migration hoặc container trong follow-up sửa clipping:

- Public payload probe trên PostgreSQL test stack: **14/14 pass**, [followup-leak-probe.log](results/followup-leak-probe.log). Anonymous không có recruiter, `applications: []`; candidate chỉ nhận đơn của mình, không có `cvId`; đối chứng recruiter vẫn thấy cả hai đơn và object recruiter.
- DB dev đã áp migration `20261005000000_add_interview_schedule_location` ngày 2026-10-12; cột `location` hiện có. Container dev `ats-api` không khởi động được vì cổng host 6379 đang do Redis container `distributedcache` của project khác giữ; đã để nguyên.
- Header bản sửa đầu bị clip link "Phỏng vấn AI" ở viewport 768px (753px sử dụng được do scrollbar): reviewer đo nav rộng 482px, cạnh phải x=613, content rộng 503px và link cuối kết thúc ở x=633. Sau khi sửa spacing và bỏ clipping, reviewer đã đo lại bằng trình duyệt thật: tại 768px, nav content 513px = nav width 513px, link cuối kết thúc x=597 trước cạnh nav x=636, mọi link cao 32px; tại 1024px, không overflow và tất cả link trên một dòng.

| Lệnh | Kết quả cuối | Log |
|---|---|---|
| `npx nx test api --runInBand --silent` | 62 suites, 545 pass / 0 fail, exit 0 | [followup-api-test.log](results/followup-api-test.log) |
| `npm run test:web` | 44 files, **324 pass** / 0 fail, exit 0 — chạy lại 2026-10-13 trên working tree có cả thay đổi chưa commit của phiên khác. Số 322 ghi trước đó không có log chống lưng: file log cùng tên của lần chạy 12/10 là một lần bị crash worker (9 file, 53 test, 35 lỗi) và đã được thay bằng lần chạy này theo yêu cầu của chủ dự án | [followup-web-test.log](results/followup-web-test.log) |
| `npm run typecheck:web` | **exit 0** (2026-10-13), sau khi sinh lại file `.next/dev/types/routes.d.ts` bị cắt hỏng bằng `next typegen` rồi chép đè (file gitignored, đã sao lưu bản hỏng). Trước đó exit 2 ở cả hai lần: 3 lỗi cú pháp trong chính file đó, dòng 107/110 — tsc dừng ở lỗi cú pháp nên các lần đó không nói gì về kiểu của mã nguồn | xanh: [followup-web-typecheck-green.log](results/followup-web-typecheck-green.log) · đỏ trước đó: [followup-web-typecheck.log](results/followup-web-typecheck.log) |
| `TZ=UTC npm run test:e2e:web` | **30/30 pass**, exit 0, không retry/skip (2026-10-13, 3,6 phút), trong đó 13 test GĐ2 và test panel lọc không tràn ngang ở màn hình điện thoại. Test stack `docker-compose.test.yml` build lại từ working tree (có cả thay đổi chưa commit của phiên khác); web do Playwright dựng từ cùng working tree | [followup-e2e.log](results/followup-e2e.log) |
| `npm run lint:web` | 0 error / 0 warning, exit 0 | [followup-web-lint.log](results/followup-web-lint.log) |
| `npx nx lint api` | 0 error / 300 warning, không vượt giới hạn 300, exit 0 | [followup-api-lint.log](results/followup-api-lint.log) |
| `npx nx build api` | API và 2 dependency target pass, exit 0 | [followup-api-build.log](results/followup-api-build.log) |

Test tái hiện được viết và chạy đỏ, lưu log **trước** khi sửa production code; test và fix nằm trong file riêng:

| Lệnh | Đỏ → xanh | Log |
|---|---|---|
| `npx nx test api --runInBand --silent --testPathPatterns="job-postings"` | 6 fail / 89 pass → 95 pass / 0 fail, 7 suites | [task1-red](results/followup-task1-red.txt), [task1-green](results/followup-task1-green.txt) |
| `npm run test:web -- src/components/public/layout/PublicHeader.test.tsx` | 2 fail / 2 pass → 4 pass / 0 fail, 1 file | [task4-red](results/followup-task4-red.txt), [task4-green](results/followup-task4-green.txt) |
| `npm run test:web -- src/components/public/layout/PublicHeader.test.tsx` (follow-up sửa clipping) | 2 fail / 3 pass → 5 pass / 0 fail, 1 file | [task4-clipping-red](results/followup-task4-clipping-red.txt), [task4-clipping-green](results/followup-task4-clipping-green.txt) |
| `npm run test:web -- src/components/job-postings/ui/JobPostingStep2.test.tsx` (follow-up sửa step) | 2 fail / 1 pass → 3 pass / 0 fail, 1 file | [salary-step-red](results/followup-salary-step-red.txt), [salary-step-green](results/followup-salary-step-green.txt) |
| `npm run test:web -- src/components/job-postings/ui/JobPostingStep1.test.tsx src/components/job-postings/ui/JobPostingStep2.test.tsx src/components/public/jobs/JobCard.test.tsx src/components/public/jobs/detail/JobDetailHero.test.tsx src/components/public/jobs/detail/JobDetailSidebar.test.tsx src/components/my-applications/ui/ApplicationCard.test.tsx` | 6 files, 33 pass / 0 fail ở lần chạy chọn file; suite cuối ở trên có thêm 2 test fallback | [followup-salary-labels.log](results/followup-salary-labels.log) |

Lần chạy Nx đầu không khởi động được test do `Access is denied` ở lock của project graph ([chẩn đoán](results/followup-task1-nx-diagnostic.log)). Đã chạy `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="job-postings"` trực tiếp: 6 fail / 89 pass (trong task1-red), rồi chạy được lệnh Nx yêu cầu với `NX_WORKSPACE_DATA_DIRECTORY` và `NX_CACHE_DIRECTORY` trỏ tới thư mục tạm riêng `ats-platform-followup-20261012`; `NX_DAEMON=false`, `NX_ISOLATE_PLUGINS=false`, `NX_SKIP_NX_CACHE=true`, `NX_TASKS_RUNNER_DYNAMIC_OUTPUT=false`. Mọi lệnh Nx thành công ở trên dùng cấu hình môi trường đó, không sửa cấu hình repo. Web lint lần đầu fail do 1 warning non-null assertion trong test mới ([log đầu](results/followup-web-lint-initial.log)); đã sửa và chạy xanh.

Đã đối chiếu SHA-256/trạng thái tồn tại: cả 57 đường dẫn dirty có từ đầu phiên vẫn nguyên vẹn; chỉ thay đổi file được brief cho phép ([kiểm working tree](results/followup-worktree-check.log)). Không thêm dependency, không sửa schema/migration, không commit/push/merge/stash/reset/checkout.

Follow-up sửa clipping kiểm class contract trong jsdom; reviewer sau đó đã đo kết quả bằng trình duyệt thật tại 768px (nav content 513px = nav width 513px, link cuối x=597 trước cạnh nav x=636, mọi link cao 32px) và 1024px (không overflow, tất cả link trên một dòng). Không chạy lại phép đo hoặc E2E trong follow-up sửa step. Bốn lệnh web của follow-up sửa clipping được ghi ở các log test/typecheck/lint và task4-clipping-green; kết quả API trong bảng là lần chạy trước.

Typecheck của follow-up sửa clipping bị chặn bởi file Next dev sinh ra `.next/dev/types/routes.d.ts`: sau khai báo đóng còn đoạn thừa `HandlerRoute extends AppRouteHandlerRoutes>`, gây TS1434/TS1128. Đã đọc để kiểm và chạy lại lệnh, không sửa file sinh ra hay tác động phiên dev vì ngoài phạm vi file được phép sửa. Test header 5/5, suite web 322/322 và lint 0 error / 0 warning đều pass; chưa có kết quả typecheck xanh cho follow-up sửa clipping. *Cập nhật 2026-10-13: đã xanh, xem bảng.*

Follow-up sửa step không chạy typecheck và không tác động `.next/`; reviewer sẽ chạy typecheck sau khi dừng dev server đang viết lại types. *Cập nhật 2026-10-13: lúc đó không còn tiến trình Next nào chạy; typecheck đã chạy xanh sau khi sinh lại types, xem bảng.*

**Quan sát khi chạy lại E2E ngày 2026-10-13 (chưa sửa, ngoài phạm vi follow-up):** web server in một cảnh báo `Hydration failed` ở `CvCard` (`apps/web/src/components/my-cvs/ui/CvCard.tsx:63`, trang `/my-cvs`): giờ tạo CV render ở server (`TZ=UTC`) là `09:52 13/10/2026`, ở trình duyệt (múi giờ VN) là `16:52 13/10/2026`. Test vẫn pass. Cảnh báo cũng có đúng 1 lần trong [e2e-full.log](results/e2e-full.log) ngày 04/10, nên có từ trước. Cùng họ với defect múi giờ đã sửa ở lát 1. `apps/web/next-env.d.ts` và `apps/web/tsconfig.tsbuildinfo` (đã dirty sẵn, không thuộc follow-up) bị `next typegen` ghi lại lúc 16:44 ngày 13/10 và không được commit.
