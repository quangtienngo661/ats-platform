# Review — Task 7 (API so sánh ứng viên)

## Guard và cách gọi Codex (bằng chứng tách giả thuyết)

- Lượt 1 (prompt có câu cấm viết bằng chữ khác — lỗi của phiên `-impl`): dừng trước khi Codex nhận việc, không chạy.
- Lượt 2: subagent gọi `cd "E:/wt/ats-sp1" && node …/codex-companion.mjs task --write "$(cat <<'EOF' … EOF)"`, prompt giữ chữ git → **guard từ chối** (cùng thông báo như Task 6 lần 1). Subagent dừng đúng quy tắc.
- Lượt 3 (điều phối duyệt): **một lệnh đơn** `node "…/codex-companion.mjs" task --write '<prompt>'`, không `cd`, không heredoc/`$(...)`; prompt **giữ nguyên mọi chữ git** (`git worktree`, `git add`, `git remote`, `git config`, `git diff`, `git status`). Chỉ đổi ký tự trích dẫn để nằm trong nháy đơn của shell: nháy đơn quanh thông báo/tên test → nháy kép, bỏ backtick. → **guard cho qua** (cả pha 1 và pha 2).
- Kết luận (verified ở hai lần chạy): guard bắt dạng lệnh phức hợp (`cd … &&` và/hoặc heredoc `$(cat <<EOF)`), **không** bắt chữ git trong prompt (giả thuyết (a)). Chưa tách được giữa `cd … &&` và heredoc vì lượt 3 bỏ cả hai.

## Pha 1 — test

- Codex viết `application-comparison.service.spec.ts` (9 test service + 1 test DTO). `unit-test-helpers.ts` không đổi (đã có `jobPosting.findUnique`, `applicationNote.groupBy`).
- Phiên `-impl` chạy lại: đỏ vì `TS2307 Cannot find module` (service, DTO) → đỏ đúng lý do.
- Review Focus 2 (1/5 id, trùng, không phải UUID, kiểu không phải mảng → lỗi DTO), 5 (không screening, không scorecard → `null`), 1 (recruiter khác khoa ở id thứ hai → 403, helper gọi cho mọi id) có test; "no write" duyệt mọi mock ghi của mọi model.
- Commit `d995b6f test(api): add the comparison rules`.

## Pha 2 — code

- Service đúng flow: tìm tin → 404 → org 404 → tìm đơn → thiếu/khác tin → 400 → kiểm quyền từng id → scorecard → `groupBy` ghi chú → ghép theo thứ tự `applicationIds`; Decimal → number; trung bình làm tròn 1 chữ số.
- Route `GET applications/job/:jobId/compare` trong `ApplicationsController`, khai báo trước `job/:jobId` (khác số đoạn, không đè).
- Phiên `-impl` chạy lại: jest toàn bộ API → 67 suite, 605/605; `rm -rf dist .nx/cache && nx build api` thành công; `nx lint api` 0 error.
- Commit `0ad168d feat(api): compare 2-4 applications of a job`.

## Finding nhỏ (không chặn)

1. `ApplicationsController` nhận `comparisonService?` (tham số tuỳ chọn) để `applications.controller.spec.ts` có sẵn (gọi `new ApplicationsController(service)`) vẫn compile mà không phải sửa test cũ. Nest vẫn tiêm theo kiểu (không có `@Optional()`), nên thiếu provider thì lỗi lúc boot, không âm thầm `undefined`. Chỉ là mùi kiểu dữ liệu.
2. `@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))` trên route so sánh là thừa: phiên `-impl` đã đọc `node_modules/@nestjs/common/pipes/validation.pipe.js` — khi không bật `transform` mà có > 1 tuỳ chọn validator (`whitelist`, `forbidNonWhitelisted`), pipe trả `classToPlain(entity)`, tức giá trị đã qua `@Transform` (đã tách chuỗi) vẫn tới handler. Pipe toàn cục chạy trước nên thông báo lỗi tiếng Việt vẫn giữ. Không hại; chưa chạy thật end-to-end (Task 12 sẽ gọi route bằng query string).
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
