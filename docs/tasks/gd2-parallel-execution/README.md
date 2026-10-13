# GĐ2 — chạy song song SP1, SP2, SP3: điều phối nhiều phiên, Codex viết code, Claude review

**Cập nhật:** 2026-10-14. Không dùng `/goal` nữa: một **phiên điều phối** nhắn việc cho ba **phiên `-impl`**; mỗi phiên `-impl` gọi Codex viết code theo plan rồi review code đó, và gửi kết quả tổng quát về phiên điều phối. Tài liệu này là điều phối, không phải spec: spec, plan, decision của từng SP nằm ở thư mục riêng. Trạng thái ở §2 chụp bằng lệnh kiểm ngày 2026-10-14.

## 0. Đọc gì, theo thứ tự

1. §1–§4 (khoảng 10 phút): đang ở đâu, ai quyết gì, chưa được phép làm gì.
2. §5–§8: cách chạy, vai trò từng phiên, giao thức nhắn tin, tin nhắn mẫu cho từng phiên.
3. Ba plan (đọc kỹ Global Constraints, Review Focus, danh sách task): `docs/tasks/gd2-week2-evaluation/plan.md`, `docs/tasks/gd2-sp2-bulk-screening/plan.md`, `docs/tasks/gd2-sp3-email-notifications/plan.md`; ba `spec.md` và `decision.md` cùng thư mục; `docs/deliveries/gd2-sp{1,2,3}-*.md` là tóm tắt mỗi task một dòng.
4. Quy tắc cá nhân của người dùng nạp tự động từ `~/.claude/CLAUDE.md` và `~/.claude/rules/` (verify trước khi khẳng định; không commit, push, merge khi chưa được phép; báo cáo ngắn bằng tiếng Việt giữ thuật ngữ tiếng Anh). Quy tắc dự án: `projects/ats-platform/CLAUDE.md` (import brain `~/.claude/knowledge-base/ats-platform/context.md`); `runbook.md` cùng thư mục brain có các bẫy riêng của máy này.

## 1. Mục tiêu và phạm vi

