# FE test-author — GĐ1 tuần cuối

Nguồn: `../spec.md`, A1/A2/A3/A5/A7. Ngày chạy RED: 2026-09-29.

| Tiêu chí | Assertion tại mức unit/component | File |
|---|---|---|
| A1: Khi đăng nhập org_admin bằng portal staff, cookie được thiết lập và chuyển /department-management; sai portal bị từ chối | Exact redirect + hai cookie; org_admin chọn sai portal và candidate/recruiter chọn org portal không có cookie; giữ admin qua recruiter portal. Form submit role=org_admin. | auth.action.test.ts; StaffLoginForm.test.tsx |
| A2: Org admin vào các trang phạm vi, platform-only bị chặn; refresh cùng policy; guest bị chặn hai staff path | Bảy trang allowed trước/sau refresh; bốn trang platform-only bị chặn cùng kết quả; guest/candidate không vào recruiter-management/my-profile; admin vào staff pages. | proxy.test.ts |
| A3: Admin tạo/sửa org_admin có organization binding, role khác không gửi binding | Organization bắt buộc, chọn B, giữ role khi edit, đổi về recruiter bỏ organization; payload create/update exact ID; blank/whitespace bị chặn trước HTTP; stale binding role khác bị bỏ. | AddUserModal.test.tsx; EditUserModal.test.tsx; users.action.test.ts |
| A5: Job admin chọn recruiter owner | Action gửi createdBy cùng department, trim ID; recruiter flow giữ omission khi blank. Quyền sở hữu server do BE tests/E2E kiểm tra. | job-postings.action.test.ts |
| A7: Platform admin thấy đúng tổ chức | Mapper giữ organizationId trên hai department cùng tên và detail. Ba component hiển thị đúng organizationName, không gán nhãn tổ chức khi thiếu tên. Cách parent list chọn đúng tên từ ID và org scope vẫn do E2E kiểm tra. | departments.action.test.ts; DepartmentCard.test.tsx; ConfigCard.test.tsx; UserRow.test.tsx |

## RED

Lệnh: `npm run test:web -- --reporter=verbose`.

Output thật: [fe-red.txt](fe-red.txt), exit 1, 36 failing / 39 passing / 75 tests, 8 failing / 1 passing files. Các lỗi là assertion về route/redirect, giá trị payload mất organizationId/createdBy, mapper mất organizationId và UI thiếu lựa chọn org_admin; không có lỗi import chưa tồn tại. Các test baseline trước lượt này vẫn pass.

## GREEN và teeth

- [fe-green-attempt1.txt](fe-green-attempt1.txt): 76/81 pass, exit 1. Phát hiện một lỗi production của lần refactor: proxy còn dùng `roleProtectedPaths` trong guest branch nhưng chưa import. Main đã sửa. Test EditUserModal được chuyển từ vị trí combobox sang accessible name `Vai trò`, để giữ assertion khóa role mà không phụ thuộc thứ tự Organization/Role trên form.
- [fe-green.txt](fe-green.txt): 81/81 pass, 12/12 files, exit 0. Có 19 test baseline + 62 case thêm.
- [fe-teeth-red.txt](fe-teeth-red.txt): tạm bỏ hai assignment `payload.organizationId` trong create/update User, 2/8 case fail đúng giá trị payload bị thiếu.
- [fe-teeth-green.txt](fe-teeth-green.txt): khôi phục source, 8/8 focused case pass. [fe-teeth.json](fe-teeth.json) lưu SHA-256 trước/sau bằng nhau và exit 1 → 0. Mutation đã hoàn tất, source production được khôi phục byte-for-byte.

Sáu case component label A7 được thêm khi main đã nối label; lần quan sát đầu tiên của riêng các case này là GREEN, không tuyên bố RED-first. Unit Department mapper của A7 có RED → GREEN. Browser journey, persistence, org isolation, profile/interview staff không có Recruiter và việc parent list ghép organization name đúng phải được kiểm tra bằng real E2E theo spec; component jsdom không chứng minh các điều đó. Type check/build được main chạy riêng; Vitest không thay thế type check.
