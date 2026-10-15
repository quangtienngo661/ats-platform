# Review Task 4 — `BulkScreeningService` (2026-10-14)

**Kết luận:** approved, không finding. Commit do phiên `-impl`: `6dfa0a9` test, `1810dd2` feat.

| Kiểm | Kết quả (phiên `-impl` tự chạy) |
|---|---|
| Pha 1 — đỏ đúng lý do | chỉ TS2307 `./bulk-screening.service` và `./dtos/bulk-screening.dto` chưa có; 18 test |
| Pha 2 — file | `bulk-screening.service.ts`, `dtos/bulk-screening.dto.ts` (class, chưa validator), `applications.service.ts` (diff đúng 1 dòng: bỏ `private` của `assertCanAccessDepartment`); spec không đổi |
| Jest `bulk-screening\|applications\|cv-screenings` | `Test Suites: 8 passed` · `Tests: 139 passed` |
| `npx nx build api --skip-nx-cache` | `webpack compiled successfully` |
| eslint 3 file | 0 errors; 1 warning `any` có sẵn ở `applications.service.ts:683` |
| Review Focus 4 (E7) | test assert `where: { applicationId: { in: ids }, jobId }` và cả hai id ra `NOT_IN_JOB` |
| Review Focus 5 (unit) | test assert đúng `status.in`, mệnh đề `OR`, `orderBy: { appliedAt: 'asc' }`; đơn `completed`/`failed` 3 lần/`applied` khi cờ tắt bị lọc trước khi cắt 50; phần DB thật để P3 (Task 5b) |
| Thứ tự / tuần tự | test assert job → access → config → findMany bằng `invocationCallOrder`; enqueue không chồng nhau (cờ `enqueueInProgress`); code dùng `for…of` + `await` |
| Không push | `branch.<nhánh>.remote` rỗng; không có `refs/remotes/origin/feat/gd2-sp2-bulk-screening` |

**Ghi chú:** `STATUS_CHANGED` bắt mọi lỗi của `updateStatus` (không chỉ lỗi FSM) — đúng chữ plan ("lỗi → `STATUS_CHANGED`").
Lệch chữ prompt: forwarder đổi "git configuration" → "version-control configuration" và bỏ chữ `git status` vì guard
worktree từ chối chữ "git" trong prompt; nghĩa không đổi.
