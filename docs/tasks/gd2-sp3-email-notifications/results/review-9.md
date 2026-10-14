# Review Task 9 — Mailpit trong test stack, E2E, kiểm chứng toàn bộ (approved, 686fd86 + commit docs)

- Files: `docker-compose.test.yml`; `apps/web/e2e/gd2-email-notifications.e2e.ts`; `apps/web/e2e/support/{gd2-email-fixtures.mjs,mailpit.mjs}`; `results/{api-test,api-lint,api-build,web-test,web-typecheck,web-lint,e2e-sp3,e2e-full}.log`; `README.md`. Không commit file nào khác.
- Compose: khớp Interfaces (image `axllent/mailpit:v1.30.0`, hai biến AUTH, `MP_MAX_MESSAGES`, cổng `127.0.0.1:51025/58025` — không 1025/8025; SMTP bật với user/pass giả; `depends_on.mailpit: service_healthy`; comment dòng 2).
- E2E: 6 test đúng tên plan; fixture dùng `withDatabase` gắn cứng `localhost:55432/ats_test`, assert API cổng 55000 + health; cleanup theo `organization_id` của lần chạy; `afterAll` assert `{ organizationsRemaining: 0, usersRemaining: 0 }`.
- Step 2 (Codex chạy, phiên `-impl` đọc log): API jest 68 suite, 630/630; `nx lint api --skip-nx-cache` 0 lỗi, 313 cảnh báo (296 `no-explicit-any`, 17 `no-unused-vars`; 17 `no-unused-vars` đều trong file SP3 không sửa; không cảnh báo trong file production mới của SP3); `nx build api --skip-nx-cache` xanh; test:web 324/324; typecheck:web 0 lỗi; lint:web 0 cảnh báo.
- Finding (đã xử lý): lần đầu `api-lint.log`/`api-build.log` là Nx cache replay (`[existing outputs match the cache, left as is]`, `[local cache]`), Codex báo "0 warnings" dựa trên bản replay. Đã chạy lại với `--skip-nx-cache`; log mới không có dấu cache.
- Finding (đã sửa trong README): phiên `-impl` từng đưa Codex dữ kiện sai "313 cảnh báo đều `no-explicit-any`"; Codex đối chiếu log và sửa thành 296 + 17.
- Step 3 (phiên `-impl` chạy, giữ khoá `ats-e2e.lock` hai lần, mỗi lần `docker compose … stop` + `rmdir`, không `down -v`):
  - Lần 1: `e2e-sp3.log` 6/6; E2E toàn bộ 35 pass, 1 fail (`ai-configuration.e2e.ts:173`, trang hiện `ThrottlerException: Too Many Requests`; login 5 lần/60 giây; lần full bắt đầu ~16 giây sau lần chạy journey SP3). DỪNG theo plan, báo điều phối (`overnight-report.md`); log đỏ giữ untracked `e2e-full-run1-throttled.log`.
  - Điều phối đối chiếu SP1 (34/34 xanh cùng máy) và chọn chạy lại MỘT lần trên stack dựng mới: `e2e-full.log` 36/36, 4.6m, không retry, không skip.
- Quan sát: `migrate deploy` trong `CMD` của API không cảnh báo, không lỗi khi DB test dùng chung có migration SP1 thiếu ở local; DB giờ có cả `20261014000000` và `20261015000000` (đọc `_prisma_migrations`).
- Tác dụng phụ đã khôi phục (không commit): `apps/web/next-env.d.ts` (do `next dev`), `docs/tasks/gd1-week3/results/e2e-fixture.json`, `docs/tasks/test-defect-fixes/results/local-fixture.json` (id theo lần chạy) — `git restore` về bản đã commit.
- Quét mẫu bí mật trên `results/*.log`, `results/*.md` trước commit: không khớp (control: cùng glob tìm `passed` ra 15 file).
- README: đủ 6 mục; bảng C1–C15 15 dòng; mục "Chưa xác minh" và "Lệch so với plan" trung thực. Phiên `-impl` bỏ một link tới file untracked (`task-8-phase2-build.log`).
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng.
