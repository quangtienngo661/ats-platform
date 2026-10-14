# Review Task 1 — probe Mailpit (approved, commit 141ebbc)

- Files: chỉ `results/probe-mailpit.mjs`, `results/early-checks.log` (đúng mục Files).
- Người làm: Codex viết `probe-mailpit.mjs` và chạy Step 1. Sandbox Codex không tới được Docker engine (`//./pipe/docker_engine: Access is denied`), nên phiên `-impl` tự chạy Step 2 và Step 4 bằng đúng lệnh của plan, rồi commit theo giao thức 2 pha của điều phối (2026-10-14).
- Lệch so với plan:
  - Prompt gửi Codex viết cờ docker dạng `--env` thay `-e` (false positive của `guard-secret-reads.sh`, người dùng duyệt). Lệnh docker phiên `-impl` tự chạy dùng đúng `-e` như plan.
  - `docker exec … /mailpit readyz` cần `MSYS_NO_PATHCONV=1` trong Git Bash (MSYS đổi `/mailpit` thành đường dẫn Windows, exit 127). Lệnh docker không đổi.
- Finding vòng 1 (chặn, đã sửa): bản đầu bật `forceAuth: true`, khác transport của API (`mail.service.ts:36-41`). Vì nodemailer chỉ gửi AUTH khi server quảng bá AUTH (`smtp-transport/index.js:260`), control khi đó đo sai câu hỏi. Lỗi do prompt của phiên `-impl`. Codex đã bỏ cờ, `node --check` exit 0.
- Kết quả: Step 1 có 4 lần `updateManyAndReturn`; pull exit 0; probe `ok` 7/7 PASS, exit 0; control gửi được → ghi "hai bien khong can" (log container: control không có dòng `enabling any authentication`). Hai biến vẫn giữ ở Task 9 theo plan.
- Chưa xác minh: AUTH có thật sự được trao đổi trong lần chạy `ok` (log Mailpit không ghi theo từng phiên).
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng (control `dev` → `93ad69b`).
