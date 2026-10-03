# GĐ2 tuần 1 — luồng ứng viên

Spec: [spec.md](spec.md) · quyết định: [decision.md](decision.md) · survey: [survey.md](survey.md) ·
plan lát 1: [plan-slice1-schedules.md](plan-slice1-schedules.md). Lát 2 (timeline) và lát 3 (lọc việc
làm) chưa bắt đầu.

## Lát 1 — Lịch phỏng vấn của ứng viên

**Trạng thái (2026-10-03):** đã code xong trên nhánh `feat/gd2-candidate-flows`, chưa push, chưa có PR.
Chưa áp migration vào DB dev. Đã chạy suite đơn vị, kiểm bằng trình duyệt và API smoke trên test stack.
Hành trình E2E bằng trình duyệt đã viết nhưng **chưa chạy** (xem *Chưa xác minh*).

Commits: `8ad300c` (test đỏ múi giờ) · `2d3e149` (sửa múi giờ) · `c7afda4` (cột `location`, R3) ·
`ee4501c` (payload tối thiểu cho ứng viên) · `459b6c2` (đơn đóng thì hủy lịch) · `57d6e8f` (form chọn
hình thức) · `4742d69` (sửa chú thích về ValidationPipe) · `ad5c523` (trang `/my-interviews`) ·
`5384c16` (hành trình E2E).

### Kết quả chạy

| Lệnh | Kết quả | Log |
|---|---|---|
| `npx nx test api --runInBand` | 60 suites, 490/490 pass | [results/slice1-api-test.log](results/slice1-api-test.log) |
| `npm run test:web` | 28 files, 190/190 pass | [results/slice1-web-test.log](results/slice1-web-test.log) |
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
| E14 hoàn tác từ chối, lịch vẫn `cancelled` | không có code khôi phục lịch, nên đúng theo cấu trúc; **không có test riêng** | chưa có test |
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
