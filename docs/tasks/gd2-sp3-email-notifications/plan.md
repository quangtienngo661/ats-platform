# GĐ2 SP3 — Email thông báo tự động cho ứng viên: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ứng viên nhận email (và in-app cho sự kiện lịch) khi đơn được nhận, khi đơn sang `interview`/`offer`/`hired`/`rejected`, và khi lịch phỏng vấn được tạo, đổi hoặc huỷ.

**Architecture:** Module NestJS mới `candidate-notifications`. `ApplicationsService` và `InterviewsService` gọi nó **sau khi commit**. Mỗi email là một row trong bảng mới `email_notifications` (payload chụp lúc phát sự kiện), rồi được enqueue vào queue BullMQ `notification-email` với `jobId` = id của row. Processor render từ payload (một layout HTML + nội dung viết trong TS) rồi gửi qua `MailService.sendMail`. Test stack có một Mailpit riêng để E2E đọc email thật.

**Tech Stack:** NestJS 11, Prisma 7 (CLI 7.8.0) + PostgreSQL, BullMQ 5.76, nodemailer 8, `Intl.DateTimeFormat` (không thêm thư viện); Jest cho API; Playwright (chỉ gọi API, không có UI mới) cho E2E; Mailpit `axllent/mailpit:v1.30.0`.

> **Cần người dùng cho phép trước khi chạy:** tải image `axllent/mailpit:v1.30.0` từ registry bên ngoài (`docker pull` ở Task 1 Step 2; service `mailpit` của test stack ở Task 9). Nếu lệnh bị chặn hoặc chưa được phép thì DỪNG và báo; không đổi sang image hay registry khác.

**Spec:** [spec.md](spec.md) (R1–R17, C1–C15, E1–E13) · quyết định: [decision.md](decision.md) · phối hợp: [../gd2-parallel-execution/README.md](../gd2-parallel-execution/README.md).

## Global Constraints

- **Người nhận** chỉ là ứng viên của đơn. Địa chỉ là `candidate.user.email` chụp lúc phát sự kiện (R1). Không email cho staff.
- **`EmailNotificationType`** (8 giá trị, đúng thứ tự): `application_received`, `application_interview`, `application_offer`, `application_hired`, `application_rejected`, `schedule_created`, `schedule_updated`, `schedule_cancelled`. **`EmailNotificationStatus`**: `pending`, `sent`, `failed`, `skipped`.
- **Không gửi gì khi:** ứng viên rút đơn; đơn sang `screening`, `applied` hoặc `cancelled`; lịch sang `completed`. Đơn bị từ chối kéo theo huỷ lịch thì chỉ có **một** email `application_rejected` liệt kê các lịch đã huỷ, **không** có `schedule_cancelled` (R4).
- **Nội dung:** không có điểm, gợi ý hay bất kỳ trường AI nào, không có `rejectionReason`, không có ghi chú staff (R7). Chữ hiển thị bằng tiếng Việt, viết "hủy" (giống UI hiện có), log bằng tiếng Anh. Câu chữ chính xác ở Task 4.
- **Giờ:** `formatInterviewTime` cho ra đúng `09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)`, dấu nối là en dash U+2013, `timeZone: 'Asia/Ho_Chi_Minh'`, `hourCycle: 'h23'` (R8).
- **Queue:** tên `notification-email`, job `send-notification-email`, data `{ notificationId: string }`, `jobId` = id của row, `concurrency: 5`, `setGlobalRateLimit(30, 60000)`. **Không** truyền `defaultJobOptions` ở `registerQueue` (bẫy shallow-merge, `app.module.ts:51-55`); retry 3 lần lấy từ `forRoot`.
- **Lỗi:** email và in-app không bao giờ làm request chính lỗi. Mọi method public của `CandidateNotificationsService` resolve kể cả khi Prisma, queue hay `NotificationsService` ném lỗi; in-app và email có try/catch **riêng**; lỗi chỉ được `Logger.warn` (R10). Processor rethrow mọi lỗi gửi (brain §10).
- **ASSUMPTION (chờ người dùng):** (1) ứng viên `UserStatus.inactive` lúc phát sự kiện thì row được ghi ở `skipped` và **không** enqueue; in-app vẫn tạo (R17, test `skips an inactive candidate`). (2) Thông báo cho recruiter khi có scorecard nằm ngoài phạm vi.
- **Migration:** đúng tên `20261015000000_add_email_notifications` (SP1 dùng `20261014000000`). Chỉ cộng thêm. SQL viết tay theo khuôn `20260913042256_add_organization_tenant/migration.sql`; **không** dựa vào `prisma migrate diff` để sinh (brain §5: lệnh này in rỗng ở máy này).
- **`schema.prisma`:** quan hệ ngược chỉ thêm ở **cuối** danh sách quan hệ của `Organization`, `User`, `Application`. Enum và model mới nằm trong một khối ở **cuối file**, sau `model Notification`. Không sửa dòng nào ở giữa.
- **Không phụ thuộc SP1/SP2:** không dùng `assertInCallerOrganizationOr404`, không bỏ `private` của helper nào. SP3 tự đọc bằng Prisma.
- **Prisma client:** sau mỗi lần đổi schema chạy `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma` (dạng CI dùng). Dạng `--config` cần `DATABASE_URL` và lỗi trong worktree không có `.env` (runbook `[V 2026-08-30]`). Trước `npx nx build api` chạy `rm -rf dist .nx/cache` (build cũ giữ client cũ).
- **Lệnh** viết cho bash (Git Bash trên Windows). API: `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="<mẫu>"` (spec ngoài `src/app/**` và `src/common/**` bị bỏ qua âm thầm).
- **Test cũ được phép sửa** đúng ba chỗ: constructor trong `applications.service.spec.ts` và `interviews.service.spec.ts`; các assert `notificationsService.create` trong `applications.service.spec.ts` (49 cặp, `enforces valid status transitions…`, `allows a genuine revert…`) đổi sang assert lời gọi `candidateNotifications`; `upcomingCancellation` trong describe R7 đổi `updateMany` → `updateManyAndReturn` có `select`. Không sửa test nào khác.
- **DỪNG và báo** (ghi `results/overnight-report.md`), không tự đổi thiết kế, khi: một bước kiểm ở Task 1 sai giả định; nền test đỏ trước khi sửa gì (Task 0); một E2E **có sẵn** đỏ sau khi bật SMTP (Task 9); cần sửa file ngoài mục "Files" của task.
- **Git:** không push, không merge, không `git add -A`; chỉ `git add` file trong mục "Files" của task. Khi người dùng đã cho phép commit (`docs/tasks/gd2-parallel-execution/README.md` §4.2), Codex (do phiên `stage-2-sp3-impl` gọi) commit trên nhánh worktree theo đúng message ở bước "Commit"; chưa được phép thì báo branch, `git status`, message và chờ duyệt. Dòng `Co-Authored-By` cuối message do người dùng chốt (README điều phối §4.2, giống plan SP2); không tự ghi tên model không tham gia. Thứ tự merge GĐ2: SP1 → SP2 → SP3. Việc `git merge origin/dev` vào nhánh này sau khi `dev` có SP1 (và SP2) do người dùng cho phép và **không** nằm trong phạm vi tự động của phiên `-impl`; khi làm, giải xung đột ở các file dưới rồi chạy lại `--testPathPatterns="applications|interviews|candidate-notifications"` (phải exit 0) trước khi tạo PR.
- **File dễ xung đột khi merge `dev`:**
  - `applications.service.ts`: SP2 sửa `triggerScreening`; SP3 sửa constructor, `apply`, `cancelUpcomingSchedules`, `updateStatus`, bỏ phần in-app.
  - `interviews.service.ts`: SP1 sửa `removeSchedule`; SP3 sửa constructor, `assertCanMutateSchedule`, `createSchedule`, `updateSchedule`, `removeSchedule`.
  - `schema.prisma`: SP1 thêm quan hệ ngược và model.
  - `libs/shared/types/src/lib/enums.ts` và `apps/api/src/test-utils/unit-test-helpers.ts`: SP1 cũng thêm vào.
  - `applications.module.ts`: SP1 và SP2 thêm provider.

