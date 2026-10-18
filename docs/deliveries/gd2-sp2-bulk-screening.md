# GĐ2 SP2 — plan tóm tắt (13/10/2026)

Plan chi tiết: [../tasks/gd2-sp2-bulk-screening/plan.md](../tasks/gd2-sp2-bulk-screening/plan.md) · spec: [../tasks/gd2-sp2-bulk-screening/spec.md](../tasks/gd2-sp2-bulk-screening/spec.md).
13 task (Task 0–11 và Task 5b), theo thứ tự thực thi.

0. Chuẩn bị worktree: kiểm nhánh, cài package, sinh Prisma client, chạy test nền.
1. Kiểm chứng sớm các giả định về throttler, axios, Next (không cần test stack); có điểm sai thì dừng.
2. Gom điều kiện "đơn có chấm được không" vào một hàm dùng chung, kèm 8 mã lý do; nút chấm đơn lẻ giữ nguyên message.
3. Cho job sàng lọc tắt thông báo in-app, vẫn phát sự kiện socket.
4. Service chấm hàng loạt: theo danh sách hoặc tự chọn 50 đơn nộp sớm nhất, chuyển đơn "Mới" khi recruiter đồng ý.
5. Route chấm hàng loạt: kiểm body, trả 200, giới hạn 3 lần/phút cho mỗi người dùng.
5b. Bật test stack một lúc ngắn (có giữ khoá) để kiểm chấm hàng loạt trên database thật: chọn đúng đơn, thời gian 50 đơn, rate limit theo người dùng.
6. Hàm ghi CSV: BOM, CRLF, ngoặc kép, chặn công thức Excel.
7. Xuất CSV danh sách ứng viên của một tin: không có thông tin liên hệ, trần 5000 dòng.
8. Nhãn tiếng Việt cho mã lý do và hai server action (chấm hàng loạt, xuất CSV).
9. Ô chọn đơn dùng chung với SP1, thanh chấm hàng loạt và hộp thoại kết quả.
10. Nút xuất CSV, tự tải lại danh sách khi có kết quả chấm, nối vào trang danh sách ứng viên.
11. Trên test stack (có giữ khoá): kiểm file CSV thật, hành trình E2E, chạy toàn bộ kiểm chứng, ghi README kết quả.

# GĐ2 SP2 — as-built (15/10/2026)

Vào `dev` qua PR #69 (merge commit `178043b`, 27 commit, CI 2/2 xanh). Chi tiết và log: [../tasks/gd2-sp2-bulk-screening/results/README.md](../tasks/gd2-sp2-bulk-screening/results/README.md).

- **Đã có:** `POST /applications/job/:jobId/bulk-screening` (1–50 đơn hoặc tự chọn đơn đủ điều kiện, mã lý do bỏ qua, cờ `moveAppliedToScreening`, giới hạn 3 lần/phút theo `userId`); job bulk mang `notify: false`; `checkScreeningEligibility` dùng chung với `trigger-screening`; `GET /applications/job/:jobId/export` (CSV UTF-8 có BOM, chống formula injection, không email/SĐT, tối đa 5000 dòng); web: thanh chấm hàng loạt, hộp thoại kết quả, nút xuất CSV, tự tải lại khi có `cv-screening:completed`. Không migration.
- **Kiểm chứng trên nhánh:** jest API 67 suite / 615 test; `test:web` 348/348; lint, build, typecheck xanh; probe P1–P6 trên PostgreSQL thật (P3: 50 đơn trong 5531 ms); E2E bulk screening 1 passed.
- **Sau khi merge `dev` có SP1 (15/10):** giải 6 file xung đột giữ cả hai phía; jest API 74 suite / 679 test; `typecheck:web`, `lint:web`, `nx lint api` (0 lỗi), `nx build api` xanh; `test:web` (chạy tuần tự) 381/383, hai lỗi là timeout của `ScorecardForm.test.tsx` khi máy tải nặng, chạy riêng thì 6/6 xanh. Tách test 52 dòng thành 4 test (`147cb2e`) vì vượt trần 5 giây.
- **Lệch plan:** commit do phiên `-impl` (Codex không ghi được thư mục git của worktree); sửa setup test controller (`52b14ea`, assert giữ nguyên).
- **Chưa kiểm:** Gemini thật; CSV mở bằng Excel (A1); export 5000 dòng thật; tự tải lại với sự kiện socket thật; giao diện bằng mắt.
