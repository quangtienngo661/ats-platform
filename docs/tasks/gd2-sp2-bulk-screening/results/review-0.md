# Review Task 0 — chuẩn bị worktree (2026-10-14)

**Kết luận:** approved.

| Kiểm | Kết quả (phiên `-impl` tự chạy lại) |
|---|---|
| Nhánh | `feat/gd2-sp2-bulk-screening`, HEAD `ec6d1de`, không commit mới |
| File đã đổi | không có file tracked nào đổi; `git status --short` = `?? .pnpm-store/` |
| `npm ci`, `prisma generate --schema=…` | exit 0 (theo báo cáo Codex; `node_modules` có, jest chạy được) |
| `npx jest … --testPathPatterns="applications\|cv-screenings"` | `Test Suites: 6 passed, 6 total` · `Tests: 99 passed, 99 total` (log ERROR của processor là nhánh lỗi có chủ ý trong spec) |
| `npm run test:web -- src/servers/applications src/components/candidates` | `Test Files 1 passed (1)` · `Tests 2 passed (2)`; `src/components/candidates` chưa có test nào |
| `git ls-remote --heads origin feat/gd2-sp2-bulk-screening` | rỗng; control `git ls-remote --heads origin dev` trả `93ad69b…` |

**Finding nhỏ:** `.pnpm-store/` (60 KB, chỉ có thư mục `v11`, không có file) được tạo lúc `npm ci` chạy (mtime 00:33, trước
`node_modules` 00:34), không có trong `.gitignore`. Không xoá; mọi task sau không được `git add` nó.

**Ghi chú môi trường:** guard worktree của phiên từ chối lệnh Bash có `cd …;` ghép hoặc heredoc ("too complex to verify");
lệnh đơn chạy được. Prompt Codex các task sau nên dùng lệnh đơn.