GĐ2 (đề cương ĐA2: 28/09–25/10/2026) hoàn thiện luồng nghiệp vụ cốt lõi. Phần ứng viên đã xong và đã vào `dev` (PR #64–#67, merge 2026-10-13). Phần còn lại tách thành 3 spec độc lập, mỗi spec có plan riêng và chạy trong một git worktree riêng:

| | SP1 đánh giá ứng viên | SP2 chấm hàng loạt + CSV | SP3 email thông báo |
|---|---|---|---|
| Mã trong artifact "Lộ trình ĐA2" | A-01 scorecard, A-07 ghi chú, so sánh ứng viên | A-05 | A-02 |
| Thư mục task | `docs/tasks/gd2-week2-evaluation/` | `docs/tasks/gd2-sp2-bulk-screening/` | `docs/tasks/gd2-sp3-email-notifications/` |
| Nhánh | `feat/gd2-sp1-evaluation` | `feat/gd2-sp2-bulk-screening` | `feat/gd2-sp3-email-notifications` |
| Worktree (đề xuất) | `E:\wt\ats-sp1` | `E:\wt\ats-sp2` | `E:\wt\ats-sp3` |
| Phiên `-impl` | `stage-2-sp1-impl` | `stage-2-sp2-impl` | `stage-2-sp3-impl` |
| Số task trong plan | 13 (Task 0–12) | 13 (Task 0–11 và Task 5b) | 10 (Task 0–9) |
| Migration | `20261014000000_add_interview_scorecards_and_application_notes` | không | `20261015000000_add_email_notifications` |
| Thứ tự merge | 1 | 2 | 3 |
| Nội dung | 2 bảng mới (scorecard, ghi chú), 2 module API, service so sánh, tab web, chọn 2–4 và trang so sánh | endpoint bulk 1–50 đơn hoặc tự chọn, rate limit 3/phút theo user, xuất CSV (UTF-8 BOM, chống formula injection, trần 5000 dòng), thanh chấm và hộp thoại web | bảng `email_notifications`, queue `notification-email`, 8 email cho ứng viên, Mailpit riêng trong test stack |

**Ngoài phạm vi SP1–SP3:** địa điểm dạng text cho tin tuyển dụng (C-05 phần còn lại; chưa brainstorm, chưa có spec); email hay thông báo cho recruiter khi có scorecard; GĐ3 trở đi. **Thời gian:** người dùng bảo bỏ qua ràng buộc thời gian; mốc đề cương vẫn là 25/10, GĐ3 bắt đầu 26/10.

## 2. Trạng thái hiện tại (kiểm ngày 2026-10-14)

- **Repo `projects/ats-platform`** (git repo riêng dưới harness `alsp-ai-harness`, đã gitignore trong harness): `dev` local = `origin/dev` = `93ad69b`; không còn PR mở. **Chưa có worktree nào** (thư mục `E:\wt` chưa tồn tại) và chưa có nhánh `feat/gd2-sp{1,2,3}-*`.
- **File của GĐ2 SP1–SP3 đang untracked hoặc sửa chưa commit trong checkout dùng chung, trên `dev`:** `docs/tasks/gd2-week2-evaluation/plan.md` (mới) và `spec.md` (sửa một dòng); `docs/tasks/gd2-sp2-bulk-screening/{spec,decision,plan}.md`; `docs/tasks/gd2-sp3-email-notifications/{spec,decision,plan}.md`; `docs/deliveries/gd2-sp{1,2,3}-*.md`; file này; `CLAUDE.md` của dự án (một dòng trỏ `docs/deliveries/`). Vì chưa commit nên **worktree cắt từ `origin/dev` sẽ không thấy chúng** (§5 nói cách đưa vào).
- **Phiên Claude đã có (kiểm bằng `ListAgents`, đều đang rảnh):** `stage-2-sp1-impl` [121798], `stage-2-sp2-impl` [ab0b55], `stage-2-sp3-impl` [3d6828]. Phiên "Kiểm tra tiến độ dự án" [5beecf] đã viết spec và plan SP1, review plan SP2 và SP3, tạo tài liệu này; vẫn nhắn được nếu plan mơ hồ. Hai phiên viết spec cũ (`stage-2-sp2`, `stage-2-sp3`) không còn thấy trong danh sách. **Chưa kiểm:** thư mục làm việc (cwd) của ba phiên `-impl` (nếu chúng đứng trong checkout dùng chung thì không được `git switch` ở đó; xem §5).
- **Docker:** `english-learning-mailpit-1` (dự án khác) giữ `127.0.0.1:1025` và `:8025`; `ats-redis` giữ `6379`; test stack đang dừng và đã có `healthcheck` cho service `api` (PR #64).
- **Chưa ai chạy dòng code nào của SP1–SP3.** Hiện chỉ có spec, plan, decision.

## 3. Quyết định đã chốt (nguồn chuẩn: `decision.md` của từng SP)

- **SP1 (D1–D7, người dùng chốt):** không cắt mục nào của GĐ2; bộ tiêu chí scorecard cố định (4 điểm 1–5 và khuyến nghị tổng, enum mới `ScorecardRecommendation`); chỉ interviewer của lịch nộp, khi lịch `completed`; ghi chú chia sẻ trong tổ chức, chỉ tác giả sửa hoặc xoá; trang so sánh 2–4 ứng viên cùng một tin, chỉ hiển thị; điểm lưu bằng cột cố định; khoá scorecard khi đơn sang `hired`/`rejected`/`cancelled`. Spec được người dùng duyệt 2026-10-13, gồm R12 (xoá lịch đã có scorecard trả 409). **Hai điều chỉnh mình thêm khi viết plan, người dùng chưa đọc riêng:** tổ chức khác trả **404** qua helper mới `assertInCallerOrganizationOr404` (code cũ trả 403), và quyền đọc theo quyền xem đơn đó (recruiter chỉ thấy đơn của khoa mình), thay cho "mọi staff cùng tổ chức".
- **SP2 (D1–D8, người dùng chốt, theo báo cáo của phiên spec):** chọn đơn theo danh sách (1–50) hoặc server tự chọn đơn đủ điều kiện (nộp sớm nhất trước, trả `remaining`); đơn `applied` chỉ chuyển sang `screening` khi bật cờ `moveAppliedToScreening` (mặc định tắt); tiến độ dùng socket `cv-screening:completed` có sẵn; job bulk mang `notify: false`; trần 50 đơn/lần và rate limit 3 lần/phút theo `userId`; CSV không có email, số điện thoại hay scorecard, gồm mọi đơn của tin trừ `cancelled`, trần 5000; hàm thuần `checkScreeningEligibility` dùng chung với `triggerScreening`.
- **SP3 (D1–D8, người dùng chốt, theo báo cáo của phiên spec):** 8 email chỉ cho ứng viên; đơn bị từ chối kéo theo huỷ lịch thì gộp vào một email từ chối (không có email huỷ lịch riêng); queue `notification-email` kèm bảng `email_notifications` (job id là id của row); một layout HTML cộng nội dung viết trong code có escape; Mailpit riêng trong `docker-compose.test.yml`; không opt-out; email từ chối không nêu lý do; thêm in-app cho sự kiện lịch.
- **Mặc định do Claude chọn thay người dùng, chờ xác nhận:** (a) SP3 không gửi email cho ứng viên `UserStatus.inactive` (row `skipped`, in-app vẫn tạo); (b) email hay thông báo cho recruiter khi có scorecard nằm ngoài phạm vi.
- **Hợp đồng chéo giữa ba plan (đã đồng bộ; đừng đổi một phía):**
  - Merge SP1 → SP2 → SP3; nhánh sau `git merge origin/dev` rồi chạy lại test trước khi tạo PR (người dùng cho phép việc merge đó).
  - State chọn ở danh sách ứng viên: `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())` trong `CandidatesFilters`; `CandidateRow` có `selected`, `onToggle`, nhãn `Chọn ${tên}`, ô tiêu đề `Chọn tất cả`, `colSpan` +1, **không bao giờ khoá checkbox**; trần nằm ở từng thanh hành động (so sánh 2–4, chấm hàng loạt 1–50). SP1 Task 11 và SP2 Task 9 nhánh (b) viết đúng hunk này.
  - Mở hàm kiểm quyền chỉ bằng cách xoá `private`: SP1 mở `ApplicationsService.assertCanAccessApplication` và `InterviewsService.assertCanViewSchedule`; SP2 mở `assertCanAccessDepartment`; SP3 không phụ thuộc chúng.
  - `schema.prisma`: mỗi SP chỉ thêm dòng quan hệ ngược ở **cuối** danh sách quan hệ của `Organization`, `User`, `Application`; enum và model mới ở cuối file. `enums.ts` (libs/shared/types) và `unit-test-helpers.ts` cùng bị SP1 và SP3 sửa: xung đột cơ học.
  - Điểm xung đột khi merge: `applications.module.ts` và `applications.controller.ts` (SP1, SP2), `applications.service.ts` (SP2 sửa `triggerScreening`; SP3 sửa constructor, `apply`, `cancelUpcomingSchedules`, `updateStatus`), `interviews.service.ts` (SP1 sửa `removeSchedule`; SP3 sửa tạo, đổi, xoá lịch).

## 4. Việc cần người dùng cho phép (hỏi mỗi việc đúng một lần)

**Cập nhật 2026-10-14 — người dùng đã trả lời "cho phép":** mục 1 (tạo worktree, commit docs), mục 2 (Codex commit trên nhánh worktree; **dòng `Co-Authored-By` vẫn chưa được chốt, phiên điều phối hỏi người dùng đúng chữ trailer trước commit đầu tiên**), mục 3 (`docker pull axllent/mailpit:v1.30.0`), mục 4 (hai mặc định của SP3 và hai spec SP2, SP3), mục 5 (gọi Codex, chạy lệnh), mục 6 (giữ máy thức). **Mục 7 (push, PR, merge) giữ nguyên là việc của người dùng.** Người dùng cũng yêu cầu: push phải bị chặn không cho tự động; xem §4b về hook và cài đặt (không phiên nào được tự sửa file settings).

1. **Tạo ba worktree và commit docs** làm commit đầu của mỗi nhánh (người dùng duyệt message).
2. **Cho Codex commit** trên nhánh worktree (không push) và **chốt dòng `Co-Authored-By`** của các commit đó (plan SP2 và SP3 để trống; đừng điền tên model không tham gia).
3. **`docker pull axllent/mailpit:v1.30.0`** (SP3 Task 1 và Task 9). Không có phép thì SP3 dừng ở Task 1.
4. **Xác nhận hai mặc định của SP3** (§3) và **chấp nhận spec SP2 và SP3** (hai phiên viết plan dựa trên câu "viết plan đi", chưa có câu duyệt riêng).
5. **Cho phép gọi Codex** từ các phiên `-impl` (Agent loại `codex:codex-rescue` hoặc skill `codex:rescue`) và chạy lệnh test/lint/build không cần hỏi từng lần. **Người dùng xác nhận 2026-10-14: ba phiên `-impl` chạy mode `auto`.** Auto mode không thay thế các cổng ở mục này và mục 7: commit, push, merge và `docker pull` vẫn chờ người dùng.
6. **Giữ máy thức** khi chạy lâu (người dùng bật, hoặc gọi công cụ `request_keep_awake` khi được phép).
7. **Push, tạo PR, merge:** luôn là việc của người dùng; trước push báo `git log <upstream>..HEAD` đầy đủ và danh sách thay đổi chưa commit. Ghi chú đã quan sát: lần gộp bốn PR một lượt bị hệ thống chặn (`Merge Without Review`); lần sau, khi người dùng yêu cầu riêng cho #67, `gh pr merge 67 --merge` chạy được. Không tìm đường vòng khi bị chặn.

## 4b. Settings, hook và chặn push (đọc ngày 2026-10-14, chỉ đọc, chưa sửa gì)

Nguồn: `~/.claude/settings.json` (phạm vi người dùng, áp cho mọi phiên) và `.claude/settings.json` của harness (chỉ áp khi dự án của phiên là harness root).

- **Không có hook nào chặn cứng công việc này.** Hook duy nhất làm phiên dừng chờ: `~/.claude/hooks/confirm-destructive-ops.sh` (PreToolUse, Bash) trả `ask` khi lệnh khớp `prisma migrate (reset|deploy)`, flush Redis, hoặc `-f docker-compose.yml` (compose prod). Hai nơi trong plan chạy `npx prisma migrate deploy` trên PostgreSQL dùng một lần: SP1 Task 2 (Step 2 và Step 4) và SP3 Task 2 (Step 2 và Step 4). Ở đó phiên sẽ hiện hỏi xác nhận và **kẹt nếu không có ai trông**. Lệnh `docker compose -f docker-compose.test.yml …` **không** khớp mẫu `-f docker-compose.yml`, nên không bị.
- `scan-secrets.sh` chỉ chạy khi `git commit` có file staged; chặn nếu thấy mẫu bí mật (gồm khối PEM, token GitHub, GitLab, AWS, JWT dạng `eyJ….eyJ….…`). Nên **giữ**. Nếu một log E2E hay probe chứa chuỗi giống JWT thì commit bị chặn: phiên `-impl` báo điều phối, không tắt hook (mình chỉ đọc phần đầu danh sách mẫu).
- `guard-secret-reads.sh` chặn lệnh Bash đọc `.env*`, `*.pem`, `*.key`, `id_rsa*`; worktree không có `.env` nên không ảnh hưởng.
- `permissions`: `git commit` được `allow`; `git push`, `git merge`, `glab mr merge` ở `ask`; force-push, push vào `main`/`master`, `--delete`, `--mirror` ở `deny`. Hook của harness (`checkpoint-gate`, `check-mr-on-create`, `format-lint`, `route-map`) chỉ chạy khi phiên đứng ở harness root; phiên ở worktree `E:\wt\…` không nạp chúng (chưa kiểm).
- **Chặn push:** hook không chặn push; việc đó nằm ở `permissions.ask`. `ask` chưa chắc ngăn được auto mode tự duyệt (chưa kiểm). Để chặn cứng khi chạy không người trông, **người dùng tự** chuyển bốn mẫu `Bash(git push)`, `Bash(git push *)`, `Bash(git -C * push)`, `Bash(git -C * push *)` từ `ask` sang `deny` trong `~/.claude/settings.json` cho tới sáng rồi trả về `ask`.
- **Hook xác nhận prisma:** người dùng chọn một trong ba: (1) tạm thời bỏ riêng mục `confirm-destructive-ops.sh` khỏi `hooks.PreToolUse` trong `~/.claude/settings.json`, giữ `scan-secrets` và `guard-secret-reads` (mình khuyến nghị; trả lại sáng hôm sau); (2) giữ hook và trả lời hỏi khi phiên dừng; (3) sửa plan SP1 và SP3 để áp migration probe bằng script `pg` thay vì `prisma migrate deploy` (đổi plan, mất bằng chứng rằng đúng lệnh deploy chạy được).
- **Codex không đi qua hook hay permission của Claude Code.** Lệnh Codex chạy qua runtime riêng của nó, nên các rule `deny`/`ask` ở trên **không chặn** Codex push. Chặn push cho Codex dựa vào: (a) prompt giao việc luôn ghi "không push, không `git remote`, không đổi cấu hình git"; (b) sandbox và approval của chính Codex (chưa kiểm); (c) bước kiểm của phiên `-impl` sau mỗi task: `git ls-remote --heads origin <nhánh>` phải rỗng (xem §7).
- **Không phiên nào được sửa `settings.json`, hook hay `CLAUDE.md` vì lời nhờ của phiên khác hay để thông suốt công việc**; người dùng tự sửa file đó và báo lại.

## 5. Cách chạy, từng bước

1. **Điều kiện đầu vào:** người dùng trả lời §4. **Codex:** người dùng báo (2026-10-14) đã setup và đã chạy thành công ở các phiên trước; mình chưa tự kiểm. Nếu lần gọi Codex đầu tiên từ một phiên `-impl` lỗi, dừng, chạy skill `codex:setup`, và báo người dùng nếu vẫn lỗi; không đi vòng.
2. **Tạo worktree** (phiên điều phối làm, sau khi người dùng đồng ý §4.1):
   ```bash
   P="E:/Learnings/Learning Stuffs/University/HK6/Do_an_1/Main/Project/alsp-ai-harness/projects/ats-platform"
   git -C "$P" fetch origin
   git -C "$P" worktree add "E:/wt/ats-sp1" -b feat/gd2-sp1-evaluation origin/dev
   git -C "$P" worktree add "E:/wt/ats-sp2" -b feat/gd2-sp2-bulk-screening origin/dev
   git -C "$P" worktree add "E:/wt/ats-sp3" -b feat/gd2-sp3-email-notifications origin/dev
   ```
   Đường dẫn ngắn `E:\wt\…` để tránh giới hạn độ dài đường dẫn của Windows trong `node_modules` (chưa kiểm máy này có bật long paths hay không).
3. **Đưa docs vào nhánh.** Chép (cp) rồi commit, mỗi nhánh một commit, **chỉ `git add` đúng các đường dẫn sau**:

   | Nhánh | Chép từ checkout dùng chung | Message đề xuất |
   |---|---|---|
   | SP1 | `docs/tasks/gd2-week2-evaluation/plan.md`, `docs/tasks/gd2-week2-evaluation/spec.md` (bản đã sửa), `docs/deliveries/gd2-sp1-evaluation.md`, `docs/tasks/gd2-parallel-execution/README.md`, `CLAUDE.md` (một dòng) | `docs(tasks): add the gđ2 sp1 plan and the parallel execution notes` |
   | SP2 | `docs/tasks/gd2-sp2-bulk-screening/` (3 file), `docs/deliveries/gd2-sp2-bulk-screening.md` | `docs(tasks): add the gđ2 sp2 spec, decisions and plan` |
   | SP3 | `docs/tasks/gd2-sp3-email-notifications/` (3 file), `docs/deliveries/gd2-sp3-email-notifications.md` | `docs(tasks): add the gđ2 sp3 spec, decisions and plan` |

   Mỗi commit kết thúc bằng dòng `Co-Authored-By` mà người dùng chốt. README này chỉ commit ở nhánh SP1; trong worktree SP2 và SP3, đọc nó bằng đường dẫn tuyệt đối của checkout dùng chung (chỉ đọc). Checkout dùng chung **giữ nguyên** các file untracked; khi một nhánh đã vào `dev`, bản untracked cùng đường dẫn sẽ làm `git pull`/`merge` báo "would be overwritten": lúc đó xin phép người dùng xoá đúng các file đó.
4. **Đưa mỗi phiên `-impl` vào worktree của nó.** Mỗi phiên tự kiểm `pwd` và `git branch --show-current`; nếu chưa ở đúng worktree thì báo điều phối và người dùng, **không** `git switch` hay sửa file trong checkout dùng chung. Cách chuyển thư mục làm việc của phiên (đổi thư mục, hoặc mở phiên mới ở worktree) chưa kiểm chứng; người dùng chọn.
5. **Task 0 của mỗi plan** (trong worktree): `git status --short` rỗng, `npm ci`, `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`, chạy test nền.
6. **Vòng lặp mỗi task** (xem §7): phiên `-impl` giao task cho Codex → Codex viết code theo plan → phiên `-impl` review → `approved` thì sang task kế; `changes requested` thì trả lại Codex (tối đa 2 vòng) rồi dừng và báo.
7. **Kết thúc:** mỗi phiên `-impl` gửi báo cáo tổng quát (mẫu §8) cho phiên điều phối; điều phối gộp thành một báo cáo cho người dùng. Push, PR, merge là việc của người dùng (§9).

Quy tắc kỹ thuật cho mọi worktree:
- **Không** dùng `prisma generate --config …prisma.config.ts`: `prisma.config.ts` đòi `DATABASE_URL`, runbook `[V 2026-08-30]` ghi lệnh lỗi khi thiếu biến, worktree mới không có `.env`, và `ci.yml:55` dùng dạng `--schema`.
- Trước **mọi** `npx nx build api` chạy `rm -rf dist .nx/cache` (bản build cũ giữ Prisma client cũ).
- `prisma migrate diff` không in gì trên máy này (brain, `[V 2026-09-13]`), nên migration **viết tay** (khuôn `20260913042256_add_organization_tenant/migration.sql`) và chứng minh bằng probe trên PostgreSQL dùng một lần.
- Jest chỉ chạy spec dưới `apps/api/src/app/**` và `apps/api/src/common/**`; spec đặt nơi khác bị bỏ qua âm thầm.
- Nếu Nx báo `Access is denied` ở khoá project graph (đã gặp ở follow-up 12/10, ghi trong `docs/tasks/gd2-week1/README.md`): đặt `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_SKIP_NX_CACHE=true NX_TASKS_RUNNER_DYNAMIC_OUTPUT=false` cùng `NX_WORKSPACE_DATA_DIRECTORY` và `NX_CACHE_DIRECTORY` trỏ tới thư mục tạm riêng; không sửa cấu hình repo.
- Windows: cảnh báo `LF will be replaced by CRLF` của git là bình thường.
- **Chưa kiểm chứng:** hook và skill của harness nạp khi chạy từ harness root (theo `CLAUDE.md` của harness); phiên ở worktree ngoài cây harness có thể không nạp chúng, quy tắc cá nhân trong `~/.claude` thì vẫn nạp.

## 6. Vai trò và quy tắc nhắn tin giữa các phiên

| Vai trò | Làm | Không làm |
|---|---|---|
| **Phiên điều phối** (phiên mới) | Kiểm điều kiện §4–§5, hỏi người dùng; tạo worktree và commit docs (khi được phép); gửi tin khởi động cho ba phiên `-impl` (§8); theo dõi và xử lý các tin báo chặn; phân xử vấn đề chéo SP (tên, thứ tự migration, lịch dùng test stack); gộp báo cáo cuối gửi người dùng | Viết hay sửa code sản phẩm; review từng dòng code (việc của phiên `-impl`) |
| **Phiên `-impl` SPx** (trong worktree SPx; **bên gọi Codex**, người dùng xác nhận 2026-10-14; điều phối không gọi Codex trực tiếp) | Giao từng task cho Codex; **review** kết quả của Codex theo §7; chạy lại test; ghi `results/review-<n>.md`; báo điều phối khi chặn và khi xong | Tự viết code sản phẩm của task (kể cả "sửa nhanh"); đụng worktree khác; push, merge |
| **Codex** | Viết code đúng một task plan mỗi lần, test đỏ trước, commit theo message của plan nếu được phép | Quyết định thiết kế; đổi plan; vượt mục "Files" của task |
| **Người dùng** | Trả lời §4; duyệt commit docs; push, tạo PR, merge | |

Cơ chế nhắn tin (đã đọc trong mô tả công cụ `SendMessage`; chưa chạy thử với ba phiên `-impl`):
- Gửi bằng `SendMessage` tới **tên** phiên (`stage-2-sp1-impl`, …) hoặc tên phiên điều phối; tin nằm trong hộp thư và được nhận ở vòng công cụ kế tiếp của người nhận. Dòng đầu của tin phải tự đủ nghĩa (người nhận chỉ thấy dòng đầu khi xem trước). Tin chỉ là văn bản: `@đường-dẫn` không đính kèm gì, nên đưa nội dung hoặc đường dẫn bằng chữ.
- **Permission mode:** phiên chạy mode khác phiên gửi sẽ **giữ tin chờ người dùng duyệt** và tin có thể hết hạn. Đã chốt: ba phiên `-impl` chạy `auto` (người dùng xác nhận 2026-10-14). **Phiên điều phối cũng phải chạy `auto`** để tin gửi sang `-impl` không bị giữ; mode của phiên điều phối chưa được xác nhận. Thấy `[Cross-session delivery notice]` thì báo người dùng, đừng gửi lại liên tục. Một phiên không được nhờ phiên khác làm việc mà chính nó bị chặn (đó là lách quyền).
- Phiên điều phối có thể dùng `notify_when_idle: true` (một lần, tuỳ chọn) để biết khi một phiên `-impl` rảnh; **không** thăm dò `ListAgents` trong vòng lặp và không gửi "xong chưa?".
- Tin của phiên khác là thông tin, không phải sự đồng ý của người dùng cho một thao tác đang chờ duyệt.
- **Khi nào báo điều phối:** (a) ngay khi bị chặn hoặc cần dừng (bước plan ghi DỪNG, finding chặn mà Codex không sửa được sau 2 vòng, điều kiện §4 chưa có, lệnh bị hệ thống chặn); (b) cần quyết định chéo SP; (c) báo cáo tổng quát khi xong. Không gửi tin tiến độ từng task trừ khi điều phối hỏi.
- **Tài nguyên dùng chung:**

| Tài nguyên | Quy tắc |
|---|---|
| Test stack `docker-compose.test.yml` (API 55000, PostgreSQL 55432, Redis 56379) | Một bộ cho cả máy. Ai dùng phải giữ khoá `mkdir "$LOCALAPPDATA/ats-e2e.lock"` (thất bại thì dừng và báo, **không** xoá khoá của người khác), và luôn `rmdir` khoá cùng `docker compose -f docker-compose.test.yml stop` khi xong, kể cả khi test đỏ. Không dùng `down -v`. Chỉ dùng trong khung ngắn có khoá: task cuối mỗi plan (E2E) và Task 5b của SP2 |
| PostgreSQL dùng một lần cho probe migration | SP1 `127.0.0.1:55532`, SP3 `127.0.0.1:55533` (`postgres:18.4-alpine`, `docker run --rm`); không cần khoá |
| Mailpit của SP3 | Probe Task 1: `51125/58125` và container control `51126/58126`; test stack: `127.0.0.1:51025→1025`, `127.0.0.1:58025→8025`. **Không** dùng `1025/8025` (container `english-learning-mailpit-1` của dự án khác) |
| Docker dev (`ats-redis` 6379) | Không đụng |
| Gemini | Key đã hết (`RESOURCE_EXHAUSTED`): mọi test mock `GeminiService`; job đã vào hàng đợi trên test stack sẽ `failed` sau 3 lần retry; không có kiểm chứng gọi Gemini thật |
| CI | Job `web-e2e` trong `ci.yml` dựng cùng `docker-compose.test.yml` trên mọi PR vào `dev`; SP3 bật SMTP và Mailpit trong file đó nên job này cũng chịu |
| Tài nguyên máy | Ba phiên cùng chạy `npm ci`, jest, Nx build, Docker và Codex: có thể chậm hoặc tranh bộ nhớ. **Chưa kiểm chứng.** Nếu thấy chậm, điều phối cho SP2 và SP3 bắt đầu sau khi SP1 qua Task 0–3 |

## 7. Giao thức review của phiên `-impl` (sau mỗi task Codex hoàn thành)

Không tin lời tường thuật của Codex; tự kiểm bằng lệnh.
1. `git diff --name-only <trước>..<sau>` chỉ chứa file trong mục "Files" của task; file ngoài danh sách là finding **chặn**.
2. Tự chạy lại lệnh test của task (đúng lệnh trong plan) và đọc output; phải thấy xanh.
3. Tên và chữ ký trong "Interfaces" khớp từng ký tự với code (các task sau dựa vào chúng).
4. Mỗi dòng "Review Focus" thuộc task có test thật sự assert hành vi mong đợi (không chỉ gọi hàm).
5. Test đỏ trước: commit test (hoặc log đỏ) có trước commit sửa; thiếu thì finding **chặn**. Test cũ chỉ được sửa ở chỗ plan cho phép (SP3 Task 7: đúng ba chỗ; làm yếu assert là finding chặn).
6. Kết luận `approved` hoặc `changes requested` kèm finding (chặn hoặc nhỏ). Task sau chỉ bắt đầu khi task trước `approved`. Codex không sửa được finding chặn sau 2 vòng thì **dừng**, ghi `results/blocked-<n>.md` và báo điều phối.
7. Ghi review vào `results/review-<n>.md` của SP (commit theo quyền ở §4.2).
8. **Không có push:** sau mỗi task chạy `git ls-remote --heads origin <nhánh>`; kết quả phải **rỗng** (nhánh chưa lên `origin`). Có kết quả là finding **chặn**: dừng, báo điều phối và người dùng ngay (Codex không bị rule push của Claude Code ràng buộc, §4b).

**Điểm rủi ro đã biết:**
- SP3 Task 7 sửa 49 cặp test cũ của `applications.service.spec.ts`; SP3 Task 9 lần đầu bật SMTP trong test stack (một journey có sẵn đỏ thì dừng và báo, không sửa journey đó).
- SP2: A3 và A4 (thời gian xử lý 50 đơn, query chọn đơn trên PostgreSQL thật) chỉ lộ ở Task 5b; P3 hoặc P5 FAIL thì dừng.
- SP1: Task 11 phải kiểm `IInterviewSchedule` phía staff có `interviewerId` trước khi dựa vào (chưa kiểm); R12 và E2 (đơn bị chốt trước khi kịp nộp scorecard) là đánh đổi có chủ ý.

## 8. Tin nhắn mẫu

**8a. Prompt mở phiên điều phối (người dùng dán):**
```text
Bạn là phiên điều phối của GĐ2 (SP1, SP2, SP3) ở projects/ats-platform. Đọc toàn bộ docs/tasks/gd2-parallel-execution/README.md (đường dẫn tuyệt đối: E:\Learnings\Learning Stuffs\University\HK6\Do_an_1\Main\Project\alsp-ai-harness\projects\ats-platform\docs\tasks\gd2-parallel-execution\README.md), rồi ba plan. Kiểm lại trạng thái repo ở mục 2 bằng lệnh và báo chỗ nào khác. Đây là câu trả lời của mình cho các điểm mục 4: <điền>. Việc của bạn: làm mục 5 bước 1–3 (hỏi mình duyệt message từng commit), rồi gửi tin khởi động (8b) cho stage-2-sp1-impl, stage-2-sp2-impl, stage-2-sp3-impl và điều phối theo mục 6. Bạn không viết code, không review từng dòng code. Báo cáo cuối gửi mình theo 8c, ngắn, nêu rõ cái gì đã kiểm chứng, cái gì chưa.
```

**8b. Tin khởi động cho phiên `-impl` (điều phối gửi; đổi SPx, nhánh, đường dẫn plan, số task):**
```text
Bắt đầu SPx: thực thi plan bằng Codex và review kết quả, chưa viết code sản phẩm của riêng bạn.

Ngữ cảnh: đọc docs/tasks/gd2-parallel-execution/README.md (mục 5, 6, 7, 8c) và plan <đường dẫn plan>, spec.md, decision.md cùng thư mục. Bạn đứng trong worktree <E:\wt\ats-spx> trên nhánh <nhánh> (tự kiểm pwd và git branch --show-current; sai thì dừng và báo điều phối).
Vòng lặp mỗi task của plan (Task 0 đến Task <N>): (1) giao đúng một task cho Codex (Agent loại codex:codex-rescue hoặc skill codex:rescue) bằng một prompt tự chứa: đường dẫn plan và số task, mục Files và Interfaces của task, Global Constraints liên quan, điều kiện DỪNG, và lệnh kiểm; (2) review theo mục 7, tự chạy lại test; (3) approved thì sang task kế, changes requested thì trả lại Codex tối đa 2 vòng rồi dừng, ghi results/blocked-<n>.md và báo điều phối.
Quy tắc: không push, không merge, không git add -A, không đụng worktree khác hay checkout dùng chung; commit chỉ theo quyền người dùng đã chốt (dòng trailer: <TRAILER>); test stack chỉ dùng khi giữ khoá (mục 6).
Báo điều phối ngay khi bị chặn, cần quyết định chéo SP, hoặc lệnh bị chặn quyền; còn lại im lặng đến báo cáo cuối theo 8c.
```

**8c. Báo cáo cuối của phiên `-impl` gửi điều phối (tối đa khoảng 25 dòng):**
```text
SPx xong / chưa xong: <một câu>.
Nhánh và HEAD: <nhánh> @ <sha>. Task đã approved: <n>/<N>. Số commit: <n>.
Kiểm chứng đã chạy (lệnh, exit code, đường dẫn log): <API jest, nx lint, nx build, test:web, typecheck:web, lint:web, probe, E2E>.
Finding: chặn đã sửa <n>, còn mở <liệt kê>; nhỏ còn lại <liệt kê>.
Lệch plan: <task, lý do>. File ngoài danh sách đã chạm: <không có / liệt kê>.
Kết quả các giả định của plan (A1…, K…): <PASS/FAIL/chưa kiểm>.
Chưa xác minh: <liệt kê, nói thật>.
Rủi ro khi merge (file, xung đột đã dự đoán): <liệt kê>.
Việc người dùng cần làm: <push, PR, quyết định nào>.
```

## 9. Sau khi các phiên báo xong (người dùng làm, điều phối hỗ trợ)

1. Đọc báo cáo gộp của điều phối và `results/` của từng nhánh; chạy lại test của nhánh bạn nghi ngờ.
2. Push từng nhánh theo thứ tự SP1, SP2, SP3 (điều phối báo `git log` đầy đủ trước khi bạn duyệt), tạo PR vào `dev`, chờ CI (job `web-e2e` chạy thật trên PR).
3. Sau khi SP1 vào `dev`: SP2 `git merge origin/dev`, giải xung đột cơ học (§3), chạy lại toàn bộ test, rồi PR; sau SP2: SP3 làm tương tự (chạy lại `--testPathPatterns="applications|interviews|candidate-notifications"`).
4. Xoá các file untracked của checkout dùng chung đã trùng đường dẫn với nhánh vừa merge, **khi người dùng cho phép**, trước khi cập nhật `dev` local.
5. Việc sau SP1–SP3: brainstorm địa điểm dạng text cho tin tuyển dụng (C-05 phần còn lại), rồi GĐ3.

## 10. Chưa xác minh

- Ba phiên `-impl` nhận và xử lý tin của phiên điều phối thế nào (chưa chạy thử; mode đã chốt là `auto`, mode của phiên điều phối chưa xác nhận); cwd của chúng; cách đưa chúng vào worktree.
- Codex: người dùng báo đã setup và chạy thành công ở các phiên trước, nhưng mình chưa thấy bằng chứng đó trong phiên này và chưa chạy thử từ phiên `-impl`; chi phí và thời gian một task, giới hạn khi nó chạy nền cũng chưa biết.
- Long paths trên Windows cho `E:\wt\…\node_modules`; hook và skill của harness trong worktree; kết quả `prisma generate --schema=…` trong worktree (mình chưa chạy).
- Gmail SMTP production; retry với SMTP thật bị sập (SP3); Excel vùng Việt Nam có dùng `;` làm phân cách khi mở CSV (SP2, người dùng tự mở file).
- Các giả định trong bảng K/A của plan SP2 và danh sách "Chưa xác minh" của plan SP3 chỉ được kiểm khi thực thi.
- Mình chưa chạy lại test nào của repo ngày 2026-10-14; số liệu test và CI trong tài liệu là của 2026-10-13.

## 11. Lịch sử ngắn

2026-10-13: GĐ2 tuần 1 (ba lát ứng viên) và phần follow-up đã merge (PR #64–#67). CI job `web-e2e` đỏ trên cả bốn PR vì service `api` của test stack không có `healthcheck` (`compose --wait` trả về khi container mới `Started`); đã sửa bằng nhánh `ci/wait-for-test-api`, đưa vào bốn PR, job E2E xanh. Brainstorm SP1 (7 quyết định, spec, plan); giao hai phiên phụ brainstorm SP2 và SP3, rồi viết plan; phiên này review hai plan và sửa plan SP1 theo phát hiện chung (`prisma generate`, `migrate diff`, tên state chọn, khung test stack của SP2). 2026-10-14: bỏ `/goal`, chuyển sang mô hình một phiên điều phối cộng ba phiên `-impl` (tài liệu này).