## Điều chỉnh spec (phát hiện khi viết plan, đã ghi vào spec)

- **FK `applicationId` → `onDelete: Cascade`.** Cleanup của các E2E hiện có xoá `applications` theo tổ chức (`apps/web/e2e/support/gd2-fixtures.mjs:114-141`); FK không cascade sẽ làm vỡ chúng. `organizationId` dùng `Restrict` như các bảng tenant khác.
- **`cancelUpcomingSchedules` dùng `updateManyAndReturn`**, một câu lệnh, trả về đúng các lịch vừa huỷ. Đã thấy hàm này trong client đã generate (`models/InterviewSchedule.ts`, có `select`); Task 1 kiểm lại sau khi generate.
- **Probe chạy trên container dùng một lần**, không trên test stack dùng chung: PostgreSQL ở `127.0.0.1:55533`, Mailpit ở `127.0.0.1:51125/58125` và `51126/58126`. Test stack chỉ được động tới ở Task 9, có giữ khoá.
- **E2E chỉ gọi API** (Playwright `request`), vì SP3 không có UI mới. File nằm trong `apps/web/e2e`, nên job `web-e2e` của CI cũng chạy nó.

## Review Focus

1. **Tên tin hoặc tên tổ chức chứa `$&`, `$1`, `{{content}}`.** `String.replace` với chuỗi thay thế sẽ hiểu sai các mẫu `$`. Email phải hiện nguyên văn và layout không vỡ. Test `fillLayout inserts $&, $1 and {{content}} literally` ở Task 4.
2. **Tên tin chứa `\r\n` (header injection).** Tiêu đề không được có xuống dòng. Test `strips line breaks from the subject` ở Task 4.
3. **Lịch qua nửa đêm và lịch đầu ngày.** `16:30Z` → `23:30–00:30, Thứ Ba, 20/10/2026`; `2026-10-19T17:00:00Z` phải ra ngày VN 20/10, không phải 19/10. Test ở `format.spec.ts`, Task 4.
4. **Row biến mất khi job đang chạy** (E2E cleanup cascade xoá đơn). Processor không được ném lỗi chỉ vì cập nhật trạng thái không trúng row nào. Test `does not throw when the row disappears before it is marked` ở Task 6.
5. **PATCH gửi lại đúng giá trị cũ dưới dạng khác,** vd `startAt` `2026-10-20T09:30:00+07:00` trong khi đang là `02:30Z`. Không được gửi `schedule_updated`. Test `treats the same instant as unchanged` ở Task 5.

## File Structure

| File | Trách nhiệm |
|---|---|
| `libs/backend/database/prisma/schema.prisma` | 2 enum, model `EmailNotification`, 3 dòng quan hệ ngược |
| `libs/backend/database/prisma/migrations/20261015000000_add_email_notifications/migration.sql` | type, bảng, FK, index |
| `libs/shared/types/src/lib/enums.ts` | chép tay 2 enum (`libs/CLAUDE.md:36`) |
| `apps/api/src/common/mail/mail.service.ts` (+ `.spec.ts` mới) | `isSmtpEnabled`, `readTemplate`, `sendMail` |
| `apps/api/src/assets/mail/notification-layout.html` | layout chung, chỗ chèn `{{title}}`, `{{content}}` |
| `apps/api/src/app/candidate-notifications/email/` | `format.ts`, `notification-email.types.ts`, `render-notification-email.ts` (+ spec): render thuần, không I/O |
| `apps/api/src/app/candidate-notifications/schedule-changes.ts` (+ spec) | `ScheduleSnapshot`, `toScheduleSnapshot`, `changedScheduleFields` |
| `apps/api/src/app/candidate-notifications/notification-email.constants.ts` | tên queue/job, kiểu job data |
| `apps/api/src/app/candidate-notifications/candidate-notifications.service.ts` (+ spec) | quyết định gửi gì, ghi row, enqueue, in-app |
| `apps/api/src/app/candidate-notifications/notification-email.processor.ts` (+ spec) | đọc row, render, gửi, cập nhật trạng thái |
| `apps/api/src/app/candidate-notifications/candidate-notifications.module.ts` | wiring, rate limit |
| `apps/api/src/app/applications/applications.service.ts`, `applications.module.ts` | gọi notifier, bỏ in-app cũ |
| `apps/api/src/app/interviews/interviews.service.ts`, `interviews.module.ts` | gọi notifier |
| `docker-compose.test.yml` | service `mailpit`, bật SMTP cho API test |
| `apps/web/e2e/gd2-email-notifications.e2e.ts`, `apps/web/e2e/support/{gd2-email-fixtures.mjs,mailpit.mjs}` | hành trình thật |
| `docs/tasks/gd2-sp3-email-notifications/results/`, `README.md` | probe, log, kết quả |

---

### Task 0: Chuẩn bị worktree

**Files:** không có.

**Interfaces:** Produces: worktree sạch trên `feat/gd2-sp3-email-notifications` (cắt từ `origin/dev`), có `node_modules` và Prisma client.

- [ ] **Step 1:** `git branch --show-current` in `feat/gd2-sp3-email-notifications`; `git status --short` rỗng. Sai thì DỪNG và báo.
- [ ] **Step 2:** `npm ci`, rồi `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`. Expected: cả hai exit 0.
- [ ] **Step 3:** Chạy nền: `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="applications.service|interviews.service|notifications.service|cv-screenings.processor"`. Expected: exit 0. Đỏ trước khi sửa gì thì DỪNG và báo (lỗi sẵn có, không tự sửa).

---

### Task 1: Kiểm chứng sớm các giả định (cổng DỪNG)

**Files:** Create `docs/tasks/gd2-sp3-email-notifications/results/probe-mailpit.mjs`, `results/early-checks.log`.

**Interfaces:** Produces: bằng chứng cho bốn giả định mà Task 2, 7 và 9 dựa vào. Mọi tiêu chí dưới đây sai thì DỪNG, ghi `results/overnight-report.md`, **không** chuyển sang phương án khác.

- [ ] **Step 1:** `grep -c "updateManyAndReturn" libs/backend/database/src/generated/prisma/models/InterviewSchedule.ts` → **≥ 1**. Ghi vào log.
- [ ] **Step 2:** `docker pull axllent/mailpit:v1.30.0` → exit 0 (cần người dùng cho phép, xem đầu plan; bị chặn thì DỪNG).
- [ ] **Step 3: Viết `probe-mailpit.mjs`.** Nhận `--smtp-port`, `--api-port`, `--expect ok|auth-refused`. Dùng `nodemailer` của repo, gửi tới `127.0.0.1:<smtp>` với `secure: false`, `auth: { user: 'probe', pass: 'probe' }` một mail tới `probe-<uuid>@ats.test`, tiêu đề và thân chứa một marker ngẫu nhiên. Với `ok`:
  - `GET http://127.0.0.1:<api>/api/v1/search?query=` + `encodeURIComponent('to:"<addr>"')` trả đúng **1** message, `Subject` khớp;
  - `GET /api/v1/message/<ID>` có `HTML` và `Text` chứa marker, `To[0].Address` = addr.

  Với `auth-refused`: `sendMail` phải reject. In `PASS`/`FAIL` từng dòng; exit 1 nếu có FAIL.
