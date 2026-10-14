# SP3 Task 9 — DỪNG: một E2E có sẵn đỏ khi chạy toàn bộ (2026-10-14)

> **Đã giải quyết.** Điều phối chọn chạy lại MỘT lần E2E toàn bộ trên stack dựng mới, không chạy journey SP3 riêng ngay trước đó. Kết quả `results/e2e-full.log`: **36 passed (4.6m)**, exit 0, không retry; `ai-configuration.e2e.ts:173` xanh (2.5s). Điều phối đối chiếu: SP1 chạy toàn bộ lúc 14:35 xanh 34/34; lần đỏ bắt đầu ~16 giây sau lần chạy journey SP3, trong cùng cửa sổ throttle 60 giây (giới hạn lưu trong Redis test). Bản log đỏ giữ ở `results/e2e-full-run1-throttled.log` (untracked). Stack đã stop, khoá đã nhả.

Theo plan (Global Constraints, Task 9 Step 3): "một journey có sẵn mà đỏ thì DỪNG và báo kèm log; không sửa journey đó". Chưa commit gì của Task 9; chưa viết README (Step 4).

## Trạng thái

- HEAD `e2feb22` (Task 0–8 approved). Task 9 Step 1–2 xong trong working tree, chưa commit: `docker-compose.test.yml`, `apps/web/e2e/gd2-email-notifications.e2e.ts`, `apps/web/e2e/support/{gd2-email-fixtures.mjs,mailpit.mjs}`, 6 log Step 2 (Codex chạy, đều xanh).
- Test stack: dựng bằng lệnh plan từ worktree SP3 khi giữ khoá (07:36:09Z), 4 service healthy (mailpit 51025/58025). Đã `docker compose -f docker-compose.test.yml stop` và `rmdir` khoá; cổng 3001 trống. Không `down -v`.
- `results/e2e-sp3.log`: **6/6 pass**, exit 0.
- `results/e2e-full.log`: **35 pass, 1 fail**, exit 1. Journey SP3 cũng 6/6 trong lần chạy này.

## Test đỏ

`apps/web/e2e/ai-configuration.e2e.ts:173` — `admin thiếu access cookie → refresh → đọc cấu hình ngay trong request hiện tại`. Hỏng ở `beforeEach` (dòng 26): sau khi bấm "Đăng nhập với tư cách Admin", trang vẫn ở `/sign-in/admin?callbackUrl=%2Fai-configuration`.

Bằng chứng nguyên nhân (đọc trực tiếp): ảnh chụp DOM lúc fail (`apps/web/test-results/ai-configuration.e2e.ts-ad-9e80b-…/error-context.md`) có dòng `ThrottlerException: Too Many Requests`. `POST /auth/login` giới hạn `ttl: 60000, limit: 5` (`apps/api/src/app/auth/auth.module.ts:35`, `auth.controller.ts:32`). File này đăng nhập admin qua UI ở mỗi `beforeEach`; test thứ 4 chạy khoảng 13 giây sau test thứ nhất (5.7s + 3.2s + 4.2s).

Nguyên nhân khác đã cân nhắc: (2) SMTP bật / code SP3 — luồng hỏng là request đăng nhập bị throttle, không đi qua email; (3) trạng thái DB dùng chung (có migration SP1, `organizationId` mới) — không giải thích được 429. Chưa xác minh: journey này có xanh trong lần chạy của SP1 trên cùng máy, cùng Redis test hay không (cần đối chiếu log SP1); chưa chạy lại.

## Phát hiện phụ

- `prepare-local.mjs` ghi đè `docs/tasks/test-defect-fixes/results/local-fixture.json` (file được theo dõi) với `organizationId` mới `1b6659a4-82de-4c73-a523-21804fc0ef21`. Ngoài mục Files: không commit.
- DB test dùng chung giờ có cả `20261014000000` (SP1) và `20261015000000` (SP3); `migrate deploy` trong `CMD` của API không cảnh báo, không lỗi (đọc `_prisma_migrations` và log container).
