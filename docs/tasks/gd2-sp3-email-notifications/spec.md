# Spec — GĐ2 SP3: email thông báo tự động cho ứng viên (A-02)

**Ngày:** 2026-10-13 · **Trạng thái:** đã chấp nhận để lập plan. Phiên điều phối báo người dùng đã cho viết plan; hai
điểm ở "Điểm cần xác nhận" vẫn chờ người dùng · **Nguồn:** đề cương GĐ2 (mục "email tự động", mã A-02), các quyết định ở
[decision.md](decision.md) · Plan: [plan.md](plan.md). Chưa commit (xem "Nhánh" ở cuối file).

## Mục tiêu

Ứng viên biết đơn của mình đang ở đâu và có lịch phỏng vấn nào **mà không phải đăng nhập**: hệ thống gửi email
khi đơn được nhận, khi đơn đổi sang một trạng thái có ý nghĩa với ứng viên, và khi lịch phỏng vấn được tạo, đổi
hoặc huỷ. Hiện ứng viên không nhận email nào về đơn hay lịch. In-app chỉ có cho 4 trạng thái đơn
(`applications.service.ts:68-97`), còn tạo lịch thì không thông báo gì (`interviews.service.ts:299-337`).
Email chỉ báo tin, không thay người ra quyết định: không có điểm hay gợi ý AI (ADR 0002).

## Vị trí trong GĐ2

| Spec | Gồm | Trạng thái |
|---|---|---|
| SP1 | Scorecard (A-01), ghi chú (A-07), so sánh ứng viên | spec có trên `dev` (`docs/tasks/gd2-week2-evaluation/`) |
| SP2 | Chấm CV hàng loạt, xuất CSV (A-05) | đang viết spec (phiên khác) |
| **SP3 (spec này)** | Email thông báo tự động (A-02) và in-app cho sự kiện lịch | đang viết |

## Ngoài phạm vi SP3

Opt-out hoặc cài đặt nhận email (D6) · email cho staff hoặc interviewer · email hoặc thông báo cho recruiter khi có
scorecard (xem "Điểm cần xác nhận") · nhắc lịch trước giờ
phỏng vấn · file `.ics` hoặc lời mời calendar · sweep tự gửi lại row còn `pending` · màn hình "lịch sử email" và mọi
endpoint đọc bảng `email_notifications` · đa ngôn ngữ (chỉ tiếng Việt) · cấu hình SMTP production · địa điểm dạng text
cho tin tuyển dụng (việc khác).

## Các email

Người nhận luôn là ứng viên của đơn. Tiêu đề là bản dự kiến, câu chữ cuối cùng chốt ở plan.

| # | `type` | Gửi khi | Tiêu đề (dự kiến) | Nội dung chính | Link |
|---|---|---|---|---|---|
| 1 | `application_received` | `apply` thành công | Đã nhận đơn ứng tuyển: {tin} | tin, tổ chức, ngày nộp | `/my-applications/<id>` |
| 2 | `application_interview` | đơn sang `interview` | Bạn được mời vào vòng phỏng vấn: {tin} | tin, tổ chức, "nhà tuyển dụng sẽ gửi lịch phỏng vấn" | `/my-applications/<id>` |
| 3 | `application_offer` | đơn sang `offer` | Đề nghị tuyển dụng: {tin} | tin, tổ chức | `/my-applications/<id>` |
| 4 | `application_hired` | đơn sang `hired` | Chúc mừng bạn đã trúng tuyển: {tin} | tin, tổ chức | `/my-applications/<id>` |
| 5 | `application_rejected` | đơn sang `rejected` | Kết quả đơn ứng tuyển: {tin} | câu chung "hồ sơ của bạn chưa phù hợp với vị trí này"; nếu có lịch bị huỷ theo thì thêm "buổi phỏng vấn lúc … đã được huỷ" cho từng lịch | `/my-applications/<id>` |
| 6 | `schedule_created` | `createSchedule` | Lịch phỏng vấn: {tin} | giờ VN (bắt đầu–kết thúc), thời lượng, online + link hoặc trực tiếp + địa chỉ, tên interviewer | `/my-interviews` |
| 7 | `schedule_updated` | `updateSchedule` đổi một trường ứng viên thấy (R5) | Lịch phỏng vấn đã thay đổi: {tin} | chi tiết mới như #6, kèm giá trị cũ của các trường đã đổi | `/my-interviews` |
| 8 | `schedule_cancelled` | lịch bị huỷ hoặc bị xoá khi chưa diễn ra (R6) | Lịch phỏng vấn đã bị huỷ: {tin} | buổi nào bị huỷ (giờ VN, hình thức) | `/my-interviews` |

