# GĐ2 SP3 — Email thông báo tự động cho ứng viên

Spec: [spec.md](spec.md) · quyết định: [decision.md](decision.md) · plan: [plan.md](plan.md).
Nhánh: `feat/gd2-sp3-email-notifications`.

## Tóm tắt

SP3 có 8 loại email cho ứng viên: nhận đơn, đơn sang `interview`, `offer`, `hired`, `rejected`,
và lịch phỏng vấn được tạo, đổi hoặc hủy. Người nhận là ứng viên của đơn.

Bảng `email_notifications` lưu địa chỉ người nhận, payload chụp lúc phát sự kiện và trạng thái gửi.
Queue `notification-email` gửi qua `MailService.sendMail`, dùng id của row làm `jobId`.
Email và in-app được phát sau khi lưu đơn hoặc lịch. Thêm in-app cho sự kiện lịch; câu chữ in-app
của trạng thái đơn giữ nguyên. Email dùng tiếng Việt, giờ Việt Nam và escape giá trị động trong HTML.
Email từ chối dùng câu chung và gộp các lịch bị hủy, không kèm lý do từ chối hay dữ liệu AI.

Test stack có Mailpit riêng. Journey E2E gọi API, đọc email từ Mailpit và kiểm các row đã `sent`.
SP3 không thêm endpoint đọc `email_notifications`. Cơ chế gửi là at-least-once; email có thể lặp
nếu SMTP đã nhận nhưng worker chết trước khi ghi `sent` (R11, E11).

Commits theo `git log --oneline 93ad69b..HEAD`, mới nhất trước:

```text
686fd86 test(e2e): add the candidate email journey on a dedicated mailpit
e2feb22 feat(api): notify candidates of interview schedule changes
f00f5dd test(api): expect schedule changes to notify the candidate
32a7446 feat(api): notify candidates of application events by email
a26d272 test(api): expect the application flow to notify through candidate notifications
47db674 feat(api): send queued candidate notification emails
a516153 test(api): add the notification email processor rules
eda0a0b feat(api): decide and queue candidate notification emails
1448b67 test(api): add the candidate notification rules
4f98426 feat(api): render the candidate notification emails
3b5b69d test(api): add the notification email rendering rules
a418672 feat(api): let the mail service send any rendered email
5a797ee test(api): add the generic mail sending rules
2104549 feat(db): add the email notifications table
39e4b0f test(db): add the email notification constraint probe
141ebbc test(tasks): probe the mailpit auth and search api that sp3 relies on
5eb68ff docs(tasks): add the gđ2 sp3 spec, decisions and plan
```

## Bảng lệnh, kết quả, log

Đây là kết quả các lần chạy đã lưu. Phiên viết README không chạy lại lệnh kiểm chứng.

| Lệnh | Kết quả | Log |
|---|---|---|
| `npx jest --config apps/api/jest.config.ts --runInBand --silent` | 68 suites, 630 tests passed | [results/api-test.log](results/api-test.log) |
| `nx lint api --skip-nx-cache` | 0 errors, 313 warnings: 296 `no-explicit-any`, 17 `no-unused-vars`; không có warning trong file production mới của SP3 | [results/api-lint.log](results/api-lint.log) |
| `nx build api --skip-nx-cache` | `webpack compiled successfully` | [results/api-build.log](results/api-build.log) |
| `npm run test:web` | 44 files, 324 tests passed | [results/web-test.log](results/web-test.log) |
| `npm run typecheck:web` | 0 errors | [results/web-typecheck.log](results/web-typecheck.log) |
| `npm run lint:web` | 0 errors, 0 warnings | [results/web-lint.log](results/web-lint.log) |
| `TZ=UTC npx playwright test --config apps/web/playwright.config.ts gd2-email-notifications` trên test stack | 6 passed | [results/e2e-sp3.log](results/e2e-sp3.log) |
| `TZ=UTC npm run test:e2e:web` trên test stack dựng mới | 36 passed trong 4.6m, không retry, không skip | [results/e2e-full.log](results/e2e-full.log) |
| `node docs/tasks/gd2-sp3-email-notifications/results/probe-email-notifications.js` trên PostgreSQL dùng một lần | Đỏ trước migration: 1 PASS, 10 FAIL. Xanh sau migration: 11 PASS | [đỏ](results/probe-email-notifications-red.log), [xanh](results/probe-email-notifications-green.log) |
| `node docs/tasks/gd2-sp3-email-notifications/results/probe-mailpit.mjs --smtp-port 51125 --api-port 58125 --expect ok` | 7 PASS | [results/early-checks.log](results/early-checks.log) |

