# GĐ4 — vận hành thật (operation)

Ghi lại hệ thống chạy end-to-end ra sao khi **chạy thật**, không phải mô tả. Ngày chạy: 12/11/2026, trên máy Windows của
chủ dự án, nhánh `feat/gd4-p3-analytics` (đã gồm M1 và M2).

## Môi trường đã chạy

- Postgres (pgvector), Redis, Mailpit, LiveKit `v1.13.10`: các service của `docker-compose.test.yml`, project
  `ats-gd4-test`.
- API: **chạy trên máy** bằng `node dist/apps/api/main.js` (sau `nx build api`), các biến môi trường giống service `api`
  của `docker-compose.test.yml` nhưng trỏ cổng host (55432, 56379, 51025, LiveKit `ws://localhost:57880`). Lý do: build
  image API trong Docker đứng ở bước `npm ci` hơn 20 phút, hai lần. CI build image này bình thường; trên máy local chưa
  build lại được trong phiên này.
- Web: `next dev` do Playwright khởi động (`apps/web/e2e/support/start-web.mjs`), cổng 3011 (3001 đang bị dự án khác dùng).
- Không có lời gọi AI thật: key AI của stack test là giá trị giả.

## Hành trình đã chạy (E2E, Playwright + Chromium)

| Journey | Vai trò | Kết quả | File |
|---|---|---|---|
| Hai người vào cùng phòng LiveKit thật, thiết bị giả, mỗi bên thấy tên người kia (C7) | recruiter (người tạo + người phỏng vấn), ứng viên | 2/2 pass | `apps/web/e2e/gd4-interview-room.e2e.ts` |
| Ứng viên không thuộc buổi phỏng vấn mở link phòng → trang "Không vào được phòng phỏng vấn", không có nút vào phòng (R2) | ứng viên khác | pass (cùng file) | như trên |
| **M4 (13/11):** ứng viên vào → màn "Đang chờ người phỏng vấn cho vào", không có bước kiểm tra thiết bị; recruiter đang trong phòng thấy "<tên> đang chờ từ HH:mm", API có đúng một thông báo "Ứng viên đang chờ"; bấm **Cho vào** → màn ứng viên tự sang kiểm tra thiết bị → hai bên thấy nhau (C24) | recruiter, ứng viên | 3/3 pass (cả file) | `apps/web/e2e/gd4-interview-room.e2e.ts` |
| **M4:** huỷ lịch cũ, tạo lịch online bắt đầu sau 5 phút qua API → job `room-open` chạy ngay qua Redis + processor thật → ứng viên và recruiter mỗi người đúng một thông báo "Phòng phỏng vấn đã mở", không có "Nhắc lịch phỏng vấn" (R29, R30) | recruiter, ứng viên | pass (cùng file) | như trên |
| Áp dụng "Mời phỏng vấn" trên Kanban → đơn sang `interview`, lịch sử ghi "Áp dụng gợi ý co-pilot: Mời phỏng vấn", `copilot_decisions` = accepted; gợi ý kế tiếp "Đặt lịch phỏng vấn" (C13) | recruiter | 2/2 pass | `apps/web/e2e/gd4-copilot.e2e.ts` |
| Bỏ qua gợi ý → ẩn, tải lại vẫn ẩn, đơn không đổi trạng thái | recruiter | pass (cùng file) | như trên |
| Dashboard: funnel 5/4/3/2/1 của một tin, KPI, 5 đơn mới nhất, không có khối chi phí AI (C19) | recruiter | 3/3 pass | `apps/web/e2e/gd4-dashboard.e2e.ts` |
| Khối chi phí AI của tổ chức: dòng "Chấm CV" $2.50 (1 triệu token × $2.5), cảnh báo model chưa có giá, tổng "Chưa có giá" | org_admin | pass (cùng file) | như trên |
| Admin nhập giá model còn thiếu ở trang Nhật ký AI → tổng của org_admin thành $2.50001 | admin, org_admin | pass (cùng file) | như trên |

## Đường lỗi đã thấy khi chạy thật

- **M4, giới hạn đăng nhập:** lần chạy đầu của file phòng phỏng vấn sau khi thêm M4, test R2 nhận `429` ở `/auth/login`
  (các test mới đăng nhập thêm 3 lần trong một phút). Lỗi của test, không phải của app: sửa bằng một lần đăng nhập API
  cho mỗi người trong `beforeAll`.

- **Lỗi thật tìm thấy:** lần chạy đầu của dashboard, trang sập vào màn lỗi vì server component lấy hằng `DASHBOARD_PERIODS`
  từ module `'use client'` (chỉ nhận được client reference). E2E đỏ được commit trước (`78ef629`), sửa ở `532f13f`.

- **Ngoài khung giờ:** lần chạy đầu của C7, fixture ghi giờ phỏng vấn lệch +7 giờ (lỗi của fixture, không phải của app:
  `node-postgres` gửi `Date` kèm múi giờ máy, cột `timestamp` không múi giờ bỏ phần đó). API trả đúng thông báo
  "Phòng phỏng vấn mở lúc 05:10 ngày 13/11/2026" và trang hiện màn "Không vào được phòng phỏng vấn". Fixture đã sửa
  (`5e8b9eb`).
- **Thiếu cấu hình LiveKit:** 503 "Phòng phỏng vấn trực tuyến chưa được cấu hình" — kiểm bằng unit test
  (`interview-room.service.spec.ts`), chưa chạy với API thật thiếu biến.
- **Giải thích AI của co-pilot:** cần key AI thật; trên stack test trả 503 "Chưa tạo được giải thích, hãy dùng các lý do
  bên dưới." — kiểm bằng unit test, **chưa** chạy với LLM thật.

## Chạy cả suite E2E (44 pass, 4 fail, 5 không chạy)

Một lần chạy toàn bộ `apps/web/e2e` trên đỉnh chuỗi: mọi test GĐ4 pass. 4 test đỏ không thuộc GĐ4 và đã tách nguyên nhân:
3 test `ai-configuration` kẹt ở bước đăng nhập admin khi chạy liền sau các suite khác, chạy riêng thì 4/4 pass; C17 của
`gd2-candidate-schedules` tự báo "Run the E2E with TZ=UTC" (máy chạy múi giờ +07:00). 5 test không chạy vì là test
serial phía sau test đỏ.

## Deploy prod (chưa làm — cần chủ dự án đồng ý, D2)

`docker-compose.yml` và `nginx/` **chưa sửa**. Khi deploy cần:

1. Thêm service `livekit` (image `livekit/livekit-server:v1.13.10`) với `LIVEKIT_CONFIG` dùng khoá thật (secret ≥ 32 ký
   tự), `rtc.use_external_ip: true` (hoặc `node_ip` là IP công khai của VPS), mở cổng TCP 7881 và UDP 7882 trên firewall.
2. Nginx: thêm một `server`/`location` reverse proxy WebSocket tới `livekit:7880` dưới TLS (ví dụ
   `wss://rtc.<domain>`), có header `Upgrade`/`Connection`.
3. API: đặt `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_PUBLIC_URL=wss://rtc.<domain>`.
4. Postgres prod phải là image có pgvector (đã nêu ở GĐ3) trước khi chạy migration của GĐ3 và GĐ4.
5. Chạy `prisma migrate deploy` (thêm `copilot_decisions`, `ai_usage_logs.organization_id` kèm điền ngược,
   `ai_model_prices`).
6. Admin nhập giá model ở trang Nhật ký AI để khối chi phí có số.
