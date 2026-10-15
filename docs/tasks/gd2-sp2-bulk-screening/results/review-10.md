# Review Task 10 — nút xuất CSV, tự tải lại, nối trang (2026-10-14)

**Kết luận:** approved, không finding. Commit do phiên `-impl`: `f897061` test, feat ngay sau. Kiểm theo cách mới (Codex
chạy lệnh, phiên `-impl` đọc log).

| Kiểm | Nguồn | Kết quả |
|---|---|---|
| Pha 1 — đỏ | `task-10-p1-test-web.log` | `Test Files 3 failed \| 3 passed (6)`, `Tests 12 passed (12)`: chỉ 3 suite mới `Failed to resolve import`; 12 test cũ xanh |
| Test pha 1 | đọc tay | BOM đúng một lần cho cả input có/không BOM (giải mã với `ignoreBOM: true`), `download`/`href`/`revokeObjectURL`; nút tắt khi chạy, click thứ hai không gọi lại; debounce 3 sự kiện → `refresh` 1 lần; không đăng ký khi chưa `connected`; `offEvent` cùng handler khi unmount |
| Test task | `task-10-p2-test-web-targeted.log` | `Tests 18 passed (18)`, `EXIT=0` |
| Toàn bộ web | `task-10-p2-test-web.log` | `Test Files 51 passed (51)`, `Tests 348 passed (348)`, `EXIT=0` |
| Typecheck | `task-10-p2-typecheck-web.log` | `EXIT=0` |
| Lint | `task-10-p2-lint-web.log` | `EXIT=0` |
| Diff | đọc tay | 5 file đúng Files; `aiProfiles` bắt buộc lại (gỡ cách tạm của Task 9); `CandidatesFilters` gọi `useScreeningLiveRefresh()` và đặt `ExportCsvButton` cạnh `BulkScreeningBar`; `page.tsx` dùng `Promise.all` với `getAIConfigAction()` và `InitSocketRoom` như trang Kanban |
| Không push | `git for-each-ref` | không có ref remote của nhánh |

**Chưa xác minh:** tải file thật trong trình duyệt và tự tải lại khi có sự kiện socket thật (E2E Task 11 kiểm phần tải file;
socket thật không có kết quả chấm vì Gemini key giả).