Log lint và build đầu tiên là Nx cache replay, chưa phải lần chạy thật. Cả hai đã được chạy lại
với `--skip-nx-cache`; bảng trên dùng log của lần chạy lại. API Nx trên máy này cần
`NX_DAEMON=false`, với `NX_CACHE_DIRECTORY` và `NX_WORKSPACE_DATA_DIRECTORY` trỏ vào trong worktree.
Log lint có cả `no-explicit-any` và `no-unused-vars`, nên không thể ghi toàn bộ warnings là `no-explicit-any`.

## Bảng C1–C15

Các API unit test dưới đây nằm trong lần chạy [api-test.log](results/api-test.log).
Tên test có `%s` hoặc `$status` là tên của test dùng `it.each`.

| Tiêu chí | Bằng chứng | Kết quả |
|---|---|---|
| C1 nhận đơn; nộp lỗi không phát email | [applications.service.spec.ts](../../../apps/api/src/app/applications/applications.service.spec.ts) › *notifies once the application is created, after the transaction*, *does not notify when the application is refused*, *rejects duplicate active applications and unconfirmed CVs*; [candidate-notifications.service.spec.ts](../../../apps/api/src/app/candidate-notifications/candidate-notifications.service.spec.ts) › *records and enqueues application_received with the candidate's current email*; E2E › *nộp đơn gửi email xác nhận tới đúng địa chỉ ứng viên* | unit + E2E pass |
| C2 đúng email và câu chữ in-app theo trạng thái; `screening` không gửi | `candidate-notifications.service.spec.ts` › *sends application_$status with the unchanged in-app copy*, *sends one application_rejected listing the cancelled schedules and no schedule_cancelled*, *does nothing for %s*; E2E › *sang screening không gửi, sang interview gửi email mời phỏng vấn* | unit + E2E pass |
| C3 hoàn tác gửi theo trạng thái đích; về `screening` hoặc `applied` không gửi | `applications.service.spec.ts` › *a revert to interview notifies with the target status*, *allows a genuine revert and still notifies the candidate*; `candidate-notifications.service.spec.ts` › *does nothing for %s* (`screening`, `applied`) | unit pass |
| C4 từ chối chỉ hủy lịch sắp tới và gộp vào email từ chối | `applications.service.spec.ts` › *cancels the upcoming interviews when an application is rejected* (assert `startAt: { gt: now }`), *passes the schedules cancelled by a rejection to the notification*; `candidate-notifications.service.spec.ts` › *sends one application_rejected listing the cancelled schedules and no schedule_cancelled*; E2E › *từ chối gửi một email trung tính liệt kê lịch bị hủy, không lộ lý do* và test tổng số email | unit + E2E pass |
| C5 rút đơn không có email hay in-app | `applications.service.spec.ts` › *withdrawing notifies nobody* | unit pass |
| C6 tạo lịch có email, in-app và đúng giờ Việt Nam | [interviews.service.spec.ts](../../../apps/api/src/app/interviews/interviews.service.spec.ts) › *notifies the candidate after creating a schedule*; `candidate-notifications.service.spec.ts` › *schedule_created creates the interview in-app and the email with the interviewer's name*; [format.spec.ts](../../../apps/api/src/app/candidate-notifications/email/format.spec.ts) › *formats 02:30Z for 60 minutes as 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)*; E2E › *tạo lịch online gửi email có giờ Việt Nam và có thông báo in-app* | unit + E2E pass |
| C7 đổi trường ứng viên thấy có giá trị cũ; không đổi hoặc `completed` không gửi; `cancelled` gửi email hủy | [schedule-changes.spec.ts](../../../apps/api/src/app/candidate-notifications/schedule-changes.spec.ts) › *reports %s when it differs*, *treats the same instant as unchanged*; `candidate-notifications.service.spec.ts` › *sends schedule_updated with only the changed fields as previous*, *uses the old interviewer's name when the interviewer changes*, *sends nothing when no candidate-visible field changed*, *sends nothing when the schedule is completed*, *sends schedule_cancelled when a scheduled interview is cancelled, even with other changes*; [render-notification-email.spec.ts](../../../apps/api/src/app/candidate-notifications/email/render-notification-email.spec.ts) › *schedule_updated lists only the changed fields under Trước đây*; E2E › *đổi giờ gửi email kèm giờ cũ* | unit + E2E pass |
| C8 xóa lịch chỉ gửi khi lịch `scheduled` chưa diễn ra | `interviews.service.spec.ts` › *passes the schedule and the removal time after deleting*; `candidate-notifications.service.spec.ts` › *scheduleRemoved sends schedule_cancelled for an upcoming scheduled interview*, *scheduleRemoved sends nothing for a %s schedule* (`past`, `completed`, `cancelled`) | unit pass |
| C9 không lộ điểm, dữ liệu AI, lý do từ chối hay ghi chú staff | `render-notification-email.spec.ts` › *never prints a score or a rejection reason passed in the payload*; `schedule-changes.spec.ts` › *toScheduleSnapshot keeps only the snapshot fields*; `candidate-notifications.service.spec.ts` assert chính xác query và payload; E2E › *từ chối gửi một email trung tính liệt kê lịch bị hủy, không lộ lý do* | unit + E2E pass |
| C10 tên tin chứa `<script>` được escape trong HTML | `render-notification-email.spec.ts` › *escapes user text in html but keeps it raw in text* | unit pass |
| C11 lỗi thông báo không làm hỏng việc lưu đơn hoặc lịch, có `Logger.warn` | `candidate-notifications.service.spec.ts` › *never rejects when reading the application fails*, *keeps the row pending and logs when enqueueing fails*, *still queues the email when the in-app write fails*; `applications.service.spec.ts` › *notifies once the application is created, after the transaction*; `interviews.service.spec.ts` › *notifies the candidate after creating a schedule*, *passes the schedule before and after an update*, *passes the schedule and the removal time after deleting* | unit pass; bằng chứng một phần, xem ghi chú dưới bảng |
| C12 processor bỏ qua row `sent`/`skipped`; SMTP tắt, lỗi và gửi thành công được ghi đúng | [notification-email.processor.spec.ts](../../../apps/api/src/app/candidate-notifications/notification-email.processor.spec.ts) › *skips a row that is already sent*, *skips a row that is already skipped*, *marks the row skipped when SMTP is disabled*, *records lastError and rethrows on a non-final failure without changing the status*, *marks the row failed and rethrows on the final attempt*, *sends the rendered email to the snapshot address and marks it sent*; [mail.service.spec.ts](../../../apps/api/src/common/mail/mail.service.spec.ts) › *sendMail returns false and creates no transport when SMTP is disabled*, *sendMail lets an SMTP error propagate* | unit pass |
| C13 migration và FK trên PostgreSQL thật | [probe-email-notifications.js](results/probe-email-notifications.js); [log đỏ](results/probe-email-notifications-red.log), [log xanh](results/probe-email-notifications-green.log). Catalog xác nhận user và application dùng `CASCADE`, organization dùng `RESTRICT` | 1 PASS, 10 FAIL trước migration → 11 PASS sau migration |
| C14 hành trình API → queue → Mailpit, đúng người nhận và nội dung, các row `sent` | [gd2-email-notifications.e2e.ts](../../../apps/web/e2e/gd2-email-notifications.e2e.ts) › *GĐ2 SP3 — email thông báo cho ứng viên*, gồm test *tổng cộng đúng 5 email, không có email hủy riêng, mọi row đã sent*; [log journey](results/e2e-sp3.log), [log toàn bộ](results/e2e-full.log) | 6 passed trong journey và trong suite toàn bộ |
| C15 ứng viên `inactive`: row `skipped`, không enqueue, vẫn có in-app | `candidate-notifications.service.spec.ts` › *skips an inactive candidate* | unit pass; R17 vẫn là ASSUMPTION chờ người dùng |

