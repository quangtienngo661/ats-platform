# Review — Task 11 (liên kết ở drawer lịch, chọn 2–4 và trang so sánh)

## Kiểm `interviewerId` (rủi ro plan ghi "chưa kiểm")

- Có: web type `apps/web/src/types/interfaces/interview.interface.ts:16`; API giữ scalar qua `apps/api/src/app/interviews/interviews.service.ts:397` (`scheduleIncludeOptions` không omit, `apps/api/src/common/utils/include-options.util.ts:145`). Đọc code, chưa gọi API thật (Task 12 sẽ chạy).
- Thiếu hai chỗ plan không nói tới: (a) drawer chưa nhận `currentUserId` — `app/(recruiter)/interviews/page.tsx:78` có `me` nhưng `InterviewScheduleClient.tsx:136` không truyền; (b) web type `IApplicationDto.jobPosting` thiếu `jobId` (`application.interface.ts:17`) dù API trả (`include-options.util.ts:154`, `schema.prisma:347`).

## Pha 1 — test

- Codex viết: `CompareBar.test.tsx`, `CompareTable.test.tsx`, `CandidateRow.test.tsx`, `CandidatesFilters.test.tsx`, `compare/page.test.tsx`, `role-policy.test.ts` (**file MỚI**, plan ghi "modify"); sửa `ScheduleDetailDrawer.test.tsx` (chỉ fixture thêm `jobPosting.jobId` và helper render thêm prop `currentUserId`; không xoá assert — 3 dòng xoá đều là fixture/helper).
- Codex chạy, phiên `-impl` đọc `task-11-phase1-test-web.log`: 56 file, 354 test, 6 fail / 348 pass; 347 test cũ pass. 6 test mới đỏ đúng lý do (thiếu module CompareBar/CompareTable/compare page; không có checkbox "Chọn …"/"Chọn tất cả"; không có link đánh giá). "a candidate is blocked from /jobs/:id/compare" pass sẵn, có đối chứng recruiter.
- Commit `81d2886 test(web): add the selection, comparison and drawer link behaviour`.

## Pha 2 — code

- File ngoài mục Files, **điều phối và người dùng duyệt** (chỉ cộng thêm): `components/interview-schedule/InterviewScheduleClient.tsx` (truyền `currentUserId`), `app/(recruiter)/interviews/page.tsx` (truyền `me?.userId ?? ''`; cần vì `me` chưa tới client), `types/interfaces/application.interface.ts` (thêm `jobId?: string` vào `jobPosting`).
- Lần 1 (Codex chạy, log `task-11-phase2-*.log`): `test:web` 353/354, `typecheck:web` exit 0, `lint:web` 0 lỗi 1 cảnh báo (exit 1). Hai lỗi nằm ở **test pha 1 đã commit**, phiên `-impl` bỏ sót khi review pha 1:
  1. `drawer shows the evaluation link …`: `toBeVisible()` fail dù link render đúng `href` — drawer có framer-motion `initial={{ x: 360, opacity: 0 }}` (`ScheduleDetailDrawer.tsx:73-75`), jsdom chưa chạy animation lúc assert đồng bộ.
  2. `@typescript-eslint/no-non-null-assertion` ở `CompareTable.test.tsx:83` (`item.screening!`).
- Sửa đã duyệt (điều phối và người dùng), chỉ 2 file test, không xoá hay nới assert:
  ```diff
  -import { render, screen } from '@testing-library/react';
  +import { render, screen, waitFor } from '@testing-library/react';
  -  it('drawer shows the evaluation link only to the interviewer of a completed interview', () => {
  +  it('drawer shows the evaluation link only to the interviewer of a completed interview', async () => {
  -        expect(link).toBeVisible();
  +        await waitFor(() => expect(link).toBeVisible());
  ```
  ```diff
  -      const screening = item.screening!;
  +      const screening = item.screening;
  +      if (!screening) throw new Error('fixture must have screening');
  ```
  Phương án (1a) `waitFor` qua ngay lần đầu; **không** dùng (1b) `toBeInTheDocument`, nên assert không bị nới.
- Lần 2 (Codex chạy, phiên `-impl` đọc log `task-11-fix-*.log`, NODE_OPTIONS rỗng, tuần tự): drawer file 5/5 (test link 205 ms); `npm run test:web` 56/56 file, 354/354 test; `npm run typecheck:web` không có `error TS`; `npm run lint:web` không in cảnh báo/lỗi (đối chứng: log lần 1 có in cảnh báo, nên công cụ hiện cảnh báo khi có). Mọi file được ghi trước 10:54:37, log chạy từ 10:54:55 → log là kết quả của code hiện tại.
- Job Codex này hoàn tất nhưng subagent bị ngắt (hết hạn mức) trước khi báo về; phiên `-impl` lấy kết quả bằng `codex-companion result`.
- Review code: chỉ các file trên; state chọn khớp từng ký tự (`CandidatesFilters.tsx:25` `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`); checkbox dòng `aria-label={\`Chọn ${name}\`}`, không bao giờ `disabled`; `CompareBar` 2–4, ≥5 tắt kèm "Chọn tối đa 4 ứng viên để so sánh"; `CompareTable` nhãn AI "(gợi ý)", có `overflow-x-auto`, không xếp hạng; trang so sánh có "Quay lại danh sách"; drawer chỉ hiện link khi `completed && interviewerId === currentUserId`.
- Điểm có thể xung đột khi merge với SP2 (cùng hunk `CandidatesFilters`): ô tiêu đề "Chọn tất cả" bị `disabled` khi không có dòng nào (giữ theo điều phối).
- Commits: `44049cf test(web): fix the drawer link and comparison test assumptions`, `6374461 feat(web): compare candidates and link the interviewer to the evaluation tab`.
- Bản ghi job Codex cũ của Task 10 (`task-mv7a402s-oo4j3r`, tiến trình đã chết) đã được huỷ (`cancelled`) bằng `MSYS_NO_PATHCONV=1 … cancel` sau khi lần trước hỏng vì Git Bash đổi `/PID`.
- Giao diện chưa xem bằng mắt trong trình duyệt.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