- [ ] **Step 4:** Chạy, ghi toàn bộ output vào `early-checks.log`:
  - `docker run -d --rm --name ats-sp3-mailpit-probe -p 127.0.0.1:51125:1025 -p 127.0.0.1:58125:8025 -e MP_SMTP_AUTH_ACCEPT_ANY=1 -e MP_SMTP_AUTH_ALLOW_INSECURE=1 axllent/mailpit:v1.30.0`, chờ `docker exec ats-sp3-mailpit-probe /mailpit readyz` exit 0, rồi `node docs/tasks/gd2-sp3-email-notifications/results/probe-mailpit.mjs --smtp-port 51125 --api-port 58125 --expect ok` → **exit 0** (sai thì DỪNG).
  - **Control:** container thứ hai `ats-sp3-mailpit-control` ở `51126/58126`, **không** có hai biến `MP_SMTP_AUTH_*`, chạy với `--expect auth-refused`. Nếu control cũng gửi được thì ghi "hai biến không cần" vào log (không DỪNG, vẫn giữ hai biến).
  - `docker rm -f ats-sp3-mailpit-probe ats-sp3-mailpit-control`.
- [ ] **Step 5: Commit** `test(tasks): probe the mailpit auth and search api that sp3 relies on` (2 file).

---

### Task 2: Schema, migration, enum chia sẻ và probe DB

**Files:** Modify `libs/backend/database/prisma/schema.prisma`, `libs/shared/types/src/lib/enums.ts`; Create `libs/backend/database/prisma/migrations/20261015000000_add_email_notifications/migration.sql`, `docs/tasks/gd2-sp3-email-notifications/results/probe-email-notifications.js`, `results/probe-email-notifications-red.log`, `results/probe-email-notifications-green.log`.

**Interfaces:** Produces (sau `prisma generate`): `prisma.emailNotification`, kèm các quan hệ `Organization.emailNotifications`, `User.emailNotifications`, `Application.emailNotifications`. `enums.ts` có `EmailNotificationType` và `EmailNotificationStatus` theo khuôn `as const` + `type`, đặt **trước** khối "Backward compatibility aliases". Khối thêm vào cuối `schema.prisma`, đúng như sau:

```prisma
// ============================================================
// EMAIL NOTIFICATION (GĐ2 SP3)
// ============================================================

enum EmailNotificationType {
  application_received
  application_interview
  application_offer
  application_hired
  application_rejected
  schedule_created
  schedule_updated
  schedule_cancelled

  @@map("email_notification_type")
}

enum EmailNotificationStatus {
  pending
  sent
  failed
  skipped

  @@map("email_notification_status")
}

model EmailNotification {
  id              String                  @id @default(uuid())
  organizationId  String                  @map("organization_id")
  recipientUserId String                  @map("recipient_user_id")
  recipientEmail  String                  @map("recipient_email")
  applicationId   String                  @map("application_id")
  // No FK: a schedule can be hard-deleted (removeSchedule) and the email must survive it.
  interviewId     String?                 @map("interview_id")
  type            EmailNotificationType
  status          EmailNotificationStatus @default(pending)
  payload         Json
  lastError       String?                 @map("last_error") @db.VarChar(500)
  createdAt       DateTime                @default(now()) @map("created_at")
  sentAt          DateTime?               @map("sent_at")

  organization Organization @relation(fields: [organizationId], references: [organizationId], onDelete: Restrict)
  recipient    User         @relation(fields: [recipientUserId], references: [userId], onDelete: Cascade)
  application  Application  @relation(fields: [applicationId], references: [applicationId], onDelete: Cascade)

  @@index([organizationId])
  @@index([applicationId])
  @@map("email_notifications")
}
```

- [ ] **Step 1: Viết probe trước**, theo khuôn `docs/tasks/org-admin-enforcement/results/probe-org-admin-check.js` (`pg` của repo, kết nối qua `DATABASE_URL`, không dotenv). Probe kiểm qua catalog:
  - **control:** `applications_organization_id_fkey` có `confdeltype = 'r'`. Sai thì exit 2 với dòng "instrument broken";
  - `to_regclass('email_notifications')` khác null;
  - `enum_range` của `email_notification_type` đúng 8 giá trị theo thứ tự, của `email_notification_status` đúng 4;
  - `confdeltype`: `email_notifications_organization_id_fkey` = `r`, `email_notifications_recipient_user_id_fkey` = `c`, `email_notifications_application_id_fkey` = `c`;
  - `last_error` là `character varying(500)`; default của `status` là `'pending'`;
  - có index `email_notifications_organization_id_idx` và `email_notifications_application_id_idx`.

  Exit 1 nếu có FAIL.
- [ ] **Step 2: Đỏ.** `docker run -d --rm --name ats-sp3-pg-probe -e POSTGRES_USER=probe -e POSTGRES_PASSWORD=probe-local -e POSTGRES_DB=probe -p 127.0.0.1:55533:5432 postgres:18.4-alpine`, chờ `docker exec ats-sp3-pg-probe pg_isready -U probe -d probe`. Rồi chạy `DATABASE_URL=postgresql://probe:probe-local@localhost:55533/probe npx prisma migrate deploy --config libs/backend/database/prisma.config.ts` (chưa có migration SP3) và chạy probe. Expected: control PASS, các dòng còn lại FAIL, exit 1. Lưu `probe-email-notifications-red.log`.
- [ ] **Step 3:** Thêm khối trên vào cuối `schema.prisma`; thêm `emailNotifications EmailNotification[]` làm dòng **cuối** trong danh sách quan hệ của `Organization` (sau `interviewSchedules`), `User` (sau `notifications`) và `Application` (sau `screening`). Viết tay `migration.sql`: `CREATE TYPE` ×2, `CREATE TABLE "email_notifications"` (`TEXT`, `JSONB`, `TIMESTAMP(3)`, `VARCHAR(500)`, `DEFAULT 'pending'`, `DEFAULT CURRENT_TIMESTAMP`), 2 `CREATE INDEX`, 3 `ADD CONSTRAINT … FOREIGN KEY … ON DELETE {RESTRICT|CASCADE} ON UPDATE CASCADE`, theo tên ở Step 1. Thêm 2 enum vào `enums.ts`.
- [ ] **Step 4: Xanh.** Chạy lại `migrate deploy` với cùng `DATABASE_URL` → `1 migration … applied`; chạy probe → mọi dòng PASS, exit 0. Lưu `-green.log`. Nếu `npx prisma migrate diff --help` có cách so DB với `schema.prisma`, chạy thêm và ghi vào log green. Quy tắc control: chỉ coi "không lệch" là bằng chứng nếu chính lệnh đó chạy trước Step 3 có in ra `CREATE TABLE "email_notifications"`; nếu không, ghi "instrument không dùng được" (không DỪNG). `docker rm -f ats-sp3-pg-probe`.
- [ ] **Step 5:** `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`, `rm -rf dist .nx/cache`, `npx nx build api` → exit 0.
- [ ] **Step 6: Commit** `test(db): add the email notification constraint probe` (probe + log đỏ), rồi `feat(db): add the email notifications table` (schema, migration, `enums.ts`, log xanh).

---

### Task 3: `MailService` gửi một email bất kỳ

**Files:** Modify `apps/api/src/common/mail/mail.service.ts`; Create `apps/api/src/common/mail/mail.service.spec.ts`.

**Interfaces:** Produces (public, hai hàm email cũ **không đổi**):
- `isSmtpEnabled(): boolean`, true khi `SMTP_ENABLED` (không phân biệt hoa thường) là `true`; thay getter `private get isEnabled` và hai hàm cũ dùng nó.
- `readTemplate(fileName: string): string`, đọc `utf8` qua `getTemplatePath` hiện có, ném lỗi nếu không có file.
- `sendMail(message: { to: string; subject: string; html: string; text: string }): Promise<boolean>`: SMTP tắt thì log `[SMTP disabled] Would send "<subject>" to <to>` và trả `false`, không tạo transport; bật thì `transporter.sendMail({ from: this.fromAddress, ...message })` rồi trả `true`; lỗi SMTP được ném ra.

