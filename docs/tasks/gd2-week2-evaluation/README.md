# GĐ2 SP1 — đánh giá ứng viên (scorecard, ghi chú, so sánh): kết quả

**Ngày:** 2026-10-14 · **Nhánh:** `feat/gd2-sp1-evaluation` (worktree `E:\wt\ats-sp1`, cắt từ `origin/dev` `93ad69b`, chưa push) ·
**Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md) · **Quyết định:** [decision.md](decision.md) · **Review từng task:** [results/review-*.md](results/)

Cách làm: phiên `stage-2-sp1-impl` giao từng task cho Codex, review bằng lệnh, rồi tự commit theo hai pha (test đỏ → code xanh).
Từ Task 10, Codex chạy các lệnh kiểm và ghi log vào `results/`; phiên `-impl` đọc log. Docker, test stack và Nx do phiên
`-impl` chạy vì sandbox của Codex không chạy được chúng (ngoại lệ được điều phối duyệt).

## Kết quả chạy cuối (Task 12)

| Lệnh | Ai chạy | Kết quả | Log |
|---|---|---|---|
| `npx jest --config apps/api/jest.config.ts --runInBand --silent` | Codex | 69 suite, 609/609 pass | [task-12-final-api-jest.log](results/task-12-final-api-jest.log) |
| `npx nx lint api --skip-nx-cache` (biến Nx theo README điều phối §5) | phiên `-impl` | exit 0 — 0 error, 308 warning (xem rủi ro 6) | [task-12-final-api-lint.log](results/task-12-final-api-lint.log) |
| `rm -rf dist .nx/cache` rồi `npx nx build api --skip-nx-cache` | phiên `-impl` | exit 0, webpack compiled successfully | [task-12-final-api-build.log](results/task-12-final-api-build.log) |
| `npm run test:web` | Codex | 56 file, 356/356 pass | [task-12-final-test-web.log](results/task-12-final-test-web.log) |
| `npm run typecheck:web` (gồm `e2e/**` qua `tsconfig.spec.json`) | Codex | exit 0 | [task-12-final-typecheck-web.log](results/task-12-final-typecheck-web.log) |
| `npm run lint:web` (`--max-warnings 0`) | Codex | exit 0 | [task-12-final-lint-web.log](results/task-12-final-lint-web.log) |
| `TZ=UTC npm run test:e2e:web` trên `docker-compose.test.yml` (API 55000, DB `ats_test`) | phiên `-impl` | **34/34 pass** trong 5.0m, không retry/skip/flaky; 4 test SP1 pass | [task-12-e2e.log](results/task-12-e2e.log) |
| Probe ràng buộc DB trên PostgreSQL dùng một lần (Task 2) | phiên `-impl` | đỏ 16/16 trước migration → xanh 16/16 sau | [probe-scorecard-constraints.log](results/probe-scorecard-constraints.log) (bản xanh; bản đỏ trong commit `a935b00`) |

Test stack: khoá `$LOCALAPPDATA/ats-e2e.lock` được giữ trong lúc chạy, sau đó `docker compose … stop` và `rmdir`. DB test
có migration `20261014000000_add_interview_scorecards_and_application_notes` (đọc `_prisma_migrations`).

## Tiêu chí → bằng chứng

| Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|
| C1 interviewer nộp → tạo; nộp lần hai → sửa cùng bản ghi | `interview-scorecards.service.spec.ts` › *creates…*, *updates the same row on a second submit*; E2E *A nộp đánh giá … đọc lại sau reload* | pass |
| C2 người đặt lịch, org_admin khác, platform admin, ứng viên → 403 | service spec › *refuses the scheduler…* (recruiter + org_admin), *refuses a platform admin…*, *refuses a candidate*; `no-candidate-access.spec.ts` (roles của 8 route) | pass |
| C3 lịch `scheduled`/`cancelled` → 409 | service spec › *refuses a scheduled or cancelled schedule* | pass |
| C4 đơn đã chốt: PUT → 409, GET vẫn đọc | service spec › *refuses an application that is hired, rejected or cancelled*, *reads still work once the application is closed* | pass |
| C5 điểm 0/6/3.5/thiếu → 400; DB từ chối 0 và 6 | `dto/upsert-scorecard.dto.spec.ts`; probe `CHECK` cả 4 cột (23514) + đối chứng 1 và 5 | pass |
| C6 hai scorecard cùng `interviewId` bị DB từ chối | probe UNIQUE (23505) | pass |
| C7 tổ chức khác → 404 ở endpoint mới; recruiter khác khoa → 403 | `tenant-caller.spec.ts`; *answers 404…* trong spec scorecard, ghi chú, so sánh; *refuses a recruiter of another department* (helper mock trả 403) | pass (khoa: unit với helper mock, xem rủi ro 4) |
| C8 payload ứng viên không có scorecard/ghi chú; route trả 403 | `candidate-payload-no-evaluation.spec.ts` (select export), `no-candidate-access.spec.ts`; E2E *Ứng viên nhận 403 … payload đơn không lộ khoá nội bộ* | pass một phần — xem rủi ro 3 |
| C9 quyền ghi chú R9; `body` rỗng/quá dài → 400 | `application-notes.service.spec.ts`, `dto/note.dto.spec.ts`; E2E *B … thêm ghi chú* | pass |
| C10 xoá đơn → ghi chú bị xoá | probe CASCADE (1 → 0) | pass |
| C11 so sánh 2–4 id không trùng thuộc tin; sai → 400; tin tổ chức khác → 404; thiếu screening → `null` | `application-comparison.service.spec.ts` (service + DTO) | pass |
| C12 so sánh không ghi, không xếp hạng | spec › *has no ranking field and performs no write* (mọi mock ghi của mọi model) | pass |
| C13 xoá lịch có scorecard → 409; không có → xoá như cũ | `interviews.service.spec.ts` › `removeSchedule` (3 test); probe FK `RESTRICT` (**23001**, xem lệch 1) | pass |
| C14 web: form, khoá khi chốt, sửa/xoá ghi chú của mình, chọn 2–4, bảng so sánh, ứng viên bị chặn `/jobs/:id/compare` | `ScorecardForm`, `ScorecardPanel`, `NotesPanel`, `CandidateTabs`, `CompareBar`, `CandidateRow`, `CandidatesFilters`, `CompareTable`, `compare/page`, `ScheduleDetailDrawer` tests; `role-policy.test.ts` (có đối chứng recruiter) | pass |
| C15 hành trình thật | `apps/web/e2e/gd2-evaluation.e2e.ts` (4 test) trên test stack | pass |

### Edge case

| # | Bằng chứng | Kết quả |
|---|---|---|
| E1 interviewer bị vô hiệu hoá | không có code mới; đọc vẫn đúng | chưa kiểm riêng |
| E2 đơn sang `hired` trước khi nộp | R3 test (409) | pass |
| E3 hai PUT gần như đồng thời | upsert theo khoá unique (unit) + UNIQUE ở DB (probe) | pass; **chưa chạy hai request đồng thời thật** |
| E4 lịch bị huỷ sau khi có scorecard | hành vi FSM có sẵn | không có task |
| E5 đơn `cancelled` trong so sánh | spec › *keeps a cancelled application in the comparison* | pass |
| E6 không có screening | spec › *gives screening null and null averages…*; `CompareTable` "chưa có" | pass |
| E7 `ids` không phải UUID | DTO test | pass |
| E8 ghi chú bị xoá ở máy khác | `findUnique` null và `P2025` → 404 (unit) | API pass; UI "báo và tải lại" chưa có test riêng |
| E9 chọn 5 | `CompareBar` test | pass |
| E10 xoá ghi chú người khác | *lets only the author delete* (403) | pass |
| E11 recruiter khác khoa | unit (helper mock 403); `ScorecardPanel` › *a recruiter of another department still sees no scorecard* | pass (unit) |

## Lệch plan và ngoại lệ đã duyệt (điều phối và người dùng)

