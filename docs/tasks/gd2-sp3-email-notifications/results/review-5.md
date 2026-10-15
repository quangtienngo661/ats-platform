# Review Task 5 — CandidateNotificationsService (approved, 1448b67 + eda0a0b)

- Files: pha 1 `schedule-changes.spec.ts`, `candidate-notifications.service.spec.ts`, `unit-test-helpers.ts` (+1 dòng `emailNotification`); pha 2 `notification-email.constants.ts`, `schedule-changes.ts`, `candidate-notifications.service.ts`, `candidate-notifications.module.ts`. Không chạm file khác; spec/helper không đổi ở pha 2.
- Đỏ trước: `results/task-5-phase1-jest.log` — 4 lỗi, cả 4 TS2307 (module chưa có). `createQueueMock` đã có `setGlobalRateLimit` nên không lỗi kiểu nào bị che.
- Xanh (Codex chạy, phiên `-impl` đọc log): `task-5-phase2-jest.log` 2 suite, 34/34; `task-5-phase2-grep.log` rỗng (không có `defaultJobOptions`); `task-5-phase2-tsc.log` exit 0. `tsconfig.app.json` có `include: ["src/**/*.ts"]` nên tsc kiểm cả file chưa được import — xác nhận Prisma client mới có `emailNotification` (đóng điểm treo của Task 2).
- Đối chiếu: câu chữ in-app trong test = `applications.service.ts:79-96`; tham số `notificationsService.create` = `:726-733`.
- Review Focus 5 (`treats the same instant as unchanged`) có test thật.
- DI: `NotificationsModule` export `NotificationsService`, `MailModule` export `MailService`; không module nào import ngược `ApplicationsModule`. DI thật chỉ được chứng minh khi module được nối (Task 7/8 build, Task 9 E2E).
- Ghi chú nhỏ (không chặn): không tìm thấy tên interviewer thì `interviewerName` là chuỗi rỗng; khi không có đơn, warn dùng câu "Failed to queue the email…" (test chốt như vậy).
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng.
