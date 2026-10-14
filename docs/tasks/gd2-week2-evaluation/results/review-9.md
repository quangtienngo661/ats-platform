# Review — Task 9 (kiểu và server actions web)

- Pha 1: Codex viết `scorecards.action.test.ts` (4), `notes.action.test.ts` (6), thêm describe `compareApplicationsAction` (2) vào `applications.action.test.ts` (test cũ không đổi; thêm mock `next/navigation`).
  - Phiên `-impl` chạy lại `npm run test:web -- src/servers`: 2 file đỏ vì `Cannot find module` (action chưa có), 2 test so sánh đỏ vì `compareApplicationsAction is not a function`, 58 test cũ pass → đỏ đúng lý do.
  - Commit `c2eb45e test(web): add the evaluation server actions`.
- Pha 2: `evaluation.interface.ts` (enum từ `@ats-platform/types`, ngày là string), `scorecards.action.ts`, `notes.action.ts`, `compareApplicationsAction` trong `applications.action.ts`. Không đổi test.
  - `comment` chỉ gửi khi không rỗng sau trim; ghi chú trim và chặn rỗng / > 2000 trước khi gọi API; lỗi ghi qua `actionErrorMessage` (đã có `unstable_rethrow`), lỗi đọc qua `rethrowReadError`.
  - `revalidatePath('/jobs', 'layout')` sau mọi ghi; scorecard thêm `revalidatePath('/interviews')`.
  - Phiên `-impl` chạy lại: `npm run test:web` → 46 file, 336/336; `npm run typecheck:web` exit 0; `npm run lint:web` exit 0 (`--max-warnings 0`).
  - Commit `b4e3435 feat(web): add the evaluation server actions`.
- Finding nhỏ: `getNotesAction` luôn gửi `page` (mặc định 1) dù không truyền; vô hại.
- Codex gọi bằng lệnh đơn, guard cho qua.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