C11 có mock cho lỗi đọc đơn, enqueue và ghi in-app, cùng các assert thứ tự gọi notifier sau khi lưu.
Chưa có test riêng làm `emailNotification.create` ném lỗi hoặc gọi request thật trong các tình huống lỗi này.
C13 kiểm FK qua catalog; probe không thực hiện thao tác xóa user, application hay organization.

## Ghi chú vận hành

- Lần E2E toàn bộ đầu có 35 passed và 1 failed. Test `ai-configuration.e2e.ts:173` vẫn ở trang
  admin sign-in; trang hiện `ThrottlerException: Too Many Requests`. Login giới hạn 5 lần trong
  60 giây, counter nằm trong Redis của test stack. Theo [overnight-report.md](results/overnight-report.md),
  lần đó bắt đầu khoảng 16 giây sau journey SP3 riêng. Một lần chạy toàn bộ trên stack dựng mới
  đã pass 36/36 ([e2e-full.log](results/e2e-full.log)). Không chạy các suite E2E liền nhau trong vòng 60 giây.
- API container chạy `prisma migrate deploy` khi khởi động. Volume DB test dùng chung hiện có cả
  `20261014000000` của SP1 và `20261015000000` của SP3. Lần deploy đó không cảnh báo hay lỗi khi
  migration đã có trong DB nhưng thiếu ở thư mục local. Đây là quan sát từ `_prisma_migrations`
  và log container, được ghi trong [overnight-report.md](results/overnight-report.md).
