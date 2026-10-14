# Review — Task 12 (hành trình E2E và kiểm chứng toàn bộ)

## Step 1 — journey và fixture (Codex viết)

- `apps/web/e2e/gd2-evaluation.e2e.ts` (journey 4 bước: A nộp scorecard và đọc lại sau reload; B cùng khoa đọc scorecard của A và thêm ghi chú; B chọn 2 ứng viên và so sánh; token ứng viên nhận 403 ở scorecard và ghi chú, `GET /applications/my` không có khoá `scorecard`/`scorecards`/`notes`, đối chứng tìm thấy `status`).
- `apps/web/e2e/support/gd2-fixtures.mjs` +168 dòng: 1 tổ chức/khoa, recruiter A và B, 2 ứng viên có CV và đơn cùng một tin, 2 screening (điểm AI 83/71), 1 lịch `completed` có interviewer A. Giữ guard `ats_test`, `ON CONFLICT … DO NOTHING`, dọn dẹp như cũ; mật khẩu sinh theo lượt chạy.
- Kiểm tĩnh (Codex chạy, log `task-12-step1-*.log`): `tsc --project apps/web/tsconfig.spec.json --noEmit` exit 0; `eslint` hai file exit 0 (0/0); `node --check` fixture exit 0.

## Lỗi sản phẩm phát hiện ở Step 1 (thuộc Task 10)

- **Fixture ban đầu của Codex che lỗi:** nó cho B là **người đặt lịch**, với lý do "API lịch lọc theo interviewer/scheduler".
- Phiên `-impl` đọc code: `getMySchedules` với role recruiter đặt `where.OR = [{ interviewerId: userId }, { scheduledBy: userId }]` (`apps/api/src/app/interviews/interviews.service.ts`, nhánh staff); `ScorecardPanel` (Task 10) dựng thẻ chỉ từ danh sách đó và hiện "Chưa có buổi phỏng vấn." khi rỗng → recruiter cùng khoa, không phải interviewer/người đặt lịch, **không thấy scorecard nào** trong tab đánh giá, trái R8/C15. Unit test Task 10 không bắt được vì luôn mock lịch là của "mình". Điều phối tự đọc code xác nhận.
- Sửa (điều phối và người dùng duyệt hướng 1; không đổi API):
  - Pha 1: thêm 2 test vào `ScorecardPanel.test.tsx` (không đổi test cũ). Codex chạy, log `task-12-gap-phase1-scorecardpanel.log`: "a recruiter who neither runs nor scheduled the interview still sees its scorecard" FAIL (`Unable to find role="article"`, trang hiện "Chưa có buổi phỏng vấn.") → đỏ đúng lý do; "a recruiter of another department still sees no scorecard" PASS sẵn (chặn mở rộng quyền đọc); lint 0/0. Commit `080c448 test(web): reproduce a same-department recruiter missing the scorecards`.
  - Pha 2: `ScorecardPanel.tsx` dựng thẻ từ HỢP lịch "của mình" và `interview` có trong mỗi `IScorecardListItem` (khử trùng theo `interviewId`, sắp theo `startAt`); thẻ chỉ có nhờ scorecard thì chỉ đọc. Codex chạy, log `task-12-gap-phase2-*.log`: file 4/4; `test:web` 56/56 file, 356/356; `typecheck:web` 0 `error TS`; `lint:web` sạch; eslint 2 file e2e sạch; `node --check` sạch. Commit `b4da299 fix(web): show every scorecard of the application in the evaluation tab`.
  - Finding nhỏ: Codex thêm vế `(!saved || saved.author.userId === currentUserId)` vào `canWrite` → nút "Sửa đánh giá" chỉ cho tác giả (trước đây interviewer nào cũng thấy). Khớp brief Task 10 ("tác giả thấy Sửa đánh giá") và R1; điều kiện "Nộp đánh giá" không đổi. Vế này **chưa có test riêng**. API vẫn cho interviewer hiện tại `PUT` (R1), nên UI chặt hơn API ở ca interviewer bị đổi sau khi đã có scorecard.
  - Fixture: lịch `completed` giờ do **A đặt và A phỏng vấn**; B chỉ là recruiter cùng khoa → journey "B thấy scorecard của A" kiểm đúng ca thật. Spec E2E không đổi.

## Step 2 — E2E trên test stack (phiên `-impl` chạy: ngoại lệ vật lý, sandbox Codex không chạy Docker)

