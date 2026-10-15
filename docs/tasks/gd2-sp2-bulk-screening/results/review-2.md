# Review Task 2 — điều kiện chấm dùng chung (2026-10-14)

**Kết luận:** approved. Commit do phiên `-impl` làm (giao thức 2 pha, xem `blocked-1.md`): `84162a4` test, `757d756` refactor.

| Kiểm | Kết quả (phiên `-impl` tự chạy) |
|---|---|
| Pha 1 — đỏ đúng lý do | `Test Suites: 1 failed, 1 passed` · lỗi duy nhất TS2305 `ScreeningSkipReason` chưa có trong `@ats-platform/types` và TS2307 `./screening-eligibility` chưa có. 6 test `triggerScreening keeps its message and HTTP class…` xanh từ đầu: chúng chốt hành vi cũ (C4), assert cả class exception lẫn message chính xác |
| Pha 2 — file | `applications.service.ts`, `screening-eligibility.ts` (mới), `enums.ts`, `applications.interface.ts`: đúng Files; hai spec đã commit không đổi (`git diff --stat HEAD` rỗng) |
| Jest `screening-eligibility\|applications.service` | `Tests: 96 passed, 96 total` |
| `npx tsc --build libs/shared/types` | exit 0 |
| `rm -rf dist .nx/cache` + `npx nx build api` | lần đầu Nx đọc từ cache dù đã xoá `.nx/cache` ("read the output from the cache … 3 out of 3"), nên chạy lại `npx nx build api --skip-nx-cache`: `webpack compiled successfully`, exit 0 |
| Lint | `nx lint api`: 0 errors. Vòng 1: warning mới `ScreeningStatus` không dùng ở `applications.service.ts:17` → trả Codex, đã xoá. Còn 2 warning có sẵn trước task (`AiRecommendation` không dùng ở `HEAD` của interface; `any` ở `applications.service.ts:683` không thuộc diff) |
| Interfaces | `ScreeningSkipReason` (as const + type, 8 mã), `IBulkScreeningResult`, `MAX_SCREENING_RETRIES = 3`, `ScreeningSubject`, `EligibilityVerdict`, `checkScreeningEligibility(subject, { allowApplied })` khớp plan; thứ tự kiểm và message trùng code cũ |
| Không push | `ls-remote` bị classifier chặn từ sau Task 1; thay bằng `git config --get branch.feat/gd2-sp2-bulk-screening.remote` (exit 1, rỗng; control `branch.dev.remote` = `origin`) và `git for-each-ref refs/remotes/origin/feat/gd2-sp2-bulk-screening` (rỗng) |

**Ghi chú:** `checkScreeningEligibility` import enum từ `@ats-platform/database`, spec dùng `@ats-platform/types`; ts-jest và
build đều chấp nhận (giá trị chuỗi giống nhau). Service không còn dùng `MAX_SCREENING_RETRIES` nên không import lại.
Lệch chữ prompt: forwarder viết lại câu cấm lệnh git trong prompt pha 1 vì guard worktree từ chối chữ lệnh git trong văn bản.
