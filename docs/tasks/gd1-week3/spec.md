# GĐ1 tuần cuối — hoàn tất portal multi-tenant

Ngày triển khai: 2026-09-29. Nhánh: `feat/org-admin-enforcement`, baseline `8ec4751`.
Người dùng đã duyệt phân tích sáu gói công việc bằng “OK triển khai đi bạn”. Đây là thực hiện tuần cuối GĐ1 (21–27/09), chưa thực hiện tính năng GĐ2/RAG/LiveKit. Không commit/push.

## Quyết định và phạm vi

- Giữ Candidate/CV và taxonomy ở pool dùng chung; dữ liệu tuyển dụng thuộc Organization.
- Platform admin quản lý User toàn cục và tạo org_admin có đúng một tổ chức. Không mở GET /users cho org_admin.
- Org admin quản lý department, recruiter, AI config và tuyển dụng trong tổ chức, không cần Recruiter profile.
- Thêm POST /recruiters/accounts: tạo User(role recruiter) + Recruiter trong một transaction, tổ chức suy từ department. POST /recruiters gán User có sẵn chỉ cho platform admin, User đích phải role recruiter và chưa có Recruiter. Không đổi chủ hồ sơ bằng PATCH; tạo hồ sơ riêng cho tài khoản mới. Không chuyển department khi có tin tuyển dụng phụ thuộc.
- Job create nhận TenantCaller; admin/org_admin chọn `createdBy` là recruiter trong phạm vi. Recruiter thường chỉ tạo cho chính mình. Suy department/org từ owner; department gửi khác owner bị từ chối.
- Mỗi join socket đọc quyền từ DB; đổi role/org/status, xóa User hoặc đổi/xóa Recruiter thu hồi session/socket sau ghi thành công. Socket đã rời user-room vẫn phải bị ngắt.
- Edit User giữ khóa role của UI hiện có; org_admin được chỉnh organization. Không mở rộng chuyển role tự do trong UI.

## Acceptance criteria và coverage

| ID | When… then… | Mức / nơi kiểm tra |
|---|---|---|
| A1 | Khi đăng nhập org_admin bằng portal staff, thì cookie được thiết lập và chuyển /department-management. Sai portal bị từ chối. | unit auth.action.test.ts; e2e gd1-org-admin.e2e.ts |
| A2 | Khi org_admin truy cập department/recruiter/AI/dashboard/job/interview/my-profile, thì được vào; user-management/taxonomy admin chỉ platform admin; guest bị chặn cả recruiter-management/my-profile. Refresh giữ cùng policy. | unit proxy.test.ts; e2e |
| A3 | Khi admin tạo/sửa org_admin, thì form yêu cầu Organization và payload gửi organizationId; vai trò khác không gửi binding. | component Add/EditUserModal.test.tsx; unit users.action.test.ts; e2e |
| A4 | Khi org_admin tạo recruiter, thì User + profile cùng tổ chức department, password được hash, email trùng hoặc department ngoài phạm vi không để lại bản ghi. Gán User global có sẵn bị chặn; admin không gán candidate/admin/org_admin. | unit recruiters service/controller; e2e |
| A5 | Khi org_admin không có Recruiter tạo job, thì chọn owner hợp lệ trong org; owner ngoài org, department sai, recruiter mạo nhận owner bị từ chối. | unit job service; component/action; e2e |
| A6 | Khi org_admin không có Recruiter mở interview/profile, thì xem danh sách interviewer của org và hồ sơ User/Organization; không hiển thị lỗi thiếu Recruiter. | e2e |
| A7 | Khi platform admin xem Department/AI/User, thì thấy tên tổ chức tương ứng; org_admin chỉ thấy phạm vi của mình. Set default AI ở A không thay default B. | component/action; e2e + API/DB probe |
| A8 | Khi User thay role/org/status hoặc bị xóa, hay Recruiter đổi department/bị xóa, thì refresh token cũ bị thu hồi và socket cũ bị ngắt; cập nhật tên không ngắt; ghi thất bại không báo thành công. Join sau đổi quyền kiểm tra quyền mới, pending handshake không tạo quyền cũ. | unit users/recruiters/socket; live API/socket probe |
| A9 | Khi A đoán UUID của department/recruiter/job/application/interview/AI ở B, thì HTTP/socket không trả dữ liệu B; platform admin vẫn quản lý hai tổ chức. | e2e + live API/socket probe |
| A10 | Khi đóng gói xong, thì toàn bộ BE unit, FE unit/component, real-browser E2E, type checks và Docker build chạy; SRS/UC/ERD/architecture/tracking phản ánh kết quả thực, PR/deploy chưa xác minh nếu thiếu bằng chứng. | results/ + docs review |

## Bằng chứng khảo sát

- `apps/web/src/proxy.ts`, `StaffLoginForm.tsx`, `auth.action.ts`: thiếu org_admin/đường dẫn staff.
- `apps/web/src/app/(admin)/recruiter-management/page.tsx`: gọi GET /users platform-only.
- `apps/api/src/app/recruiters/recruiters.service.ts`: chỉ xác minh User tồn tại, chưa kiểm tra role khi gán.
- `apps/api/src/app/job-postings/job-postings.service.ts`: create tìm Recruiter của caller, bỏ qua createdBy.
- `apps/web/src/app/(recruiter)/interviews/page.tsx`, `my-profile/page.tsx`: giả định mọi staff có Recruiter.
- `apps/api/src/common/socket-io/socket-io.service.ts`: cached caller, chưa thu hồi socket sau mutation.
- Baseline tests trước lượt này: 391 BE, 19 FE, 5 E2E; chưa có hành trình org_admin. Git có các sửa lỗi của đợt audit trước, được giữ nguyên.

## Trình tự thực hiện

1. Test-author BE/FE viết boundary tests, lưu RED đúng hành vi; main triển khai production sau RED của phần tương ứng.
2. Nối FE role policy, account forms, scoped recruiter creation, owner selection, interview/profile, organization labels.
3. Verify unit/component và Docker test stack riêng; thêm fixtures hai org và chạy Chromium qua API thật.
4. Sửa lỗi kiểm chứng phát hiện, ghi GREEN/teeth; cập nhật tài liệu, diff review. Không tuyên bố đã merge/deploy.

Không thêm dependency/schema migration nếu không cần. Dùng môi trường `ats_test`, giữ volume/dev stack của người dùng. Dashboard hiện lấy mẫu giới hạn (6 ứng tuyển/100 job); việc xây thống kê đầy đủ nằm ngoài gói này và phải ghi rõ.