- `apps/web/e2e/support/prepare-local.mjs` ghi lại
  `docs/tasks/test-defect-fixes/results/local-fixture.json` bằng organization id hiện tại.
  Thay đổi đó không được commit ([overnight-report.md](results/overnight-report.md)).
- Control Mailpit vẫn nhận email khi không có `MP_SMTP_AUTH_ACCEPT_ANY` và
  `MP_SMTP_AUTH_ALLOW_INSECURE`. Hai biến không cần cho API transport trong lần kiểm này;
  vẫn giữ theo plan ([early-checks.log](results/early-checks.log), [review-1.md](results/review-1.md)).

## Chưa xác minh

- Gmail SMTP production chưa từng chạy. Chưa biết độ tin cậy giao email và giới hạn gửi thực tế.
- Chưa thử retry với một SMTP thật bị lỗi. Test processor dùng mock; hàng BullMQ retry trong
  Status Tracker vẫn chưa được xác minh đầy đủ (🟡).
- Thứ tự email 2 (`application_interview`) và 6 (`schedule_created`) tới inbox không được bảo đảm (E9).
- Job `web-e2e` của CI chưa chạy cho tới khi có PR. Job này nay cũng pull image Mailpit;
  việc pull và chạy stack đó trên CI chưa được kiểm.
- Chưa quan sát trực tiếp AUTH có được trao đổi trong Mailpit probe `ok` hay không.
  Probe chứng minh transport gửi được tới server bật AUTH, còn log Mailpit không ghi AUTH từng phiên.
- Hai ASSUMPTION vẫn chờ người dùng: ứng viên `inactive` không nhận email (R17), và không có
  thông báo cho recruiter khi có scorecard.
- Dự kiến có merge conflicts với SP1 và SP2 ở các file trong Global Constraints của
  [plan.md](plan.md#global-constraints): `apps/api/src/app/applications/applications.service.ts`,
  `apps/api/src/app/interviews/interviews.service.ts`, `libs/backend/database/prisma/schema.prisma`,
  `libs/shared/types/src/lib/enums.ts`, `apps/api/src/test-utils/unit-test-helpers.ts` và
  `apps/api/src/app/applications/applications.module.ts`. Sau khi merge cần kiểm lại các luồng liên quan.

## Lệch so với plan

- Prompt Codex ở Task 1 viết cờ docker là `--env` thay `-e` để tránh false positive của guard.
  Phiên `stage-2-sp3-impl` chạy lệnh docker với `-e` như plan ([review-1.md](results/review-1.md)).
- Control `migrate diff` chạy sau Step 3, trước deploy. Lúc đó schema đã có phần SP3 để so với DB
  chưa có migration; chạy trước Step 3 không tạo được đối chứng này ([review-2.md](results/review-2.md)).
- Task 7 đổi mọi tham chiếu `updateMany` trong describe R7 sang `updateManyAndReturn`, gồm các
  assert không được gọi, thay vì chỉ đổi `upcomingCancellation`. Cách này giữ ý nghĩa của assert
  ([review-7.md](results/review-7.md)).
- `ApplicationsModule` giữ `NotificationsModule` vì grep `NotificationsService` khớp cả
  `CandidateNotificationsService`. Import còn thừa và được giữ để tránh thêm điểm xung đột
  ([review-7.md](results/review-7.md)).
- Phiên `stage-2-sp3-impl` thực hiện commit theo hai pha: test đỏ trước, implementation sau.
  Codex sandbox không ghi được Git worktree metadata; phiên `-impl` nhận việc commit
  ([review-1.md](results/review-1.md), [review-2.md](results/review-2.md)).
- Task 6 đã thử cách xóa khác sau khi sandbox từ chối. Điều phối ghi nhận đây là đi vòng từ chối;
  từ Task 7, phiên `-impl` tự xóa output và prompt yêu cầu dừng khi bị từ chối
  ([review-6.md](results/review-6.md)).
- Task 8 chạy thêm `tsc --build` cho database và shared types với `--force` ngoài prompt,
  rồi build lại thành công. Lần build đầu thiếu declaration output trong khi Nx dùng cache
  ([review-8.md](results/review-8.md)).