**Không gửi email khi:** ứng viên tự rút đơn · đơn sang `screening` · lịch sang `completed` · có kết quả sàng lọc AI.

## Quy tắc

| # | Quy tắc |
|---|---|
| R1 | Người nhận duy nhất là ứng viên của đơn. Địa chỉ là `candidate.user.email`, chụp lúc phát sự kiện. |
| R2 | Chỉ 8 sự kiện ở bảng trên phát email. Mọi đường đổi trạng thái hoặc lịch khác không gửi. |
| R3 | Email trạng thái theo **trạng thái đích** của lần đổi, kể cả khi hoàn tác (`isReverted`). Hoàn tác về `applied` hoặc `screening` không gửi gì. |
| R4 | Từ chối kéo theo huỷ lịch (R7 tuần 1) chỉ gửi **một** email #5, liệt kê các lịch vừa huỷ. Không gửi #8 cho các lịch đó. |
| R5 | #7 chỉ gửi khi lịch sau cập nhật vẫn `scheduled` và ít nhất một trong các trường `startAt`, `durationMinutes`, `interviewType`, `onlineMeetingLink`, `location`, `interviewerId` có giá trị khác trước. Cập nhật không đổi giá trị nào thì không gửi. |
| R6 | #8 gửi khi lịch `scheduled` chuyển sang `cancelled`, hoặc khi `removeSchedule` xoá một lịch `scheduled` có `startAt` sau thời điểm xoá. Xoá lịch đã qua giờ, `completed` hoặc `cancelled` thì không gửi. |
| R7 | Email không chứa điểm, gợi ý hay bất kỳ trường AI nào, không chứa lý do từ chối (`rejectionReason`) và ghi chú của staff. Email từ chối dùng câu chung (D7, ADR 0002, D8 tuần 1). |
| R8 | Mọi thời điểm hiển thị theo `Asia/Ho_Chi_Minh`, qua **một** hàm format duy nhất, có ghi "(giờ Việt Nam)". |
| R9 | Mọi giá trị động trong HTML (tên tin, tổ chức, ứng viên, interviewer, địa chỉ, link) đi qua một hàm escape chung. Link họp đã được DTO giới hạn ở `http`/`https`. |
| R10 | Email và in-app được phát **sau khi** transaction commit và không bao giờ làm request chính lỗi hay rollback. Lỗi chỉ được ghi `Logger.warn`. |
| R11 | Mỗi email là một row `email_notifications`, job BullMQ có `jobId` = id của row. Processor không gửi lại row đã `sent` hoặc `skipped`. Bảo đảm là gửi ít nhất một lần (at-least-once), không phải đúng một lần. |
| R12 | Khi `SMTP_ENABLED` không phải `true`, processor đánh dấu row `skipped` và không gửi. |
| R13 | Row mang `organizationId` của đơn, không nhận từ client. SP3 không thêm endpoint nào. |
| R14 | In-app 4 trạng thái giữ nguyên câu chữ hiện tại. Thêm in-app cho #6–#8 với `NotificationType.interview`, `RelatedEntityType.interview`, `relatedEntityId` = `interviewId`. #1 không có in-app. |
| R15 | Không có opt-out: ứng viên nào cũng nhận đủ 8 loại email (D6). |
| R16 | Retry kế thừa `forRoot`: 3 lần, exponential 10 s (`app.module.ts:46-64`). Không truyền `defaultJobOptions` ở `registerQueue`. Queue giới hạn 30 email/phút bằng `setGlobalRateLimit`, giống queue xác minh (`auth.module.ts:49`). |
| R17 | *(người dùng xác nhận 2026-10-14)* Tài khoản ứng viên `UserStatus.inactive` lúc phát sự kiện không được gửi email: row vẫn được ghi nhưng ở `skipped` và không enqueue. In-app vẫn tạo như cũ. Ứng viên `active` nhận email như bình thường. |

## Thiết kế

### Luồng

```
ApplicationsService.apply / updateStatus ─┐                                     ┌─► NotificationsService (in-app 4 trạng thái như cũ + #6–#8)
InterviewsService.create/update/remove ───┴─► CandidateNotificationsService ───┤
            (gọi SAU commit, không throw)                                       └─► ghi row email_notifications (pending, payload)
                                                                                   └─► queue 'notification-email' (jobId = row id)
                                                                                         └─► NotificationEmailProcessor: đọc row → render → MailService.sendMail
                                                                                               → sent | skipped | failed
```

