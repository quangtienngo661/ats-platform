# Kết quả tuần cuối GĐ1: portal quản trị tổ chức

Kiểm chứng ngày **2026-09-30** trên nhánh `feat/org-admin-enforcement`, HEAD `8ec4751` cùng thay đổi chưa commit. Phạm vi và tiêu chí A1–A10 nằm trong [spec.md](spec.md). Chưa có bằng chứng merge PR hoặc triển khai production.

## Đã làm

- Portal staff nhận `org_admin`, điều hướng và menu theo vai trò; các trang người dùng, taxonomy chỉ dành cho platform admin. Người chưa đăng nhập bị chuyển khỏi trang nội bộ.
- Platform admin tạo/sửa `org_admin` với Organization bắt buộc. Nhãn tổ chức xuất hiện ở các danh sách quản lý, còn quản trị tổ chức chỉ đọc được dữ liệu của mình.
- Quản trị tổ chức tạo tài khoản recruiter và hồ sơ trong một transaction theo department của tổ chức; tạo job bằng cách chọn recruiter owner hợp lệ, xem hồ sơ cá nhân và đặt lịch phỏng vấn mà không cần Recruiter profile riêng.
- API chặn gán User toàn cục, owner giả mạo, department khác tổ chức, truy cập UUID của tổ chức khác. Khi quyền/tổ chức/trạng thái/mật khẩu thay đổi, refresh token bị thu hồi và socket đang kết nối bị ngắt sau transaction thành công. Access token còn hạn được API đọc lại quyền hiện hành từ database.
- Cập nhật SRS, UC, ERD, architecture và roadmap với ranh giới dữ liệu Candidate/CV dùng chung, dữ liệu tuyển dụng theo Organization; phần mô tả mục tiêu được phân biệt với hiện trạng.

## Bằng chứng kiểm chứng

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| BE unit | **445/445**, 57 suites; thêm kiểm tra regression và mutation về owner/socket | [be-green.log](results/be-green.log), [be-test-review.md](results/be-test-review.md) |
| FE unit/component | **81/81**, 12 files; mutation về organization binding bị bắt | [fe-green.txt](results/fe-green.txt), [fe-test-coverage.md](results/fe-test-coverage.md) |
| Browser E2E | **13/13** Chromium qua Next production container → API → PostgreSQL; 8 ca mới cho hai tổ chức | [e2e-full.log](results/e2e-full.log), [gd1-org-admin.e2e.ts](../../../apps/web/e2e/gd1-org-admin.e2e.ts) |
| API + Socket live | Sau khi socket rời user room, đổi tổ chức vẫn ngắt socket; refresh cũ trả 401, access cũ chỉ thấy tổ chức mới; fixture được dọn | [live-revocation.log](results/live-revocation.log), [probe](../../../apps/web/e2e/support/gd1-live-revocation.mjs) |
| Build/type/lint | Docker API/web build thành công; API và web typecheck thành công; lint 0 lỗi, 134 warnings | [docker-api-build.log](results/docker-api-build.log), [docker-web-build2.log](results/docker-web-build2.log), [lint.log](results/lint.log) |

Các lần E2E RED trước khi sửa được lưu ở `results/e2e-runtime-first.log` và `results/e2e-runtime-second.log`; kết quả cuối là `results/e2e-full.log`. Test fixture chỉ dùng database `ats_test`, không tải CV thật và không gọi AI bên ngoài.

## Xem thử trên máy hiện tại

- Web dev: `http://localhost:3000/sign-in/admin` — dùng để xem và phát triển.
- Web production build: `http://localhost:3001/sign-in/admin` — image `ats-platform-gd1-web`, container `ats-platform-gd1-web-preview`.
- API test: `http://localhost:55000/api`; health: `http://localhost:55000/api/health` (database và Redis đều `up` lúc kiểm tra).
- Tài khoản platform admin của **test stack**: `admin@ats.local` / `Admin@123`. Có thể tạo `org_admin` và chọn Organization từ giao diện Quản lý người dùng. Không dùng tài khoản này ngoài môi trường local test.

## Việc còn mở

- Đây là working tree chưa commit; PR, merge và production deployment **chưa xác minh**.
- Socket disconnect đang áp dụng cho **một tiến trình API**; nếu triển khai nhiều API replica, cần adapter/phát sự kiện thu hồi phiên giữa các replica.
- E2E kiểm tra luồng thủ công, không xác minh Google Gemini, gửi mail thật, hoặc thống kê dashboard toàn bộ dữ liệu. Dashboard hiện lấy mẫu giới hạn như ghi trong [spec.md](spec.md).
- Lint còn 134 cảnh báo; lệnh kết thúc thành công vì không có lỗi. Ưu tiên xử lý cảnh báo liên quan code mới khi mở PR.

## Điểm đọc tiếp

1. [spec.md](spec.md): quyết định, ranh giới và A1–A10.
2. [docs/current-state.md](../../current-state.md): hiện trạng nguồn mã; [docs/migration-roadmap.md](../../migration-roadmap.md): phần mục tiêu.
3. [architecture/system.md](../../architecture/system.md) và [architecture/database.md](../../architecture/database.md): luồng và quan hệ dữ liệu.
