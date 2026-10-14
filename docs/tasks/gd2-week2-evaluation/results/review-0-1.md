# Review — Task 0 và Task 1 (phiên stage-2-sp1-impl, 2026-10-14)

## Task 0 — chuẩn bị worktree

- Lần giao Codex đầu: `npm ci` exit 1 (EACCES khi tải `zustand-5.0.13.tgz`); Codex dừng đúng điều kiện, không file tracked nào đổi. Nguyên nhân chưa xác định (sandbox Codex, hoặc tranh chấp khi ba worktree cùng `npm ci`, hoặc khoá file).
- Theo điều phối: phiên `-impl` tự chạy Task 0 bằng Bash.
  - `npm ci` → exit 0 (2092 package, 45s)
  - `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma` → exit 0
  - `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="tenant-caller"` → 1 suite, 20/20 pass
  - `npm run test:web -- src/lib` → 7 file, 71/71 pass
  - `git status --short` → rỗng
- Kết luận: approved.

## Task 1 — chỉnh spec

- Codex sửa `spec.md`, `decision.md`; không commit được (sandbox không ghi `.git/worktrees/ats-sp1/index.lock`). Theo giao thức mới (điều phối, người dùng chốt): phiên `-impl` commit sau review.
- `git diff --name-only`: đúng 2 file trong Files. `git diff --check`: sạch.
- Nội dung: R6 (404 qua `assertInCallerOrganizationOr404`), R8 (theo quyền xem đơn), R12 bỏ marker, E11 thêm, header "đã duyệt"; decision.md: R12 "Đã duyệt 2026-10-13", hai dòng đề xuất ghi "chờ người dùng đọc plan, chưa được người dùng duyệt".
- Finding nhỏ (không chặn, chưa sửa): câu C7 "404 … (vẫn trả 403 cho tổ chức khác)" dễ đọc thành mâu thuẫn; ý đúng là endpoint mới trả 404, helper cũ vẫn 403.
- Kết luận: approved. Commit `ad8886b docs(tasks): align the sp1 spec with the existing access model`.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng (đối chứng: `… origin dev` trả `93ad69b`).