### Thành phần

- **Module mới `apps/api/src/app/candidate-notifications/`**:
  - `CandidateNotificationsService`, mỗi sự kiện một method public: nhận đơn, đổi trạng thái (kèm danh sách lịch bị huỷ
    theo), tạo lịch, đổi lịch (kèm trạng thái trước), huỷ lịch. Mỗi method dựng payload, ghi row, enqueue và tạo in-app
    khi cần, toàn bộ bọc trong try/catch (R10).
  - `NotificationEmailProcessor` trên queue `notification-email`, concurrency 5 như processor xác minh.
  - Các hàm render, mỗi `type` một hàm trả `{ subject, html, text }`, cùng hàm format giờ VN (R8) và hàm escape (R9).
- **`notifyCandidateStatusChangeSafe`, `NOTIFY_CANDIDATE_ON` và `APPLICATION_STATUS_NOTIFICATION_COPY`** chuyển từ
  `applications.service.ts:68-97, 716-740` sang service mới, câu chữ in-app giữ nguyên. `ApplicationsService` chỉ còn một
  lời gọi.
- **`MailService`** thêm `sendMail({ to, subject, html, text })` và cho processor đọc được cờ SMTP đang bật. Hai hàm email
  cũ không đổi.
- **Template:** một file `apps/api/src/assets/mail/notification-layout.html`, giữ giao diện TalentAI của hai email hiện có
  và có một chỗ để chèn nội dung. Nội dung từng email viết trong TS (D4). Webpack đã copy `src/assets` sang `dist`
  (`webpack.config.js:18`).
