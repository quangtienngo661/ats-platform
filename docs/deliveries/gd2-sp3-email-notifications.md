# GĐ2 SP3 — plan tóm tắt (13/10/2026)

Plan chi tiết: [../tasks/gd2-sp3-email-notifications/plan.md](../tasks/gd2-sp3-email-notifications/plan.md) · spec: [../tasks/gd2-sp3-email-notifications/spec.md](../tasks/gd2-sp3-email-notifications/spec.md).
10 task (0–9), theo thứ tự thực thi.

0. Chuẩn bị worktree: cài package, generate Prisma client, chạy nền các test liên quan.
1. Kiểm chứng sớm các giả định (Prisma có `updateManyAndReturn`, Mailpit nhận AUTH và tìm được theo người nhận) trên container dùng một lần; sai thì dừng.
2. Thêm bảng `email_notifications` và hai enum bằng một migration, kèm probe trên PostgreSQL dùng một lần.
3. Cho `MailService` gửi một email bất kỳ và báo lại khi SMTP đang tắt.
4. Render 8 email từ một layout chung: câu chữ tiếng Việt, giờ Việt Nam, escape chữ do người nhập.
5. Service quyết định gửi gì cho ứng viên ở mỗi sự kiện: ghi row, đưa vào queue, tạo in-app cho sự kiện lịch, bỏ qua tài khoản bị khoá.
6. Processor đọc row, render, gửi và ghi trạng thái `sent`/`skipped`/`failed`, retry khi SMTP lỗi.
7. Nối vào luồng nộp đơn và đổi trạng thái đơn; từ chối thì liệt kê các lịch vừa bị huỷ.
8. Nối vào tạo, sửa và xoá lịch phỏng vấn.
9. Thêm Mailpit riêng vào test stack, chạy hành trình E2E đọc email thật cùng toàn bộ kiểm chứng, ghi kết quả vào README của task.

# GĐ2 SP3 — as-built (15/10/2026)

Vào `dev` qua PR #70 (merge commit `82001dc`, 21 commit, CI 2/2 xanh, lần đầu job E2E chạy với Mailpit). Chi tiết và log: [../tasks/gd2-sp3-email-notifications/README.md](../tasks/gd2-sp3-email-notifications/README.md).

- **Đã có:** 8 email cho ứng viên (nhận đơn; sang `interview`/`offer`/`hired`/`rejected`; lịch tạo/đổi/huỷ), từ chối kèm huỷ lịch gộp vào một email; bảng `email_notifications` (migration `20261015000000_add_email_notifications`); queue `notification-email` (job id = id của row); in-app cho sự kiện lịch; Mailpit riêng trong `docker-compose.test.yml`. Ứng viên `inactive` không nhận email (row `skipped`) — người dùng xác nhận 14/10.
- **Kiểm chứng trên nhánh:** jest API 68 suite / 630 test; `test:web` 324/324; lint, build, typecheck xanh; probe DB đỏ → xanh 11/11; probe Mailpit 7/7; E2E SP3 6/6, E2E toàn bộ 36/36 trên stack dựng mới.
- **Sau khi merge `dev` có SP1 + SP2 (15/10):** giải 4 file xung đột (`schema.prisma`, `removeSchedule`, `applications.service.ts`, `interviews.service.spec.ts`); `prisma validate` hợp lệ; jest API 80 suite / 764 test; `typecheck:web`, `lint:web` xanh; `test:web` 381/383, hai lỗi là timeout ở file SP3 không đổi (phần web của SP3 giống hệt `dev`). `nx lint api` / `nx build api` không chạy lại sau merge, để CI kiểm (CI xanh).
- **Lệch plan:** commit do phiên `-impl`; cờ docker `-e` viết `--env` trong prompt Codex; Codex một lần thử cách khác sau khi bị từ chối `rm -rf` (đã ghi lại, không gây hại).
- **Chưa kiểm:** Gmail SMTP production; retry với SMTP thật bị lỗi; thứ tự email 2 và 6 tới inbox; recruiter không được báo khi có scorecard vẫn là giả định ngoài phạm vi.
