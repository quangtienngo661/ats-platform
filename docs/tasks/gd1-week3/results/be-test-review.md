# BE: tiêu chí, RED → GREEN và kiểm tra khả năng bắt lỗi

Kiểm tra ngày 2026-09-29, nhánh `feat/org-admin-enforcement`. Không khởi động dịch vụ; Jest dùng mock Prisma/Socket/JWT.

## Tiêu chí được kiểm tra

| Tiêu chí trong spec | Test mới | Kết luận unit |
|---|---|---|
| A4: Khi org_admin tạo recruiter, thì User + profile cùng tổ chức department, password được hash; email trùng hoặc department ngoài phạm vi không được ghi. Gán User global bị chặn; admin không gán candidate/admin/org_admin. | `recruiter-accounts.gd1.spec.ts` và `recruiters.gd1.spec.ts` | Kiểm tra transaction, role cố định recruiter, hash với salt rounds 10, scope từ department, duplicate precheck/race P2002, quyền route assignment và khóa owner khi PATCH. |
| A5: Khi org_admin không có Recruiter tạo job, thì chọn owner hợp lệ trong org; owner ngoài org, department sai, recruiter mạo nhận owner bị từ chối. | `job-postings.gd1.spec.ts` | Org admin/platform admin tạo qua owner; recruiter chỉ chính mình; yêu cầu owner đang hoạt động có đúng role; stamps department/org phải khớp; thiếu owner/org không được ghi. Foreign owner trả đúng 404 như tài nguyên tenant khác. |
| A8: Khi User đổi role/org/status, đổi password hoặc bị xóa, hay Recruiter đổi department/bị xóa, thì refresh token cũ thu hồi và socket ngắt; đổi tên không ngắt; ghi lỗi không báo thành công; join đọc quyền mới và pending handshake không dùng quyền cũ. | `users.gd1.spec.ts`, `recruiters.gd1.spec.ts`, `socket-io.gd1.spec.ts` | Pin `revoked:false → true`, thứ tự write/revoke/commit/disconnect, unchanged authority, rejected writes, sockets nhiều tab đã rời user-room, pending auth và pending job lookup. |

Các suite cũ được sửa fixture/constructor để đúng contract: `users.service.spec.ts`, `recruiters.service.spec.ts`, `job-postings.service.spec.ts`, `job-postings.controller.spec.ts`, `socket-io.service.spec.ts`. Giữ các assertion về giá trị ghi và ranh giới tổ chức.

## Kết quả chạy thực tế

- [RED trước production](be-red.log), [JSON](be-red.json): 4 suite, 38 test; **27 fail / 11 pass**, exit 1. Lỗi là assertion: gán User sai quyền/role được chấp nhận, job owner/department sai vẫn được ghi, mutation không revoke/disconnect, socket quyền cũ vào room. Không dùng lỗi import hoặc thiếu function làm bằng chứng chính.
- [Lần sweep đầu sau production](be-first-sweep.log), [JSON](be-first-sweep.json): **437/445 pass**, 8 fail do fixture thiếu status, seam bcrypt async và cách trả 404 để che tài nguyên tenant. Đã sửa fixture; 404 được chốt với người triển khai, giữ assertion chính xác và không cho phép ghi.
- [GREEN toàn bộ BE](be-green.log), [JSON](be-green.json): **57/57 suite, 445/445 test**, exit 0, 70.48 giây. Thêm 54 test so với baseline 391.

Lệnh toàn bộ:

```powershell
npx nx test api --runInBand --skipNxCache --json --outputFile=docs/tasks/gd1-week3/results/be-green.json
```

## Kiểm tra tests có bắt được lỗi khi cố ý phá hành vi

Hai mutation đã được phối hợp với người triển khai để tránh ghi đè công việc song song:

1. Bỏ đúng guard organization của job owner: [RED](be-teeth-owner-red.log), [JSON](be-teeth-owner-red.json) có **1 test fail** vì nhận job tạo thành công thay vì 404; exit 1.
2. Đổi resolver DB của socket sang cached caller active: [RED](be-teeth-socket-red.log), [JSON](be-teeth-socket-red.json) có **4 test fail**: đổi org, hạ role, inactive, deleted vẫn join room cũ; exit 1.

Production được phục hồi trong `finally`, SHA256 trước/sau bằng nhau: [job restoration](be-teeth-owner-restoration.json), [socket restoration](be-teeth-socket-restoration.json).
[GREEN sau phục hồi](be-teeth-restored-green.log), [JSON](be-teeth-restored-green.json): **5/5 suite, 54/54 test**, exit 0, 18.134 giây.

## Giới hạn bằng chứng

Mock Prisma chứng minh thao tác và thứ tự; không chứng minh rollback/foreign-key cascade thật. Token cascade khi xóa User, rollback hai bản ghi và isolation HTTP/database cần E2E/live probe riêng trong môi trường `ats_test`. Unit không chứng minh cookie, UI hoặc routing trình duyệt.