1. **Plan sai SQLSTATE:** FK `ON DELETE RESTRICT` trả **23001** (restrict_violation), không phải 23503 (của NO ACTION). Probe đã commit được sửa giá trị mong đợi, vẫn assert mã **và** tên constraint (`0834ebe`); giữ `onDelete: Restrict` theo spec.
2. **Commit do phiên `-impl` làm** (sandbox Codex không ghi được `.git/worktrees/ats-sp1`), hai pha mỗi task, không trailer.
3. **Sửa test đã commit vì giả định sai (không xoá hay nới assert):** `ScorecardForm` tách vòng lặp 5 case thành `it.each` (`2406e03`, đổi cấu trúc, `git diff -w` chỉ đổi phần mở đầu); drawer `toBeVisible` bọc trong `waitFor` vì framer-motion `initial opacity 0` và guard thay `!` trong `CompareTable.test.tsx` (`44049cf`).
4. **File ngoài mục Files (Task 11):** `components/interview-schedule/InterviewScheduleClient.tsx`, `app/(recruiter)/interviews/page.tsx` (truyền `currentUserId` cho drawer), `types/interfaces/application.interface.ts` (`jobId?` trong `jobPosting`) — chỉ cộng thêm. `role-policy.test.ts` là file **mới** (plan ghi "modify").
5. **Lỗi sản phẩm phát hiện ở Task 12:** recruiter cùng khoa không phải interviewer/người đặt lịch không thấy scorecard trong tab đánh giá (API `schedules/my` của recruiter chỉ trả lịch của mình). Fixture E2E ban đầu của Codex che lỗi này (cho B làm người đặt lịch). Đã sửa: test đỏ `080c448`, fix `b4da299`, fixture cho A đặt lịch.
6. **Docker/test stack và Nx do phiên `-impl` chạy** (sandbox Codex).

## Chưa xác minh / rủi ro

1. **Giao diện chưa ai xem bằng mắt** trong trình duyệt (chỉ có Playwright journey và Vitest). Chưa chụp ảnh desktop/mobile.
2. **CI chưa chạy** (chưa push). Job `web-e2e` của CI sẽ chạy cùng `docker-compose.test.yml`.
3. **Payload ứng viên:** E2E chỉ kiểm `GET /applications/my`; `applications/:id`, `:id/history`, `schedules/my` chỉ được kiểm qua các select/include **được export**, còn phần ghép include **inline** trong service chưa có kiểm.
4. **Ranh giới khoa** ở service mới được unit test với helper bị mock (logic khoa thật có test riêng trong `applications.service.spec.ts`/`interviews.service.spec.ts`); E2E chỉ có ca dương (B cùng khoa), không có ca âm khác khoa.
5. **Nút "Sửa đánh giá" chỉ cho tác giả** (thêm ở bản sửa Task 12): chưa có test riêng; API vẫn cho interviewer hiện tại `PUT`, nên UI chặt hơn API khi interviewer bị đổi sau khi đã có scorecard.
6. **API lint 308 warning** (0 error). SP1 thêm warning ở `application-comparison.service.ts:128` (non-null assertion) và `as any` trong 3 file spec mới; baseline trước SP1 chưa đo.
7. **Không kiểm drift** giữa `schema.prisma` và `migration.sql` viết tay (`prisma migrate diff` không in gì trên máy này); probe chỉ phủ ràng buộc.
8. **Test `ScorecardForm` sát trần thời gian** khi máy tải nặng: mỗi case 1,6–2,3 s, đo trước đó vòng khởi động 2,8–3,1 s → biên ~2 s trên trần 5 s. Mâu thuẫn chưa giải thích: `user.type` đo được ~46% thời gian mỗi vòng nhưng thay bằng `paste` không làm tổng giảm (hai lượt đo ở mức tải khác nhau).
9. **"Access is denied" khi Nx tạo khoá trong sandbox Codex** là giả thuyết chưa chứng minh; đã chạy Nx ngoài sandbox với thư mục dữ liệu tạm riêng.
10. **Gemini:** E2E seed screening trực tiếp, không gọi Gemini thật.
11. **Rủi ro khi merge** (SP1 → SP2 → SP3): `CandidatesFilters`/`CandidateRow` (cùng hunk với SP2; ô "Chọn tất cả" của SP1 bị `disabled` khi không có dòng), `applications.module.ts`/`applications.controller.ts` (SP2), `interviews.service.ts` `removeSchedule` (SP3), `enums.ts` và `unit-test-helpers.ts` (SP3), dòng quan hệ ngược cuối `Organization`/`User`/`Application` trong `schema.prisma`, thứ tự migration.