- **Link về web** lấy từ `CLIENT_URL` (`common/constants/urls.ts`).
- **Giờ VN** dùng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })`, không thêm thư viện.

### Dữ liệu (một migration Prisma mới, tên dự kiến `<timestamp>_add_email_notifications`)

- Enum `EmailNotificationType`: 8 giá trị ở cột `type` của bảng email trên.
- Enum `EmailNotificationStatus`: `pending | sent | failed | skipped`.
- Hai enum mới chép tay vào `libs/shared/types/src/lib/enums.ts` trong cùng commit (`libs/CLAUDE.md:36`).
- `EmailNotification` → `email_notifications`:
  - `id` (uuid); `organizationId` (FK `Organization`); `recipientUserId` (FK `User`, `onDelete: Cascade`); `recipientEmail`;
  - `applicationId` (FK `Application`, `onDelete: Cascade`: các hàm cleanup E2E hiện có xoá `applications` theo tổ chức,
    vd `apps/web/e2e/support/gd2-fixtures.mjs:114-141`, nên FK không cascade sẽ làm vỡ cleanup của các E2E cũ);
    `organizationId` FK `onDelete: Restrict` như mọi bảng tenant khác; `interviewId` (`String?`, **không** có FK vì lịch
    có thể bị xoá cứng);
  - `type`, `status` (mặc định `pending`), `payload` (`Json`), `lastError` (`VarChar(500)?`), `createdAt`, `sentAt?`;
  - index theo `organizationId` và `applicationId`.
- `payload` là **ảnh chụp lúc phát sự kiện**: tên ứng viên, tin, tổ chức, ngày nộp, chi tiết lịch (giờ, thời lượng, hình
  thức, link hoặc địa chỉ, tên interviewer), giá trị cũ (#7), danh sách lịch bị huỷ (#5). Processor render từ payload,
  không đọc lại DB, nên lịch bị xoá cứng vẫn render được và retry ra đúng nội dung cũ.
- Quan hệ ngược thêm vào `Organization`, `User`, `Application`.

### Điểm phát sự kiện

| Chỗ | Thay đổi |
|---|---|
| `applications.service.ts` `apply` (215-295) | Sau transaction gọi "nhận đơn" (#1). |
| `applications.service.ts` `cancelUpcomingSchedules` (169-181) | Trả về các lịch vừa huỷ (id, giờ, thời lượng, hình thức). `withdraw` bỏ qua kết quả này. |
| `applications.service.ts` `updateStatus` (545-617) | Sau transaction gọi "đổi trạng thái" với trạng thái đích và các lịch vừa huỷ (R3, R4). |
| `applications.service.ts` `withdraw` (313-366) | Không gọi gì. |
| `interviews.service.ts` `createSchedule` (299-337) | Sau khi tạo, gọi "tạo lịch" (#6 + in-app). |
| `interviews.service.ts` `updateSchedule` (435-497) | So trạng thái trước (đã đọc trong `assertCanMutateSchedule`, 263-297) với sau: sang `cancelled` thì gọi "huỷ" (#8); sang `completed` thì không gửi; còn lại, nếu R5 thoả thì gọi "đổi" (#7). |
| `interviews.service.ts` `removeSchedule` (499-505) | Đọc lịch trước khi xoá; nếu R6 thoả thì gọi "huỷ" (#8) sau khi xoá. |

### Lỗi

| Chỗ lỗi | Hành vi |
|---|---|
| Ghi row hoặc tạo in-app lỗi | `Logger.warn`, request vẫn 2xx, email đó không được gửi. |
| Enqueue lỗi (Redis sập) | Row nằm lại ở `pending` và có log. Không tự gửi lại trong SP3. |
| Processor: row không còn | Log, kết thúc job. |
| Processor: row đã `sent`/`skipped` | Bỏ qua, không gọi SMTP. |
| Processor: SMTP tắt | `skipped`. |
| Processor: SMTP lỗi | Ghi `lastError` rồi rethrow để BullMQ retry. Ở lần cuối (`attemptsMade` so với `opts.attempts`) đánh dấu `failed` rồi rethrow. |

Web không đổi gì: chuông in-app hiện thông báo mà không lọc theo `type` (grep `NotificationDropdown.tsx`, không thấy chỗ
lọc), và bấm vào thì chỉ đánh dấu đã đọc (`NotificationDropdown.tsx:72`).

## Tiêu chí chấp nhận

| # | Tiêu chí | Kiểm bằng |
|---|---|---|
| C1 | Nộp đơn → một row `application_received` gửi tới email ứng viên; nộp lỗi (409, 400) → không có row | API unit + E2E |
| C2 | Đổi sang `interview`/`offer`/`hired`/`rejected` → đúng loại email và in-app như cũ (câu chữ không đổi); sang `screening` → không có row | API unit |
| C3 | Hoàn tác `rejected` → `interview` gửi #2; hoàn tác về `screening` hoặc `applied` không gửi | API unit |
| C4 | Từ chối một đơn có một lịch sắp tới và một lịch đã qua: chỉ lịch sắp tới bị huỷ, #5 liệt kê đúng lịch đó, không có row #8 | API unit + E2E |
| C5 | Rút đơn → không có row email, không có in-app | API unit |
| C6 | Tạo lịch → #6 và in-app `interview`; `startAt` `2026-10-20T02:30:00Z`, 60 phút → email ghi `09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)` (chuỗi `Intl` đã chạy thử ở cả image API lẫn Node trên máy) | API unit + E2E |
| C7 | Sửa lịch: đổi từng trường trong 6 trường R5 → #7 có giá trị cũ; PATCH với giá trị y hệt → không gửi; sang `completed` → không gửi; sang `cancelled` → #8 | API unit |
| C8 | Xoá lịch `scheduled` sắp tới → #8; xoá lịch đã qua giờ, `completed` hoặc `cancelled` → không gửi | API unit |
| C9 | Không email nào chứa điểm hay gợi ý AI, `rejectionReason` hoặc ghi chú staff, kể cả khi đơn có screening và lý do từ chối | API unit + E2E |
| C10 | Tên tin `<script>alert(1)</script>` hiện thành chữ trong HTML, không thành thẻ | API unit |
| C11 | Ghi row, enqueue hoặc in-app ném lỗi → request vẫn thành công, trạng thái đơn/lịch đã đổi, có `Logger.warn` | API unit |
| C12 | Processor: row `sent`/`skipped` → không gọi `sendMail`; SMTP tắt → `skipped`; SMTP lỗi → rethrow, ghi `lastError`, lần cuối `failed`; thành công → `sent` + `sentAt` | API unit |
| C13 | Migration chạy trên PostgreSQL thật (container dùng một lần); FK: xoá user hoặc đơn → row bị xoá theo, tổ chức → `RESTRICT` | probe |
| C14 | Hành trình thật trên test stack có Mailpit: nộp đơn → #1; sang `interview` → #2; tạo lịch → #6 đúng giờ VN; đổi giờ → #7 có giờ cũ; từ chối → #5 có dòng lịch huỷ và không có #8. Đọc từ API Mailpit: đúng người nhận, đúng nội dung; các row ở `sent` | E2E |
| C15 | Ứng viên `inactive` (R17) → row `skipped`, không enqueue, in-app vẫn tạo | API unit |

### Edge case

| # | Trường hợp | Hành vi |
|---|---|---|
| E1 | Ứng viên đổi email sau khi sự kiện phát, trước khi job chạy | Gửi tới địa chỉ đã chụp lúc phát (R1) |
| E2 | Lịch bị xoá cứng trước khi job #6/#7 chạy | Vẫn render từ payload |
| E3 | Hai PATCH liên tiếp đổi giờ A → B → C | Hai email #7, mỗi email đúng giờ cũ/mới của lần đó |
| E4 | Một PATCH vừa đổi giờ vừa sang `cancelled` | Chỉ #8 |
| E5 | Một PATCH vừa đổi trường vừa sang `completed` | Không gửi |
| E6 | Huỷ (đổi status) một lịch `scheduled` đã qua giờ | Vẫn gửi #8 (R6 chỉ giới hạn trường hợp xoá) |
| E7 | Lịch onsite cũ không có `location` | Email ghi địa điểm "chưa cập nhật", không lỗi |
| E8 | Tạo hoặc sửa lịch bị từ chối (400, 403, 409) | Không gửi |
| E9 | Sang `interview` rồi tạo lịch ngay | #2 rồi #6; thứ tự tới hộp thư không đảm bảo (concurrency 5) |
| E10 | Redis sập lúc enqueue | Row nằm `pending`, không tự gửi lại (ngoài phạm vi) |
| E11 | SMTP đã nhận mail rồi worker chết trước khi ghi `sent` | Có thể nhận bản lặp (at-least-once, R11) |
| E12 | Tài khoản ứng viên `inactive` | Không gửi: row `skipped` (R17, người dùng xác nhận 2026-10-14) |
| E13 | org_admin hoặc platform admin đổi trạng thái hay lịch | Như recruiter; `organizationId` vẫn lấy từ đơn |

## Kiểm thử và quy trình

- **Unit** (`nx test api`): service mới, processor, các hàm render, cùng spec của `applications.service` và
  `interviews.service` cho các điểm phát sự kiện. Dùng `createQueueMock` và `createPrismaMock` trong
  `src/test-utils/unit-test-helpers.ts`.
- **Mailpit riêng trong `docker-compose.test.yml`** (D5):
  - Thêm service `mailpit`, image có pin tag, UI/API chỉ mở ở `127.0.0.1` với cổng riêng của dự án. Không dùng chung
    Mailpit của `english-learning`.
  - API của test stack đổi `SMTP_ENABLED` sang `"true"`, `SMTP_HOST: mailpit`, `SMTP_PORT: "1025"`, cùng
    `SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` giả, vì env validation bắt buộc ba biến này khi bật SMTP
    (`env.validation.ts:73-86`).
- **Probe** PostgreSQL thật cho migration và cascade.
- **E2E** cho C14.
- Theo khuôn tuần 1: lỗi tìm thấy khi làm thì commit test đỏ trước, commit sửa sau. Kết quả và log ghi vào
  `results/` của thư mục này.
- Mục BullMQ retry trong Status Tracker vẫn 🟡: SP3 không thử retry với một SMTP thật bị sập.

## File dự định sửa và phối hợp với SP1/SP2

- **Mới:**
  - `apps/api/src/app/candidate-notifications/*` (module, service, processor, render, specs);
  - `apps/api/src/assets/mail/notification-layout.html`;
  - migration `<timestamp>_add_email_notifications`;
  - một spec E2E dưới `apps/web/e2e/`.
- **Sửa:**
  - `libs/backend/database/prisma/schema.prisma`, `libs/shared/types/src/lib/enums.ts`;
  - `apps/api/src/common/mail/mail.service.ts`;
  - `apps/api/src/app/applications/applications.service.ts`: `apply`, `updateStatus`, `cancelUpcomingSchedules`, bỏ
    phần in-app chuyển đi;
  - `apps/api/src/app/applications/applications.module.ts`;
  - `apps/api/src/app/interviews/interviews.service.ts`: `createSchedule`, `updateSchedule`, `removeSchedule`;
  - `apps/api/src/app/interviews/interviews.module.ts`;
  - `docker-compose.test.yml`;
  - các spec liên quan.
- **Chồng lấn:**
  - SP1 cũng sửa `InterviewsService.removeSchedule` (409 khi đã có scorecard) và `schema.prisma` (quan hệ ngược trên
    `Organization`, `User`, `Application`), đồng thời có migration riêng.
  - SP2 sửa `triggerScreening` trong `applications.service.ts`: cùng file, khác hàm.
  - Thứ tự timestamp migration và thứ tự merge chốt ở bước plan.

## Điểm cần xác nhận (ASSUMPTION, mặc định do phiên điều phối đặt ngày 2026-10-13)

1. **Thông báo cho recruiter khi có scorecard nằm ngoài phạm vi SP3.** Spec SP1 đã được sửa thành *"chưa thuộc spec nào:
   SP3 chỉ gửi cho ứng viên"* (`docs/tasks/gd2-week2-evaluation/spec.md:29`).
2. **Ứng viên `inactive` không nhận email** (R17, C15, E12). Mặc định ban đầu lúc viết spec là vẫn gửi. Phiên điều phối đổi
   lại, vì tài khoản đã bị khoá không nên nhận thư của nền tảng. **Người dùng xác nhận 2026-10-14:** ứng viên `inactive`
   không nhận email, ứng viên `active` nhận như bình thường.

## Chưa xác minh

- **Gửi qua Gmail SMTP production** (cấu hình mẫu ở `.env.example:14-20`) chưa từng chạy, và không kiểm được ở local: độ tin
  cậy giao mail và giới hạn gửi đều chưa biết.
- **Mailpit chấp nhận AUTH với user/pass giả.** Documented: `MP_SMTP_AUTH_ACCEPT_ANY` và `MP_SMTP_AUTH_ALLOW_INSECURE`
  (https://mailpit.axllent.org/docs/configuration/runtime-options/, đọc 2026-10-13). Chưa chạy; plan kiểm ở Task 1 và
  DỪNG nếu sai.
- **API của Mailpit.** Documented: `GET /api/v1/search?query=…`, `GET /api/v1/message/{ID}` (trường `HTML`, `Text`,
  `Subject`, `To[].Address`) trong
  https://raw.githubusercontent.com/axllent/mailpit/master/server/ui/api/v1/swagger.json (đọc 2026-10-13). Cú pháp
  `to:` của query chưa chạy; plan kiểm ở Task 1.
- **E2E hiện có khi test stack bật SMTP.** Các fixture hiện tại ghi user thẳng vào DB, không gọi `auth/register` (grep
  `apps/web/e2e`). Hành trình lịch phỏng vấn tuần 1 sẽ sinh email vào Mailpit. Chạy lại toàn bộ E2E ở task cuối của plan.
- **Nodemailer với ký tự đặc biệt của tên tin trong tiêu đề** (**ASSUMPTION** an toàn; có unit test và kiểm trong E2E).
- **Đã kiểm trong phiên này** (để không phải kiểm lại):
  - Image `node:24-bookworm-slim` của API mặc định UTC, ICU 78.3; Node trên máy là v24.11.0, ICU 77.1. Cả hai cho ra
    `09:30`, `Thứ Ba, 20/10/2026` và `23:30` → `00:30` với `hourCycle: 'h23'`.
  - Docs BullMQ ghi job đã bị xoá thì không còn tính trùng `jobId` (https://docs.bullmq.io/guide/jobs/job-ids, đọc
    2026-10-13), trong khi `forRoot` đặt `removeOnComplete: true` (`app.module.ts:62`).
  - Prisma client đã generate (Prisma CLI 7.8.0) có `interviewSchedule.updateManyAndReturn`, nhận `select`
    (`libs/backend/database/src/generated/prisma/models/InterviewSchedule.ts`). Plan dùng nó và kiểm lại sau khi generate.
  - Container `english-learning-mailpit-1` giữ `127.0.0.1:1025` và `127.0.0.1:8025` (`docker ps`). Image
    `axllent/mailpit` trên máy là v1.30.0 (`mailpit version`) và có sẵn healthcheck `/mailpit readyz` (`docker inspect`).

## Nhánh

Nhánh thực thi: `feat/gd2-sp3-email-notifications`, cắt từ `origin/dev` (`93ad69b`), trong một worktree riêng (đề xuất
`E:\wt\ats-sp3`, xem `docs/tasks/gd2-parallel-execution/README.md`). Phiên điều phối tạo worktree cùng người dùng. Spec,
decision và plan hiện là file untracked trong checkout dùng chung.