- [ ] **Step 1: Test đỏ** (`jest.mock('nodemailer')`, lưu và trả lại `process.env` sau mỗi test):
  - `isSmtpEnabled is true only for SMTP_ENABLED=true in any case`;
  - `sendMail returns false and creates no transport when SMTP is disabled`;
  - `sendMail sends to, subject, html and text from SMTP_FROM and returns true`;
  - `sendMail lets an SMTP error propagate`;
  - `readTemplate reads a file from src/assets/mail` (`verification-email.html` chứa `{{verifyLink}}`);
  - `readTemplate throws for a missing template`.
- [ ] **Step 2:** Run `--testPathPatterns="common/mail"` → FAIL.
- [ ] **Step 3:** Cài theo Interfaces.
- [ ] **Step 4:** Run lại → PASS.
- [ ] **Step 5: Commit** `test(api): add the generic mail sending rules`, rồi `feat(api): let the mail service send any rendered email`.

---

### Task 4: Render email (thuần, không I/O)

**Files:** Create `apps/api/src/assets/mail/notification-layout.html`, `apps/api/src/app/candidate-notifications/email/{format.ts,format.spec.ts,notification-email.types.ts,render-notification-email.ts,render-notification-email.spec.ts}`.

**Interfaces:** Produces:
- `notification-email.types.ts`:
  - `ApplicationContext { applicationId: string; candidateName: string; jobTitle: string; organizationName: string; appliedAt: string }` (ISO);
  - `ScheduleDetails { interviewId: string; startAt: string; durationMinutes: number; interviewType: InterviewType; onlineMeetingLink: string | null; location: string | null; interviewerName: string }`;
  - `CancelledScheduleLine { startAt: string; durationMinutes: number; interviewType: InterviewType }`;
  - `NotificationEmailPayload { context: ApplicationContext; schedule?: ScheduleDetails; previous?: Partial<ScheduleDetails>; cancelledSchedules?: CancelledScheduleLine[] }`. `previous` chỉ chứa giá trị **cũ** của các trường đã đổi;
  - `RenderedEmail { subject: string; html: string; text: string }`.
- `format.ts`:
  - `formatInterviewTime(startAt: Date | string, durationMinutes: number): string`;
  - `formatVietnamDate(at: Date | string): string` (`dd/MM/yyyy` giờ VN);
  - `escapeHtml(value: string): string` (`& < > " '` → `&amp; &lt; &gt; &quot; &#39;`);
  - `fillLayout(layout: string, values: { title: string; contentHtml: string }): string`. Thay `{{title}}` bằng title đã escape và `{{content}}` bằng `contentHtml`, **dùng hàm thay thế** (`replace(pattern, () => value)`), không dùng chuỗi thay thế.
- `render-notification-email.ts`: `renderNotificationEmail(type: EmailNotificationType, payload: NotificationEmailPayload, options: { clientUrl: string; layout: string }): RenderedEmail`.
  - `clientUrl` được bỏ `/` ở cuối.
  - Tiêu đề không escape, bỏ mọi `\r` và `\n`.
  - HTML: mọi giá trị động qua `escapeHtml`, kể cả trong `href`.
  - Text: cùng các câu đó, không escape.
- `notification-layout.html`: giữ giao diện TalentAI của `verification-email.html` (thẻ 580px, vạch xanh `#0071E3`, chữ "TalentAI"); `<title>` và tiêu đề trong thẻ là `{{title}}`, thân là `{{content}}`, footer cố định `Đây là email tự động, vui lòng không trả lời.`

**Câu chữ (chính xác).** `{t}` = `jobTitle`, `{o}` = `organizationName`, `{when}` = `formatInterviewTime(startAt, durationMinutes)`. Mọi email mở đầu bằng `Chào {candidateName},` và kết thúc bằng footer trên (bản text cũng vậy). Link: #1–#5 có nút `Xem đơn ứng tuyển` → `{clientUrl}/my-applications/{applicationId}`; #6–#8 có nút `Xem lịch phỏng vấn` → `{clientUrl}/my-interviews`. Bản text ghi `{nhãn}: {url}`.

| `type` | Tiêu đề | Câu thân (theo thứ tự) |
|---|---|---|
| `application_received` | `Đã nhận đơn ứng tuyển: {t}` | `Chúng tôi đã nhận đơn ứng tuyển của bạn cho vị trí {t} tại {o} ngày {formatVietnamDate(appliedAt)}.` |
| `application_interview` | `Bạn được mời vào vòng phỏng vấn: {t}` | `Đơn ứng tuyển của bạn cho vị trí {t} tại {o} đã được chuyển sang vòng phỏng vấn.` · `Nhà tuyển dụng sẽ gửi lịch phỏng vấn cho bạn.` |
| `application_offer` | `Đề nghị tuyển dụng: {t}` | `Đơn ứng tuyển của bạn cho vị trí {t} tại {o} đã được chuyển sang vòng đề nghị tuyển dụng.` |
| `application_hired` | `Chúc mừng bạn đã trúng tuyển: {t}` | `Chúc mừng! Bạn đã trúng tuyển vị trí {t} tại {o}.` |
| `application_rejected` | `Kết quả đơn ứng tuyển: {t}` | `Cảm ơn bạn đã quan tâm đến vị trí {t} tại {o}.` · `Sau khi xem xét, hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.` · mỗi lịch trong `cancelledSchedules`: `Buổi phỏng vấn lúc {when} đã được hủy.` |
| `schedule_created` | `Lịch phỏng vấn: {t}` | `Bạn có lịch phỏng vấn cho vị trí {t} tại {o}.` · khối chi tiết |
| `schedule_updated` | `Lịch phỏng vấn đã thay đổi: {t}` | `Lịch phỏng vấn cho vị trí {t} tại {o} đã thay đổi. Thông tin mới:` · khối chi tiết · `Trước đây:` · một dòng cho mỗi khoá có trong `previous` |
| `schedule_cancelled` | `Lịch phỏng vấn đã bị hủy: {t}` | `Buổi phỏng vấn cho vị trí {t} tại {o} lúc {when} ({hình thức}) đã bị hủy.` |

**Khối chi tiết:**
- `Thời gian: {when}`;
- `Thời lượng: {durationMinutes} phút`;
- `Hình thức: Trực tuyến` (`online`) hoặc `Hình thức: Trực tiếp` (`onsite`);
- online: `Link phòng họp: {onlineMeetingLink}` (HTML là `<a href>`); onsite: `Địa điểm: {location}`, hoặc `Địa điểm: chưa cập nhật` khi `null`;
- `Người phỏng vấn: {interviewerName}`.

**Dòng "Trước đây"** dùng cùng nhãn: `startAt` → `Thời gian: {formatInterviewTime(previous.startAt, previous.durationMinutes ?? schedule.durationMinutes)}`. `onlineMeetingLink`/`location` cũ là `null` thì ghi `không có`/`chưa cập nhật`.

- [ ] **Step 1: Test đỏ `format.spec.ts`:**
  - `formats 02:30Z for 60 minutes as 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)`;
  - `crosses midnight as 23:30–00:30 on the start date` (`2026-10-20T16:30:00Z` → `23:30–00:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)`);
  - `uses the Vietnam date for 17:00Z` (`2026-10-19T17:00:00Z` → `00:00–01:00, Thứ Ba, 20/10/2026 (giờ Việt Nam)`);
  - `formatVietnamDate gives 14/10/2026 for 2026-10-13T20:00:00Z`;
  - `escapeHtml escapes & < > " and '`;
  - `fillLayout inserts $&, $1 and {{content}} literally` (Review Focus 1).
