# Review Task 9 — chọn đơn, thanh chấm, hộp thoại (2026-10-14)

**Kết luận:** approved. Commit do phiên `-impl`: `4299310` test, feat ngay sau (message ghi nhánh (b)). Kiểm theo cách mới:
Codex chạy lệnh, phiên `-impl` đọc log.

| Kiểm | Nguồn | Kết quả |
|---|---|---|
| Rẽ nhánh | `grep onToggle CandidateRow.tsx` (phiên `-impl`) | không có → **nhánh (b)**: SP2 thêm `selectedIds`/`selected`/`onToggle` đúng tên đã thống nhất với SP1 |
| Pha 1 — đỏ | `task-9-p1-test-web.log`, `…-r1.log` | 2 suite component mới `Failed to resolve import`; 2 test `CandidatesFilters` chạy qua ô tìm kiếm và bộ lọc có sẵn rồi đỏ ở assertion (`Unable to find … "Chọn tất cả"`) — không phải lỗi setup |
| Vòng 1 pha 1 | diff | thêm sẵn mock `next/navigation` (`useRouter`) và `exportCandidatesCsvAction` vào `CandidatesFilters.test.tsx`, để Task 10 (dùng `useRouter`, thêm `ExportCsvButton`) không phải sửa test đã commit |
| Pha 2 — STOP | `task-9-p2-typecheck-web.log` lần đầu | `page.tsx(21,18): TS2741 Property 'aiProfiles' is missing` — trang thuộc Files của Task 10 |
| Quyết định (phiên `-impl`) | — | tạm cho `aiProfiles?: ConfigProfile[]` mặc định `[]`, kèm comment; Task 10 truyền prop từ trang và đổi lại thành bắt buộc. Mỗi commit đều qua typecheck, interface cuối đúng plan |
| Test | `task-9-p2-test-web.log` | `Tests 12 passed (12)`, `EXIT=0` |
| Typecheck | `task-9-p2-typecheck-web.log` | `EXIT=0` |
| Lint | `task-9-p2-lint-web.log` | `eslint … --max-warnings 0`, `EXIT=0` |
| Diff | đọc tay | checkbox dòng không `disabled`; "Chọn tất cả" chỉ chọn/bỏ các dòng `filtered`; `colSpan` 6→7; nút "Bắt đầu chấm" khoá bằng `useRef` + state (Review Focus 3); không profile → không gửi `configId`; chuỗi tiếng Việt đúng plan |
| Không push | `git for-each-ref` | không có ref remote của nhánh |

**Chưa xác minh:** giao diện chưa xem bằng mắt trong trình duyệt (để E2E Task 11).
