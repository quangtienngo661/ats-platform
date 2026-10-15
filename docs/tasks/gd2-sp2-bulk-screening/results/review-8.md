# Review Task 8 — nhãn lý do và server actions (web) (2026-10-14)

**Kết luận:** approved. Commit do phiên `-impl`: `9dd8ce2` test, feat ngay sau. **Kiểm theo cách mới** (điều phối, theo yêu cầu người dùng):
Codex chạy lệnh và ghi log; phiên `-impl` đọc log, không tự chạy lại.

| Kiểm | Nguồn | Kết quả |
|---|---|---|
| Pha 1 — đỏ | `task-8-p1-test-web.log` (chạy lại theo cách mới), `task-8-p1-test-web-r1.log` | `Tests 5 failed \| 2 passed (7)`: suite nhãn `Failed to resolve import "./screening-skip-reasons"`; 5 test action `… is not a function`; 2 test cũ xanh. Đỏ vì hành vi chưa có |
| Vòng 1 (nhỏ) | diff | `import` mới nằm giữa file → dồn lên đầu; thân test giữ nguyên |
| Lint test pha 1 | `task-8-p1-eslint-r1.log` | file **rỗng** (0 byte), Codex báo exit 0 — không phân biệt được "sạch" với "không chạy"; từ pha 2 log có dòng lệnh đầu + `EXIT=` cuối |
| Pha 2 — test | `task-8-p2-test-web.log` | `Tests 8 passed (8)`, `EXIT=0` |
| Typecheck | `task-8-p2-typecheck-web.log` | `EXIT=0` |
| eslint 2 file | `task-8-p2-eslint.log` | không có dòng lỗi, `EXIT=0` |
| Diff | đọc tay | `screening-skip-reasons.ts` đúng 8 nhãn; action dùng helper sẵn có (`apiErrorResponse`, `actionErrorMessage`), không thêm `extractMessage` thứ 14; `unstable_rethrow` trước khi dịch lỗi; 429 → câu tiếng Việt; body bulk chỉ có `applicationIds`/`configId` khi được truyền; export `responseType: 'text'`, tên file theo ngày `Asia/Ho_Chi_Minh` bằng `Intl`, lỗi đọc `message` từ object hoặc chuỗi JSON |
| Không push | `git for-each-ref` | không có `refs/remotes/origin/feat/gd2-sp2-bulk-screening` |
