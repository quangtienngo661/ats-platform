# Thiết kế lại giao diện — plan tóm tắt (13/11/2026)

Plan đầy đủ: `docs/superpowers/plans/2026-11-13-ui-redesign.md`. Spec: `docs/superpowers/specs/2026-11-13-ui-redesign-design.md`.
Nhánh: `feat/ui-redesign`.

## M0 · Nền móng
1. Chép nguyên UI hiện tại vào `src/legacy/` và đóng băng.
2. Chọn giao diện cũ/mới lúc chạy bằng cookie, có nút chuyển qua lại; đo bundle trước/sau.
3. Thêm token màu, font Geist, theme Tailwind; test contrast cho mọi cặp token.
4. Thêm preset motion (`LazyMotion`, stagger, reveal) và hai gói Radix.
5. Thêm primitives thao tác và form (Button, Field, Input, Switch…).
6. Thêm primitives hiển thị dữ liệu (StatusChip, ScoreBar, Table, EmptyState…) và bảng nhãn trạng thái.
7. Thêm primitives overlay và điều hướng (Dialog, Sheet, DropdownMenu, Tooltip, Tabs, Segmented).
8. Dựng khung staff/admin: sidebar thu về rail, top bar, menu tài khoản.
9. Thêm command palette Ctrl/Cmd+K cho staff.
10. Dựng khung public/ứng viên: header kính mờ, bottom bar mobile, footer.
11. Làm lại khung auth, khung phỏng vấn, loading/error và trang 404.

## M1 · Public và auth
12. Làm lại trang chủ.
13. Làm lại trang tìm việc (chip lọc, empty state).
14. Làm lại trang chi tiết việc (thẻ ứng tuyển dính, sheet chọn CV).
15. Làm lại các form đăng nhập, đăng ký, quên/đặt lại mật khẩu.

## M2 · Ứng viên
16. Làm lại "Đơn của tôi" và trang chi tiết đơn.
17. Làm lại "CV của tôi".
18. Làm lại lịch phỏng vấn và hồ sơ ứng viên.
19. Làm lại màn thiết lập phỏng vấn thử.
20. Làm lại phiên phỏng vấn thử và trang kết quả.

## M3 · Recruiter
21. Làm lại bảng điều khiển.
22. Làm lại danh sách và form tin tuyển dụng.
23. Làm lại danh sách ứng viên, thêm panel xem nhanh.
24. Làm lại trang chi tiết ứng viên.
25. Làm lại bảng so sánh ứng viên.
26. Làm lại Kanban, thêm menu "Chuyển sang vòng…".
27. Làm lại lịch phỏng vấn của staff và hồ sơ staff.

## M4 · Admin
28. Làm lại quản lý người dùng, nhà tuyển dụng, phòng ban.
29. Làm lại quản lý danh mục ngành nghề, kỹ năng, chủ đề phỏng vấn.
30. Làm lại cấu hình AI, nhật ký AI, hồ sơ công ty.

## M5 · Hoàn thiện
31. Thêm test chặn màu hex rời và font inline; xóa khung cũ không còn dùng.
32. Cập nhật e2e, thêm hành trình chuyển giao diện cũ/mới.
33. Kiểm bằng mắt ở 1440/1024/390, dữ liệu xấu nhất, reduced motion.
34. Cập nhật brain và ghi bản as-built.
