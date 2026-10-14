# Review Task 4 — render email (approved, 3b5b69d + 4f98426)

- Files: 2 spec (pha 1); `notification-layout.html`, `format.ts`, `notification-email.types.ts`, `render-notification-email.ts` (pha 2). Không chạm file khác; spec đã commit không đổi ở pha 2.
- Đỏ trước: log `results/task-4-phase1-jest.log` (Codex chạy) — đúng 3 lỗi, cả 3 là TS2307 cho ba module chưa có. Lần chạy đầu (trước quy tắc log) do phiên `-impl` chạy lại một lần, cùng kết quả.
- Xanh: `results/task-4-phase2-jest.log` — 2 suite, 25/25 PASS; `results/task-4-phase2-tsc.log` — `tsc --noEmit -p apps/api/tsconfig.app.json` exit 0, không lỗi. Do Codex chạy; phiên `-impl` đọc log, không chạy lại.
- Finding vòng 1 pha 1 (chặn, đã sửa): test footer ép renderer chèn footer vào nội dung trong khi plan nói layout có footer cố định → email HTML thật sẽ có 2 footer. Chốt: HTML lấy footer từ layout (test đọc layout thật, đếm đúng 1 lần, sau lời chào; layout giả thì không có), text do renderer thêm cuối.
- Review Focus: (1) `fillLayout` thay một lượt bằng hàm, test với `$&`, `$1`, `{{content}}` trong tiêu đề và nội dung; (2) tiêu đề bỏ `\r\n`; (3) qua nửa đêm và `17:00Z` ra ngày VN — đều có test thật.
- Interfaces khớp plan (kiểu payload, `formatInterviewTime`, `formatVietnamDate`, `escapeHtml`, `fillLayout`, `renderNotificationEmail`).
- Ghi chú: `renderNotificationEmail` ném lỗi nếu email lịch thiếu `schedule` (processor sẽ retry rồi `failed`) — chấp nhận được, payload do service tự dựng.
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng.
