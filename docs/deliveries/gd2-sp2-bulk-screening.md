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