- [ ] **Step 2: Test đỏ `render-notification-email.spec.ts`** (layout giả `<h1>{{title}}</h1><main>{{content}}</main>`):
  - `it.each` 8 type: `subject of <type>` bằng đúng bảng;
  - `application_received states the job, organization and Vietnam date`;
  - `application_rejected is neutral and lists each cancelled interview`: có `chưa phù hợp với vị trí này`, có `Buổi phỏng vấn lúc 09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam) đã được hủy.`, và không có dòng đó khi danh sách rỗng;
  - `schedule_created shows the online link as a link and the interviewer`;
  - `schedule_created onsite without location says chưa cập nhật`;
  - `schedule_updated lists only the changed fields under Trước đây`;
  - `schedule_cancelled names the cancelled time and type`;
  - `links application emails to /my-applications/:id and schedule emails to /my-interviews without a double slash` (`clientUrl` `http://localhost:3001/`);
  - `escapes user text in html but keeps it raw in text` (tên tin `<script>alert(1)</script> & $&`);
  - `strips line breaks from the subject` (Review Focus 2);
  - `never prints a score or a rejection reason passed in the payload` (payload kèm `overallScore: 91`, `rejectionReason: 'Thiếu NestJS'` qua `as any` → html và text không chứa `91` hay `Thiếu NestJS`);
  - `every email ends with the automatic-email footer`.
- [ ] **Step 3:** Run `--testPathPatterns="candidate-notifications/email"` → FAIL.
- [ ] **Step 4:** Cài layout, `format.ts`, types, renderer.
- [ ] **Step 5:** Run lại → PASS.
- [ ] **Step 6: Commit** `test(api): add the notification email rendering rules`, rồi `feat(api): render the candidate notification emails`.

---

### Task 5: `CandidateNotificationsService` — gửi gì, cho ai, ghi row, enqueue, in-app

**Files:** Create `apps/api/src/app/candidate-notifications/{notification-email.constants.ts,schedule-changes.ts,schedule-changes.spec.ts,candidate-notifications.service.ts,candidate-notifications.service.spec.ts,candidate-notifications.module.ts}`; Modify `apps/api/src/test-utils/unit-test-helpers.ts` (thêm `emailNotification: model(['create', 'findUnique', 'updateMany'])`).

**Interfaces:** Consumes Task 2 (`prisma.emailNotification`, enum `EmailNotificationType`/`EmailNotificationStatus` từ `@ats-platform/database`) và Task 4 (`formatInterviewTime`, các kiểu payload). Produces:
- `notification-email.constants.ts`: `NOTIFICATION_EMAIL_QUEUE = 'notification-email'`, `SEND_NOTIFICATION_EMAIL_JOB = 'send-notification-email'`, `interface NotificationEmailJobData { notificationId: string }`.
- `schedule-changes.ts`:
  - `ScheduleSnapshot { interviewId: string; applicationId: string; interviewerId: string; interviewType: InterviewType; startAt: Date; durationMinutes: number; onlineMeetingLink: string | null; location: string | null; status: ScheduleStatus }`;
  - `CancelledScheduleSummary = Pick<ScheduleSnapshot, 'interviewId' | 'startAt' | 'durationMinutes' | 'interviewType'>`;
  - `toScheduleSnapshot(row: ScheduleSnapshot): ScheduleSnapshot`, chỉ chép đúng 9 khoá;
  - `type ScheduleField = 'startAt' | 'durationMinutes' | 'interviewType' | 'onlineMeetingLink' | 'location' | 'interviewerId'`;
  - `changedScheduleFields(before: ScheduleSnapshot, after: ScheduleSnapshot): ScheduleField[]`: so `startAt` bằng `getTime()`, coi `undefined` như `null`, trả theo thứ tự của union.
- `CandidateNotificationsService`, constructor `(prisma: PrismaService, notificationsService: NotificationsService, @InjectQueue(NOTIFICATION_EMAIL_QUEUE) queue: Queue)`. Mọi method trả `Promise<void>` và không bao giờ reject:
  - `applicationReceived(applicationId: string)`
  - `applicationStatusChanged(applicationId: string, status: ApplicationStatus, cancelledSchedules: CancelledScheduleSummary[])`
  - `scheduleCreated(schedule: ScheduleSnapshot)`
  - `scheduleChanged(before: ScheduleSnapshot, after: ScheduleSnapshot)`
  - `scheduleRemoved(schedule: ScheduleSnapshot, removedAt: Date)`
- `CandidateNotificationsModule`:
  - imports `PrismaModule`, `NotificationsModule`, `MailModule`, `BullModule.registerQueue({ name: NOTIFICATION_EMAIL_QUEUE })`;
  - providers `CandidateNotificationsService`; exports `CandidateNotificationsService`;
  - `onModuleInit()` gọi `queue.setGlobalRateLimit(30, 60000)` (khuôn `AuthModule`).

**Quy tắc (cài đúng như sau):**
- **Ngữ cảnh** đọc bằng `prisma.application.findUnique({ where: { applicationId }, select: { applicationId, organizationId, appliedAt, organization: { select: { name } }, jobPosting: { select: { title } }, candidate: { select: { user: { select: { userId, email, fullName, status } } } } } })`. Không có đơn thì `warn` và dừng.
- **Tên interviewer** đọc bằng `prisma.user.findMany({ where: { userId: { in: [...] } }, select: { userId, fullName } })`.
- **Bảng hành vi.** `{t}` là tên tin; `{when}` là `formatInterviewTime(startAt, durationMinutes)` của lịch mới, hoặc của
  lịch bị huỷ. Chữ in-app là text thuần, không escape.

  | Gọi | Điều kiện | In-app | Email |
  |---|---|---|---|
  | `applicationReceived` | luôn | không | `application_received` |
  | `applicationStatusChanged` | `interview`/`offer`/`hired`/`rejected` | giữ **nguyên** `NOTIFY_CANDIDATE_ON`/`APPLICATION_STATUS_NOTIFICATION_COPY` cũ (chuyển từ `applications.service.ts:68-97`): `type: application`, `relatedEntityType: application`, `relatedEntityId: applicationId` | `application_<status>`; `rejected` thì `payload.cancelledSchedules` = danh sách truyền vào (ISO) |
  | `applicationStatusChanged` | trạng thái khác | không | không |
  | `scheduleCreated` | luôn | `Bạn có lịch phỏng vấn mới` / `Lịch phỏng vấn cho vị trí {t}: {when}.` | `schedule_created` |
  | `scheduleChanged` | `before.status === scheduled` và `after.status === cancelled` (thắng mọi đổi trường khác, E4) | `Lịch phỏng vấn đã bị hủy` / `Buổi phỏng vấn cho vị trí {t} lúc {when} đã bị hủy.` | `schedule_cancelled` |
  | `scheduleChanged` | `after.status === scheduled` và `changedScheduleFields` không rỗng | `Lịch phỏng vấn đã thay đổi` / `Lịch phỏng vấn cho vị trí {t} đã thay đổi: {when}.` | `schedule_updated`, `previous` = giá trị cũ của trường đã đổi (`interviewerId` → `interviewerName` cũ) |
  | `scheduleChanged` | còn lại (gồm `completed`) | không | không |
  | `scheduleRemoved` | `status === scheduled` và `startAt > removedAt` | như `cancelled` | `schedule_cancelled` |

  In-app cho lịch dùng `type: interview`, `relatedEntityType: interview`, `relatedEntityId: interviewId`.
