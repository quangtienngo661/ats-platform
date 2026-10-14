# Review — Task 3 (helper truy cập dùng chung)

- Pha 1: Codex thêm 5 `it`/`it.each` cho `assertInCallerOrganizationOr404` (admin qua; staff tổ chức khác → `NotFoundException` đúng message, cả recruiter và org_admin; staff cùng tổ chức qua; candidate → 403; staff không có tổ chức → 403 E2). 20 test cũ không đổi.
  - Phiên `-impl` chạy lại: jest đỏ vì `TS2305 … has no exported member 'assertInCallerOrganizationOr404'` → đỏ đúng lý do.
  - Commit `95c4c0b test(api): reproduce cross-organization lookups answering 403 instead of 404`.
- Pha 2: `tenant-caller.ts` thêm hàm (chữ ký khớp Interfaces); `applications.service.ts` và `interviews.service.ts` chỉ bỏ `private` (không đổi thân). `assertCanAccessDepartment` không đụng (của SP2).
  - Phiên `-impl` chạy lại `--testPathPatterns="tenant-caller|applications.service|interviews.service"` → 3 suite, 137/137 pass. Không file test nào đổi ở pha 2.
  - Codex báo `tsc --noEmit -p apps/api/tsconfig.app.json` exit 0 (phiên `-impl` chưa tự chạy; build đầy đủ sẽ chạy ở Task 4).
  - Commit `2b3a0b6 feat(api): share the access checks with the evaluation modules`.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
