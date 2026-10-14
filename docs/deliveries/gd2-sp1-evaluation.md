# GĐ2 SP1 — plan tóm tắt (13/10/2026)

Plan chi tiết: [../tasks/gd2-week2-evaluation/plan.md](../tasks/gd2-week2-evaluation/plan.md) · spec: [../tasks/gd2-week2-evaluation/spec.md](../tasks/gd2-week2-evaluation/spec.md).
13 task (Task 0 + 12), theo thứ tự thực thi.

0. Chuẩn bị worktree: `npm ci`, sinh Prisma client và chạy test nền để biết trạng thái xuất phát.
1. Chỉnh spec cho khớp khuôn truy cập hiện có: tổ chức khác trả 404, quyền đọc theo quyền xem đơn (có ranh giới khoa).
2. Thêm hai bảng (scorecard, ghi chú) bằng một migration, kèm `CHECK` điểm 1–5, và probe trên PostgreSQL thật.
3. Thêm helper "tổ chức khác thì 404" và mở hai hàm kiểm quyền có sẵn cho module mới dùng.
4. API scorecard: interviewer của lịch nộp khi lịch đã hoàn tất, sửa được đến khi đơn chốt.
5. Chặn xoá lịch phỏng vấn đã có scorecard (trả 409 thay vì mất đánh giá).
6. API ghi chú: staff có quyền xem đơn thì tạo/đọc, chỉ tác giả sửa hoặc xoá.
7. API so sánh 2–4 ứng viên của một tin: chỉ đọc, không xếp hạng.
8. Test chốt rằng ứng viên không bao giờ nhận scorecard hay ghi chú.
9. Kiểu dữ liệu và server actions cho web.
10. Tab "Đánh giá phỏng vấn" và "Ghi chú" trên trang chi tiết ứng viên, kèm form scorecard.
11. Liên kết "Nộp đánh giá" ở drawer lịch, chọn 2–4 ứng viên ở danh sách và trang so sánh.
12. Hành trình E2E đầu-cuối và chạy toàn bộ kiểm chứng, ghi kết quả vào README của task.