- **Ghi row:**
  - `prisma.emailNotification.create({ data: { organizationId: <của đơn>, recipientUserId, recipientEmail: <email lúc này>, applicationId, interviewId: <hoặc null>, type, status, payload }, select: { id: true } })`.
  - `status` là `skipped` nếu `user.status === UserStatus.inactive` (khi đó không enqueue), ngược lại là `pending`.
  - Sau đó `queue.add(SEND_NOTIFICATION_EMAIL_JOB, { notificationId: id }, { jobId: id })`, không truyền option nào khác.
- In-app và email có try/catch riêng. `Logger.warn` dạng `Failed to <create the in-app notification|queue the email> for <type> of application <id>: <message>`.

- [ ] **Step 1: Test đỏ `schedule-changes.spec.ts`:**
  - `it.each` 6 trường: `reports <field> when it differs`;
  - `treats the same instant as unchanged` (`new Date('2026-10-20T02:30:00Z')` so với `new Date('2026-10-20T09:30:00+07:00')`, Review Focus 5);
  - `treats null and undefined as the same`;
  - `ignores a status-only change`;
  - `toScheduleSnapshot keeps only the snapshot fields`.
- [ ] **Step 2: Test đỏ `candidate-notifications.service.spec.ts`** (`createPrismaMock`, `createQueueMock`, `notificationsService = { create: jest.fn() }`):
  - `records and enqueues application_received with the candidate's current email` (assert đủ `data` của row, gồm `organizationId: 'org-1'` lấy từ đơn; `queue.add('send-notification-email', { notificationId: 'row-1' }, { jobId: 'row-1' })`; không có in-app);
  - `it.each` interview/offer/hired: `sends application_<status> with the unchanged in-app copy` (title/message đúng chuỗi cũ);
  - `sends one application_rejected listing the cancelled schedules and no schedule_cancelled`;
  - `it.each` screening/applied/cancelled: `does nothing for <status>`;
  - `schedule_created creates the interview in-app and the email with the interviewer's name`;
  - `sends schedule_updated with only the changed fields as previous`;
  - `uses the old interviewer's name when the interviewer changes`;
  - `sends nothing when no candidate-visible field changed`;
  - `sends schedule_cancelled when a scheduled interview is cancelled, even with other changes` (E4);
  - `sends schedule_cancelled for a past-due scheduled interview that is cancelled` (E6);
  - `sends nothing when the schedule is completed` (E5);
  - `scheduleRemoved sends schedule_cancelled for an upcoming scheduled interview`;
  - `it.each` past/completed/cancelled: `scheduleRemoved sends nothing for a <case> schedule`;
  - `skips an inactive candidate` (row `status: 'skipped'`, `queue.add` không được gọi, in-app vẫn tạo; R17, C15);
  - `keeps the row pending and logs when enqueueing fails` (E10);
  - `still queues the email when the in-app write fails`;
  - `never rejects when reading the application fails` (mọi method; spy `Logger.prototype.warn`; C11);
  - `module sets a global rate limit of 30 per minute` (`new CandidateNotificationsModule(queue).onModuleInit()`).
- [ ] **Step 3:** Run `--testPathPatterns="candidate-notifications/(schedule-changes|candidate-notifications.service)"` → FAIL.
- [ ] **Step 4:** Cài theo Interfaces và quy tắc. Chưa import module vào đâu (Task 7, 8).
- [ ] **Step 5:** Run lại → PASS. `grep -rn "defaultJobOptions" apps/api/src/app/candidate-notifications` → không có dòng nào.
- [ ] **Step 6: Commit** `test(api): add the candidate notification rules`, rồi `feat(api): decide and queue candidate notification emails`.

---

### Task 6: `NotificationEmailProcessor`

**Files:** Create `apps/api/src/app/candidate-notifications/{notification-email.processor.ts,notification-email.processor.spec.ts}`; Modify `candidate-notifications.module.ts` (thêm provider).

**Interfaces:** Consumes: Task 3 (`sendMail` và giá trị `boolean` nó trả về, `readTemplate`), Task 4 (`renderNotificationEmail`), Task 5 (`NOTIFICATION_EMAIL_QUEUE`, `NotificationEmailJobData`). Produces:
- `@Processor(NOTIFICATION_EMAIL_QUEUE, { concurrency: 5 }) class NotificationEmailProcessor extends WorkerHost`, constructor `(prisma: PrismaService, mailService: MailService)`.
- `process(job: Job<NotificationEmailJobData, void, string>): Promise<void>`:
  1. `findUnique({ where: { id: notificationId } })`. Không có row thì `log` rồi return. `sent`/`skipped` thì return.
  2. `layout = mailService.readTemplate('notification-layout.html')`, rồi `renderNotificationEmail(row.type, row.payload, { clientUrl: CLIENT_URL, layout })` (`CLIENT_URL` từ `common/constants/urls`).
  3. `delivered = await mailService.sendMail({ to: row.recipientEmail, ...rendered })`.
  4. `updateMany({ where: { id }, data: delivered ? { status: sent, sentAt: new Date(), lastError: null } : { status: skipped } })`.
- **Khi lỗi:**
  - `isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1)` (khuôn `cv-screenings.processor.ts:87-88`);
  - `updateMany` ghi `lastError` (cắt còn 500 ký tự), cộng `status: failed` nếu là lần cuối. Lệnh ghi này có try/catch riêng để không che lỗi gốc;
  - **luôn** rethrow lỗi gốc.

- [ ] **Step 1: Test đỏ** (`jest.mock('../../common/constants/urls', () => ({ CLIENT_URL: 'http://localhost:3001' }))`; `buildJob(attemptsMade, attempts = 3)` như `cv-screenings.processor.spec.ts`):
  - `returns without sending when the row no longer exists`;
  - `skips a row that is already sent`;
  - `skips a row that is already skipped`;
  - `sends the rendered email to the snapshot address and marks it sent` (assert `sendMail` nhận `to` của row và `subject` của renderer; `updateMany` có `status: 'sent'` và `sentAt`);
  - `marks the row skipped when SMTP is disabled` (`sendMail` resolve `false`);
  - `records lastError and rethrows on a non-final failure without changing the status`;
  - `marks the row failed and rethrows on the final attempt`;
  - `truncates lastError to 500 characters`;
  - `does not throw when the row disappears before it is marked` (`updateMany` resolve `{ count: 0 }`, Review Focus 4).
- [ ] **Step 2:** Run `--testPathPatterns="notification-email.processor"` → FAIL.
- [ ] **Step 3:** Cài; thêm vào `providers` của module.
- [ ] **Step 4:** Run lại → PASS; `rm -rf dist .nx/cache && npx nx build api` → exit 0.
- [ ] **Step 5: Commit** `test(api): add the notification email processor rules`, rồi `feat(api): send queued candidate notification emails`.

---

### Task 7: Nối vào `ApplicationsService`

**Files:**
- Modify `apps/api/src/app/applications/applications.service.ts`:
  - bỏ `NOTIFY_CANDIDATE_ON`, `APPLICATION_STATUS_NOTIFICATION_COPY` (68-97);
  - constructor (99-106);
  - `cancelUpcomingSchedules` (169-181);
  - `apply` (215-295);
  - `withdraw` (313-366);
  - `updateStatus` (545-617);
  - bỏ `notifyCandidateStatusChangeSafe` (716-740) và các import không còn dùng.
- Modify `apps/api/src/app/applications/applications.module.ts`, `applications.service.spec.ts`, `apps/api/src/test-utils/unit-test-helpers.ts` (thêm `'updateManyAndReturn'` vào `interviewSchedule`).