- `mkdir "$LOCALAPPDATA/ats-e2e.lock"` thành công (khoá rảnh).
- `docker compose -f docker-compose.test.yml up -d --build --wait` → api/postgres/redis Healthy; `GET http://localhost:55000/api/health` → 200.
- DB test có migration `20261014000000_add_interview_scorecards_and_application_notes` (đọc `_prisma_migrations`), bảng `interview_scorecards`, `application_notes` tồn tại.
- `node apps/web/e2e/support/prepare-local.mjs` → "Organization and verified candidate fixtures ready in ats_test."
- `TZ=UTC` + `WEB_E2E_*` theo `docs/tasks/test-defect-fixes/README.md` + `npm run test:e2e:web` → exit 0, **34 passed (5.0m)**, không có flaky/skipped/retry (log `task-12-e2e.log`). 4 test SP1 đều pass:
  - A nộp đánh giá cho lịch đã hoàn tất của mình và đọc lại sau reload (6.2s)
  - B cùng khoa đọc đánh giá của A và thêm ghi chú qua giao diện (5.2s)
  - B chọn hai ứng viên và xem điểm AI cùng trung bình đánh giá (4.6s)
  - Ứng viên nhận 403 cho đánh giá/ghi chú và payload đơn không lộ khoá nội bộ (316ms)
- Log API của test stack có lỗi `CvScreeningProcessor … Không tìm thấy đơn ứng tuyển` cho các job còn sót trong Redis của test stack từ các lượt chạy trước; không liên quan SP1, không làm test đỏ.
- Dọn: `docker compose -f docker-compose.test.yml stop` (api Exited 137 vì bị kill sau thời hạn stop, postgres/redis Exited 0); `rmdir` khoá; `ls` xác nhận khoá không còn.
- Tác dụng phụ đã khôi phục bằng `git checkout`: `apps/web/next-env.d.ts` (next ghi thêm một import) và `docs/tasks/test-defect-fixes/results/local-fixture.json` (prepare-local ghi organizationId mới).
- Commit `e5ee43c test(web): add the evaluation journey`.

## Step 3 — kiểm chứng toàn bộ

- Phiên `-impl` tự chạy `rm -rf dist .nx/cache` trước (theo điều phối).
- Lượt Codex 1: `npx jest --config apps/api/jest.config.ts --runInBand --silent` → exit 0, 69/69 suite, 609/609 test (log `task-12-final-api-jest.log`, phiên `-impl` đọc). `npx nx lint api` → "NX Unable to initialize workspace data while attempting to create lock file: Access is denied. (os error 5)" rồi treo > 10 phút; Codex thử dừng bằng `Get-CimInstance … taskkill` → **bị từ chối**; Codex DỪNG đúng quy tắc, không chạy 5 lệnh còn lại. Phiên `-impl` không kill tiến trình nào (không xem được command line). Điều phối đọc danh sách tiến trình: `node.exe` 14:38:45 là Nx daemon của worktree SP1, không có tiến trình `nx lint` nào còn sống.
- Nguyên nhân "Access denied khoá Nx trong sandbox Codex": **giả thuyết chưa chứng minh** (các lần `nx build api` của phiên `-impl` trước đó chạy được với cùng file khoá `.nx/workspace-data/…-v2.lock` có từ 00:57).
- Ngoại lệ sandbox cho Nx (điều phối duyệt, cùng loại với Docker): phiên `-impl` chạy với `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_SKIP_NX_CACHE=true NX_TASKS_RUNNER_DYNAMIC_OUTPUT=false`, `NX_WORKSPACE_DATA_DIRECTORY`/`NX_CACHE_DIRECTORY` trỏ thư mục tạm trong scratchpad (ngoài repo), giới hạn 600 s mỗi lệnh:
  - `npx nx lint api --skip-nx-cache` → exit 0, 0 error, 308 warning (log `task-12-final-api-lint.log`). File SP1 có warning: `application-comparison.service.ts:128` (non-null assertion `applicationsById.get(applicationId)!`), và `as any` trong `application-notes.service.spec.ts`, `application-comparison.service.spec.ts`, `interview-scorecards.service.spec.ts`. Số warning lúc review: 303 (Task 5), 305 (Task 6), 308 (Task 7); baseline trước SP1 chưa đo.
  - `npx nx build api --skip-nx-cache` → exit 0, "webpack compiled successfully" (log `task-12-final-api-build.log`).
- Lượt Codex 2 (không lệnh Nx): `npm run test:web` 56/56 file, 356/356; `npm run typecheck:web` 0 `error TS`; `npm run lint:web` 0/0; `git status --short` (log `task-12-final-*.log`, `task-12-final-git-status.txt`; phiên `-impl` đọc).
- Tác dụng phụ thứ ba của lần E2E, phát hiện qua `git status` của Codex: `docs/tasks/gd1-week3/results/e2e-fixture.json` (journey GĐ1 ghi runId mới) → `git checkout` khôi phục. Lần kiểm sau E2E trước đó của phiên `-impl` chỉ lọc vài thư mục nên bỏ sót file này. `git status --short --untracked-files=no` sau đó rỗng.

## Step 4 — README

- `docs/tasks/gd2-week2-evaluation/README.md`: bảng lệnh, C1–C15 → bằng chứng, E1–E11, lệch plan, "Chưa xác minh / rủi ro".
- Kết luận Task 12: approved.