**Interfaces:** Consumes Task 5. Produces:
- **Constructor:** `ApplicationsService(prisma, cvScreeningsService, socketIoService, candidateNotifications: CandidateNotificationsService)`. Tham số thứ 4 thay cho `NotificationsService`.
- **`cancelUpcomingSchedules(tx, applicationId): Promise<CancelledScheduleSummary[]>`:** gọi `tx.interviewSchedule.updateManyAndReturn` với `where` không đổi (`applicationId`, `status: scheduled`, `startAt: { gt: new Date() }`), `data: { status: cancelled }`, `select: { interviewId: true, startAt: true, durationMinutes: true, interviewType: true }`.
- **`apply`:** gọi `applicationReceived(applicationId)` sau khi `$transaction` resolve, rồi mới return.
- **`updateStatus`:**
  - transaction trả `{ updated, cancelled }`, trong đó `cancelled` là kết quả `cancelUpcomingSchedules` khi `dto.status === rejected`, ngược lại `[]`;
  - sau transaction gọi `applicationStatusChanged(applicationId, dto.status, cancelled)` cho **mọi** lần đổi thành công, kể cả hoàn tác.
- **`withdraw`:** không gọi gì.
- **`ApplicationsModule`** import `CandidateNotificationsModule`. Bỏ `NotificationsModule` khỏi imports nếu `grep -rn "NotificationsService" apps/api/src/app/applications` không còn kết quả nào ngoài spec.

- [ ] **Step 1: Test đỏ** (mock `candidateNotifications` có đủ 5 method `jest.fn()`):
  - **Sửa** constructor và các assert được phép ở Global Constraints. Trong 49 cặp, `tx.interviewSchedule.updateManyAndReturn.mockResolvedValue([])` và assert `toHaveBeenCalledWith('app-1', to, [])` đúng 1 lần cho cặp hợp lệ, 0 lần cho cặp bị từ chối.
  - **Thêm:**
    - `notifies once the application is created, after the transaction` (dùng `invocationCallOrder` so với `$transaction`);
    - `does not notify when the application is refused` (đã ứng tuyển → 409);
    - `passes the schedules cancelled by a rejection to the notification`;
    - `withdrawing notifies nobody`;
    - `a revert to interview notifies with the target status`.
- [ ] **Step 2:** Run `--testPathPatterns="applications.service"` → FAIL.
- [ ] **Step 3:** Cài.
- [ ] **Step 4:** Run `--testPathPatterns="applications|candidate-notifications"` → PASS; `rm -rf dist .nx/cache && npx nx build api` → exit 0.
- [ ] **Step 5: Commit** `test(api): expect the application flow to notify through candidate notifications`, rồi `feat(api): notify candidates of application events by email`.

---

### Task 8: Nối vào `InterviewsService`

**Files:**
- Modify `apps/api/src/app/interviews/interviews.service.ts`:
  - constructor (53);
  - `assertCanMutateSchedule` (263-297): thêm `applicationId: true` vào `select`;
  - `createSchedule` (299-337);
  - `updateSchedule` (435-497);
  - `removeSchedule` (499-505).
- Modify `apps/api/src/app/interviews/interviews.module.ts`, `interviews.service.spec.ts`.

**Interfaces:** Consumes Task 5. Produces:
- **Constructor:** `InterviewsService(prisma, candidateNotifications: CandidateNotificationsService)`.
- **`createSchedule`:** gọi `scheduleCreated(toScheduleSnapshot(created))` rồi return `created`.
- **`updateSchedule`:** gọi `scheduleChanged(toScheduleSnapshot(schedule), toScheduleSnapshot(updated))` sau khi `update` resolve, với `schedule` là kết quả của `assertCanMutateSchedule`.
- **`removeSchedule`:** gọi `scheduleRemoved(toScheduleSnapshot(schedule), new Date())` sau khi `delete` resolve. Thứ tự giữ đúng như sau, để khi merge với SP1 (thêm kiểm `count` trước `delete`) chỉ có xung đột cơ học: lấy `schedule` → (kiểm của SP1) → `delete` → gọi notifier → return.
- **`InterviewsModule`** import `CandidateNotificationsModule`.

- [ ] **Step 1: Test đỏ:**
  - sửa constructor trong `beforeEach`;
  - `notifies the candidate after creating a schedule` (snapshot đúng 9 khoá);
  - `does not notify when scheduling is refused` (trùng lịch → 400);
  - `passes the schedule before and after an update`;
  - `does not notify when an update is refused` (`completed` → `scheduled`);
  - `passes the schedule and the removal time after deleting` (fake timers);
  - `does not notify when deleting is refused` (403).
- [ ] **Step 2:** Run `--testPathPatterns="interviews.service"` → FAIL.
- [ ] **Step 3:** Cài.
- [ ] **Step 4:** Run `--testPathPatterns="interviews|candidate-notifications|applications"` → PASS; `rm -rf dist .nx/cache && npx nx build api` → exit 0.
- [ ] **Step 5: Commit** `test(api): expect schedule changes to notify the candidate`, rồi `feat(api): notify candidates of interview schedule changes`.

---

### Task 9: Mailpit trong test stack, hành trình E2E và kiểm chứng toàn bộ

**Files:**
- Modify `docker-compose.test.yml`.
- Create:
  - `apps/web/e2e/gd2-email-notifications.e2e.ts`;
  - `apps/web/e2e/support/gd2-email-fixtures.mjs`, `apps/web/e2e/support/mailpit.mjs`;
  - `docs/tasks/gd2-sp3-email-notifications/results/{api-test.log,api-lint.log,api-build.log,web-test.log,web-typecheck.log,web-lint.log,e2e-sp3.log,e2e-full.log}`;
  - `docs/tasks/gd2-sp3-email-notifications/README.md`.

**Interfaces:**
- **`docker-compose.test.yml`:**
  - thêm service `mailpit`: `image: axllent/mailpit:v1.30.0`; `environment: { MP_SMTP_AUTH_ACCEPT_ANY: "1", MP_SMTP_AUTH_ALLOW_INSECURE: "1", MP_MAX_MESSAGES: "5000" }`; `ports: ["127.0.0.1:51025:1025", "127.0.0.1:58025:8025"]` (**không** dùng 1025/8025, đang thuộc `english-learning-mailpit-1`);
  - `api.environment`: đổi `SMTP_ENABLED: "true"` và thêm `SMTP_HOST: mailpit`, `SMTP_PORT: "1025"`, `SMTP_SECURE: "false"`, `SMTP_USER: ats-test`, `SMTP_PASS: ats-test-not-a-secret`, `SMTP_FROM: "ATS Test <no-reply@ats.test>"`;
  - `api.depends_on.mailpit.condition: service_healthy` (image có sẵn healthcheck `/mailpit readyz`);
  - sửa comment dòng 2 thành "mail goes only to this stack's own Mailpit".
- **`mailpit.mjs`:**
  - `mailpitUrl()`: `WEB_E2E_MAILPIT_URL`, mặc định `http://127.0.0.1:58025`, chỉ cho localhost;
  - `waitForMessagesTo(address, count, timeoutMs = 30_000)`: poll `/api/v1/search?query=` + `encodeURIComponent('to:"<address>"')` mỗi 500 ms, trả `messages` khi `length >= count`, hết giờ thì ném lỗi kèm số đã thấy;
  - `readMessage(id)`: `GET /api/v1/message/<id>` → `{ Subject, HTML, Text, To }`.
- **`gd2-email-fixtures.mjs`:**
  - `createGd2EmailFixtures(apiUrl)`: khuôn `createGd2ScheduleFixtures`, cùng các assert cổng 55000 và health. Có tổ chức, khoa, recruiter, ứng viên với CV `completed` và dòng `cv_parsed_data` có `is_confirmed = true`, một tin `active` có tiêu đề `GĐ2 email <b>${suffix}</b> & co`. **Không** tạo đơn;
  - `emailRowsOf(applicationId)` → `[{ type, status }]` theo `created_at`;
  - `cleanupGd2EmailFixtures(fixture)`: khuôn `cleanupGd2Fixtures`, thêm `email_notifications` đầu danh sách xoá. Trả `{ organizationsRemaining, usersRemaining }`.
- **Journey `test.describe('GĐ2 SP3 — email thông báo cho ứng viên')`:** serial; `waitForAuthWindow()` rồi đăng nhập recruiter và ứng viên qua `POST ${apiBaseUrl()}/auth/login`; `startAt` = 3 ngày sau lúc `02:30Z`.
  1. `nộp đơn gửi email xác nhận tới đúng địa chỉ ứng viên`: `POST /applications` → 201 → chờ 1 mail; `Subject` = `Đã nhận đơn ứng tuyển: <tiêu đề>`; `HTML` chứa `&lt;b&gt;`; `Text` chứa `<b>`.
  2. `sang screening không gửi, sang interview gửi email mời phỏng vấn`.
  3. `tạo lịch online gửi email có giờ Việt Nam và có thông báo in-app`: `POST /interviews/schedules` (interviewer = recruiter); mail chứa `09:30–10:30` và ngày VN tính bằng `Intl` với `Asia/Ho_Chi_Minh`; `GET /notifications` của ứng viên có `Bạn có lịch phỏng vấn mới`.
  4. `đổi giờ gửi email kèm giờ cũ`: `PATCH /interviews/schedules/:id` sang `03:30Z` → mail có `10:30–11:30` và dưới `Trước đây:` có `Thời gian: 09:30–10:30`.
  5. `từ chối gửi một email trung tính liệt kê lịch bị hủy, không lộ lý do`: `PATCH /applications/:id/status` với `{ status: 'rejected', rejectionReason: 'Thiếu NestJS' }` → mail `Kết quả đơn ứng tuyển: …` chứa `Buổi phỏng vấn lúc 10:30–11:30` và `đã được hủy`, **không** chứa `Thiếu NestJS`.
  6. `tổng cộng đúng 5 email, không có email hủy riêng, mọi row đã sent`: sau khi đủ 5 mail, chờ thêm 3 giây rồi assert vẫn là 5. Không subject nào bắt đầu bằng `Lịch phỏng vấn đã bị hủy`. `emailRowsOf` có đúng 5 dòng `sent` với các type `application_received`, `application_interview`, `schedule_created`, `schedule_updated`, `application_rejected`.
  
  `afterAll` gọi cleanup và assert `{ organizationsRemaining: 0, usersRemaining: 0 }`.

- [ ] **Step 1:** Viết hai file support và journey; sửa `docker-compose.test.yml`.
- [ ] **Step 2: Kiểm không cần test stack**, mỗi lệnh lưu log tương ứng trong `results/`, expected exit 0:
  - `npx jest --config apps/api/jest.config.ts --runInBand --silent`;
  - `npx nx lint api`;
  - `rm -rf dist .nx/cache && npx nx build api`;
  - `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`.
- [ ] **Step 3: Giữ khoá test stack dùng chung, rồi chạy E2E** (bash):

```bash
mkdir "$LOCALAPPDATA/ats-e2e.lock" || { echo "E2E lock is held by another run: STOP"; exit 1; }
trap 'docker compose -f docker-compose.test.yml stop; rmdir "$LOCALAPPDATA/ats-e2e.lock"' EXIT
docker compose -f docker-compose.test.yml up -d --build --wait --wait-timeout 180
node apps/web/e2e/support/prepare-local.mjs
# WEB_E2E_* như docs/tasks/test-defect-fixes/README.md:73-79 (WEB_E2E_ORGANIZATION_ID lấy từ
# docs/tasks/test-defect-fixes/results/local-fixture.json); API_INTERNAL_URL=http://localhost:55000/api
TZ=UTC npx playwright test --config apps/web/playwright.config.ts gd2-email-notifications 2>&1 | tee docs/tasks/gd2-sp3-email-notifications/results/e2e-sp3.log
TZ=UTC npm run test:e2e:web 2>&1 | tee docs/tasks/gd2-sp3-email-notifications/results/e2e-full.log
```

  Nếu `mkdir` thất bại thì DỪNG và báo; **không** xoá khoá của người khác. Expected: `e2e-sp3` 6/6 pass; `e2e-full` mọi journey pass, không retry, không skip. Một journey **có sẵn** mà đỏ thì DỪNG và báo kèm log; không sửa journey đó. Không dùng `down -v` (test stack dùng chung).
- [ ] **Step 4:** Viết `README.md` theo khuôn `docs/tasks/gd2-week1/README.md`:
  - bảng lệnh → kết quả → log;
  - bảng C1–C15 → test hoặc log làm bằng chứng;
  - mục "Chưa xác minh", nói thật:
    - Gmail SMTP production chưa chạy;
    - retry với SMTP thật bị sập chưa thử (Status Tracker vẫn 🟡);
    - thứ tự email #2/#6 tới hộp thư không đảm bảo (E9);
    - job `web-e2e` của CI chưa chạy cho tới khi có PR;
    - hai ASSUMPTION chờ người dùng.
- [ ] **Step 5: Commit** `test(e2e): add the candidate email journey on a dedicated mailpit` (compose + 3 file E2E + `e2e-*.log`), rồi `docs(tasks): record the gđ2 sp3 results` (README + các log còn lại).

## Self-review

- **Phủ spec:**
  - R1, R13 → Task 5 (`records and enqueues…`); R2, R3 → Task 5 (`does nothing for…`) và Task 7 (`withdrawing…`, `a revert…`);
  - R4 → Task 5 và Task 7; R5 → Task 5 (`schedule-changes`, `scheduleChanged`); R6 → Task 5 (`scheduleRemoved`) và Task 8;
  - R7, R8, R9 → Task 4; R10 → Task 5 (`never rejects…`) và Task 7, 8 (gọi sau commit);
  - R11, R12 → Task 3, 6; R14 → Task 5; R15 → không có code; R16 → Task 5 (module, grep `defaultJobOptions`); R17 → Task 5;
  - C13 → Task 2; C14 → Task 9; C1–C12, C15 → unit test ở Task 3–8;
  - E1 → Task 5 (`recipientEmail` chụp); E2 → Task 6 (render từ payload); E3 → mỗi lần gọi một row (Task 5); E4–E6 → Task 5; E7 → Task 4; E8 → Task 8; E9 → ghi trong README; E10 → Task 5; E11 → ghi trong spec R11; E12 → Task 5; E13 → test dùng `platformAdmin` có sẵn.
- **Nhất quán tên:**
  - `ScheduleSnapshot`, `CancelledScheduleSummary`, `toScheduleSnapshot` định nghĩa ở Task 5, dùng ở Task 7, 8;
  - `NotificationEmailPayload`, `renderNotificationEmail`, `formatInterviewTime` định nghĩa ở Task 4, dùng ở Task 5, 6;
  - `sendMail`/`readTemplate` định nghĩa ở Task 3, dùng ở Task 6;
  - `NOTIFICATION_EMAIL_QUEUE`, `SEND_NOTIFICATION_EMAIL_JOB` định nghĩa ở Task 5, dùng ở Task 6.
- **Rủi ro còn mở:**
  - xung đột merge ở 5 file nêu trong Global Constraints;
  - cú pháp `to:"…"` của Mailpit và việc chấp nhận AUTH chỉ được chứng minh ở Task 1;
  - hành vi của job `web-e2e` trên CI khi phải kéo thêm image Mailpit chưa chạy;
  - `prisma migrate diff` có thể không dùng được để so schema với migration (Task 2 có control).
