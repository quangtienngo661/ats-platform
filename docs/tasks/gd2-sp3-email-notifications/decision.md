# Decision record — GĐ2 SP3: email thông báo tự động (A-02)

**Ngày:** 2026-10-13 · Spec: [spec.md](spec.md) · Nguồn: các câu hỏi (`AskUserQuestion`) và câu trả lời trong buổi brainstorm
cùng ngày. Chỉ ghi các phương án đã thật sự được đưa ra trong chat.

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D1 | Sự kiện nào gửi email cho ứng viên | Lịch tạo/đổi/huỷ + 4 trạng thái + xác nhận nhận đơn: 8 email, xác nhận lại ở vòng 2 | Người dùng (hai vòng) |
| D2 | Đơn bị `rejected` làm lịch sắp tới tự huỷ (R7 tuần 1) | Gộp vào email từ chối | Người dùng |
| D3 | Cơ chế gửi | Queue `notification-email` + bảng `email_notifications` | Người dùng |
| D4 | Cách làm template | Một layout HTML + nội dung từng email trong TS | Người dùng |
| D5 | Cách chứng minh email gửi thật | Unit + Mailpit riêng trong test stack | Người dùng |
| D6 | Opt-out | Không có opt-out, không ghi rủi ro bị báo spam | Người dùng (bốn vòng, trả lời tự do ở vòng cuối) |
| D7 | Email từ chối có kèm lý do không | Không nêu lý do, chỉ một câu chung "chưa phù hợp với vị trí này" | Người dùng (trả lời tự do) |
| D8 | In-app cho sự kiện chưa có in-app | Thêm in-app cho #6–#8 (lịch) | Người dùng |

## D1 — Sự kiện nào gửi email

**Bối cảnh.** Hiện ứng viên không nhận email nào về đơn hay lịch. In-app chỉ có khi đơn sang `interview`, `offer`,
`hired`, `rejected` (`applications.service.ts:68-97`). `createSchedule` không thông báo gì (`interviews.service.ts:299-337`).
Trước câu hỏi, Claude ghi lại cách hiểu và một ASSUMPTION: người nhận chỉ là ứng viên.

**Vòng 1.** "Những sự kiện nào sẽ gửi email cho ứng viên?" Câu hỏi định nghĩa "đổi lịch" là đổi giờ, thời lượng, hình
thức, địa điểm/link hoặc người phỏng vấn.

| Phương án | Trade-off | |
|---|---|---|
| Lịch + 4 trạng thái (khuyến nghị) | Lấp đúng lỗ A-02, email khớp chuông in-app; chưa có email xác nhận đã nhận đơn | |
| Như trên + xác nhận nhận đơn | Ứng viên biết đơn đã tới; nhưng đây là loại email nhiều nhất, tốn quota SMTP, và ứng viên vừa tự bấm nộp | ✅ |
| Chỉ lịch phỏng vấn | Phạm vi nhỏ nhất; email từ chối hay trúng tuyển không tới nếu ứng viên không đăng nhập | |
| Như (1) + email cho interviewer | Staff không lỡ lịch; thêm loại người nhận, nhiều template hơn, ngoài nguyên văn A-02 | |

**Vòng 2.** Giữa câu opt-out (D6), người dùng yêu cầu "quay lại chỗ gửi mail giúp mình, các loại mail mà ứng viên sẽ nhận".
Claude liệt kê 8 email (gửi khi nào, nội dung, link), các trường hợp không gửi, số email một ứng viên nhận cho một tin
(2 nếu bị loại ngay, khoảng 5–6 nếu đi hết), và ba mặc định đang tự chọn: (a) email từ chối không kèm lý do; (b) hoàn
tác thì email theo trạng thái đích; (c) xoá một lịch chưa diễn ra thì tính là huỷ. Câu hỏi: "Danh sách 8 email này đúng
ý bạn chưa?"

| Phương án | Trade-off | |
|---|---|---|
| Đúng, giữ 8 email (khuyến nghị) | Giữ bảng và hai mặc định (b), (c); (a) hỏi riêng (thành D7) | ✅ |
| Bỏ #1 (xác nhận nhận đơn) | Còn 7; bỏ loại nhiều nhất và dễ bị báo spam nhất; câu opt-out gần như hết lý do để hỏi | |
| Bỏ #2 (vào vòng phỏng vấn) | #2 và #6 thường tới sát nhau; bỏ thì ứng viên không biết mình qua vòng cho tới khi có lịch | |

Duyệt kèm theo: (b) hoàn tác về `screening` hoặc `applied` không có email đính chính (spec R3); (c) xoá một lịch
`scheduled` chưa diễn ra thì gửi #8 (spec R6).

## D2 — Lịch tự huỷ khi đơn bị từ chối

**Bối cảnh.** `cancelUpcomingSchedules` huỷ các lịch `scheduled` sắp tới bằng `updateMany`, trong cùng transaction với việc
đổi trạng thái, và không trả về lịch nào bị huỷ (`applications.service.ts:169-181`). Với trường hợp rút đơn, Claude nêu
ngay trong câu hỏi rằng đề xuất không gửi email nào, kể cả email huỷ lịch, vì chính ứng viên bấm. Người dùng không phản đối.

| Phương án | Trade-off | |
|---|---|---|
| Gộp vào email từ chối (khuyến nghị) | Một email, nói rõ buổi hẹn không còn; phải đọc danh sách lịch trước `updateMany` trong transaction | ✅ |
| Gửi riêng từng email | Quy tắc đồng nhất "cứ huỷ lịch là có email"; nhưng 2 email trở lên cùng lúc cho một tin xấu, thứ tự tới hộp thư không đảm bảo | |
| Chỉ email từ chối | Đơn giản nhất, không đụng `cancelUpcomingSchedules`; ứng viên có thể không chắc buổi hẹn còn hay không | |

## D3 — Cơ chế gửi

**Bối cảnh.** Đề xuất ban đầu (từ phiên điều phối) là một queue chung, `jobId` xác định (loại sự kiện + id + phiên bản) để
retry không gửi trùng. Claude kiểm và báo trước khi hỏi:

- `attempts: 3` chạy lại chính job đó, không sinh job mới, nên retry tự nó không gửi trùng.
- Docs BullMQ ghi job đã bị xoá thì không còn tính là trùng (https://docs.bullmq.io/guide/jobs/job-ids, đọc 2026-10-13),
  mà `forRoot` đặt `removeOnComplete: true` (`app.module.ts:62`).
- `InterviewSchedule` không có cột `updatedAt` hay version.
- Trùng ở mức nghiệp vụ phần lớn đã bị chặn: nộp lần hai trả 409, FSM từ chối đổi trạng thái lặp lại, tạo lịch trùng
  giờ interviewer trả 400.

Phần chung của cả ba phương án: enqueue sau commit, bọc try/catch và log.

| Phương án | Trade-off | |
|---|---|---|
| (A) Queue + bảng log (khuyến nghị) | Không gửi lại row đã `sent` khi job chạy lại; có lịch sử gửi gì cho ai; test/E2E assert được bằng DB kể cả khi SMTP tắt; Redis sập lúc enqueue thì row vẫn `pending` để thấy. Cái giá: một migration và một bảng tenant mới | ✅ |
| (B) Chỉ queue, `jobId` cố định | Không migration, đúng khuôn queue hiện có; nhưng `jobId` chỉ chặn trùng khi job cũ còn trong Redis, không có lịch sử, Redis sập lúc enqueue thì email mất (chỉ còn log) | |
| (C) Gửi đồng bộ trong request | Ít code nhất; nhưng request phải chờ SMTP, không retry, ngược khuôn BullMQ của dự án | |

## D4 — Template

**Bối cảnh.** Hai template hiện có là file HTML khoảng 5,7 KB trong `assets/mail`, thay biến bằng `replace(/{{…}}/g)` và
**không escape HTML** (`mail.service.ts`). SP3 sẽ chèn chữ do người nhập (tên tin, tổ chức, địa chỉ, tên interviewer).
Webpack copy `src/assets` sang `dist` (`webpack.config.js:18`).

| Phương án | Trade-off | |
|---|---|---|
| 1 layout HTML + nội dung trong TS (khuyến nghị) | Đổi layout chỉ sửa 1 file, unit test được từng email, không thêm dependency; câu chữ nằm trong code TS | ✅ |
| 8 file HTML riêng như hiện nay | Đúng khuôn hiện tại, sửa câu chữ không phải đụng TS; nhưng layout lặp 8 lần, vẫn phải tự thêm escape, phần có điều kiện (online/onsite, dòng lịch bị huỷ) khó làm bằng regex | |
| Template engine (Handlebars) | Có layout/partial, tự escape, có if/each; nhưng thêm dependency mới cho 8 email, và cách chạy với build webpack của API chưa kiểm (ASSUMPTION) | |

## D5 — Cách chứng minh email gửi thật

**Bối cảnh.** Test stack đặt `SMTP_ENABLED: "false"` (`docker-compose.test.yml:49`). Status Tracker không cho lên ✅ chỉ nhờ
unit test. Mailpit đang chạy trên máy là của dự án `english-learning`, không dùng chung.

| Phương án | Trade-off | |
|---|---|---|
| Unit + Mailpit riêng trong test stack (khuyến nghị) | Có bằng chứng gửi thật qua SMTP; cái giá là thêm một container, và email đăng ký trong E2E cũng vào sink (vô hại) | ✅ |
| Unit + assert bảng log, SMTP vẫn tắt | Không đổi test stack; chỉ chứng minh được "đã xếp hàng và xử lý", không chứng minh SMTP, HTML hay người nhận; chỉ được 🟡 | |
| Chỉ unit + mock transporter | Nhanh nhất; không có bằng chứng runtime nào, đúng kiểu lỗi đã làm hàng BullMQ retry "xanh mà sai" hai tháng | |

## D6 — Opt-out

**Bối cảnh.** Cả 8 email đều nói về đơn của chính ứng viên. Dự án không gửi marketing. `User`/`Candidate` chưa có cột
cài đặt thông báo nào.

**Vòng 1.** "Ứng viên có được tắt nhận email thông báo không?"

| Phương án | Trade-off | |
|---|---|---|
| Ngoài phạm vi SP3 (khuyến nghị) | Không cần cột, API, UI; ứng viên không tắt được. Ghi chú: việc email giao dịch không bắt buộc opt-out là ASSUMPTION, chưa đọc văn bản pháp lý | |
| Một công tắc tắt tất cả | Người dùng tự quyết; thêm migration, API, UI cho một nhu cầu chưa ai đòi | |
| Tắt theo từng loại email | Linh hoạt nhất; tốn nhất, YAGNI ở GĐ2 | |

Người dùng trả lời: "giải thích".

**Vòng 2.** Claude giải thích: email giao dịch khác marketing; ví dụ một ứng viên nộp 10 tin nhận 10 email xác nhận; bảng
"thấy gì / phải làm thêm" cho ba lựa chọn; chưa đọc quy định pháp lý nào nên khuyến nghị không dựa vào điểm đó.

| Phương án | Trade-off | |
|---|---|---|
| Luôn gửi, ngoài phạm vi (khuyến nghị) | Không tốn thêm gì; sau này thêm được mà không phải làm lại | |
| Một công tắc, trừ email lịch | Toggle ở profile tắt email nhận đơn và trạng thái, email lịch vẫn gửi; 1 migration, 1 endpoint, 1 toggle UI | |
| Tắt theo từng loại | Nhiều toggle; tốn nhất, chưa có nhu cầu | |

Người dùng trả lời: "ý là cái này nó đang giải quyết vấn đề gì".

**Vòng 3.** Claude giải thích vấn đề opt-out giải quyết: ứng viên thấy phiền mà không có chỗ tắt thì bấm "Báo cáo spam";
spam rate tăng thì Gmail lọc email từ địa chỉ gửi, kể cả email lịch của ứng viên khác. Dẫn Gmail sender guidelines
(https://support.google.com/a/answer/81126, đọc 2026-10-13): giữ spam rate dưới 0,3%; one-click unsubscribe chỉ bắt buộc
với *"marketing messages and subscribed messages"* và với người gửi trên 5.000 email/ngày. Kết luận cho dự án: không bị
bắt buộc, rủi ro có thật nhưng nhỏ.

| Phương án | Trade-off | |
|---|---|---|
| Không, ghi rủi ro vào spec (khuyến nghị) | Luôn gửi; spec ghi "Ngoài phạm vi" và ghi rủi ro báo spam vào "Chưa xác minh"; không tốn thêm | |
| Một công tắc, trừ email lịch | 1 migration, 1 endpoint, 1 toggle UI | |
| Bỏ email xác nhận nhận đơn | Không opt-out; quay lại D1, bỏ loại dễ bị báo spam nhất; ứng viên mất email xác nhận | |

Người dùng trả lời: "quay lại chỗ gửi mail giúp mình, các loại mail mà ứng viên sẽ nhận". Việc này dẫn tới D1 vòng 2 và D7.

**Vòng 4.** Sau khi danh sách 8 email được xác nhận: "Với 8 email này, SP3 có cho ứng viên tắt nhận email không?"

| Phương án | Trade-off | |
|---|---|---|
| Không, ghi rủi ro vào spec (khuyến nghị) | Luôn gửi cả 8; ghi rủi ro "bị báo spam → email lịch vào Spam" ở "Chưa xác minh" | |
| Một công tắc, trừ email lịch | Toggle ở profile tắt #1–#5; #6–#8 vẫn gửi; 1 migration, 1 endpoint, 1 toggle UI | |

Người dùng trả lời tự do: "không cần phải ghi rủi ro, mình thấy mail nào cũng cần thiết, nên ứng viên sẽ không thấy phiền
nếu có quá nhiều mail gửi vào, mục tiêu vẫn là biết trạng thái đơn tuyển dụng hay lịch phỏng vấn => không sao".

**Chọn:** không có opt-out (spec R15, "Ngoài phạm vi"), và spec không ghi rủi ro bị báo spam. Claude nói trong chat rằng
mục "Gmail SMTP production chưa ai chạy thử" vẫn giữ trong "Chưa xác minh", vì đó là khoảng trống về cấu hình chứ không
phải rủi ro làm phiền người dùng. Người dùng không phản đối.

## D7 — Email từ chối có kèm lý do không

**Bối cảnh.** D8 tuần 1: *"Ứng viên chỉ đọc lý do của quyết định đang có hiệu lực"* (`docs/tasks/gd2-week1/decision.md:134`).
Web ẩn lý do khi bước từ chối được hoàn tác. Email thì đã gửi là không rút lại được. Claude minh hoạ: từ chối nhầm kèm
lý do "Thiếu NestJS", rồi hoàn tác; web ẩn lý do, nhưng email vẫn ghi.

| Phương án | Trade-off | |
|---|---|---|
| Không, kèm link xem trên web (khuyến nghị) | Giữ đúng D8 kể cả khi hoàn tác, không có câu chữ staff nằm vĩnh viễn trong hộp thư; ứng viên phải đăng nhập mới đọc được lý do | ✅ (theo hướng này) |
| Kèm lý do nguyên văn | Đầy đủ ngay trong email; phá D8 khi hoàn tác, chữ staff gõ vội được gửi đi không qua kiểm duyệt | |

Người dùng trả lời tự do: "thường mình thấy các nhà tuyển dụng họ sẽ nói là bạn không phù hợp với vị trí này chứ không
nêu lý do cụ thể, nên mình nghĩ là nên làm theo hướng đó".

**Chọn:** email không nêu lý do cụ thể, chỉ một câu chung kiểu "hồ sơ của bạn chưa phù hợp với vị trí này" (spec R7). Claude
nêu rõ email vẫn có link tới trang đơn như các email khác, và phần web theo D8 không đổi.

## D8 — In-app cho sự kiện lịch

**Bối cảnh.** Tạo/đổi/huỷ lịch hiện không có in-app. Các enum `NotificationType.interview` và `RelatedEntityType.interview`
đã có (`schema.prisma:138-152`). Bấm thông báo trên web chỉ đánh dấu đã đọc, không chuyển trang (`NotificationDropdown.tsx:72`).

| Phương án | Trade-off | |
|---|---|---|
| Thêm in-app cho #6–#8 (khuyến nghị) | Email và chuông phát cùng một chỗ trong code; lấp đủ A-02; chỉ sửa backend, không cần migration enum; phạm vi thêm một chút | ✅ |
| Thêm cho #1 và #6–#8 | Chuông khớp hết 8 email; nhưng chuông báo cả việc vừa tự bấm nộp đơn, không mang thêm thông tin | |
| Chỉ email | Phạm vi nhỏ nhất; chuông vẫn im khi có lịch phỏng vấn | |

## Đề xuất kỹ thuật được duyệt cùng design

Design được trình bày thành ba phần (kiến trúc và luồng; lỗi, nội dung, múi giờ; kiểm thử và file). Người dùng trả lời
"ok" cho từng phần. Cột "Bỏ / không làm" chỉ ghi những gì đã được nêu trong chat; "—" là không có phương án thay thế nào
được nêu.

| Mục | Chọn | Bỏ / không làm | Vì sao |
|---|---|---|---|
| Đặt code | Module mới `candidate-notifications`, một service gom email và in-app cho từng sự kiện; chuyển `notifyCandidateStatusChangeSafe` vào đó, giữ nguyên câu chữ | — | `applications.service.ts` chỉ còn một lời gọi; email và in-app phát từ một chỗ (D8) |
| `MailService` | Thêm `sendMail({to, subject, html, text})` chung | Sửa hai email cũ | Hai email cũ giữ nguyên, không đụng luồng xác minh |
| Nội dung render | Payload là ảnh chụp lúc phát sự kiện, lưu trong row | Đọc lại DB lúc gửi | Email đổi lịch cần giờ cũ; lịch bị xoá cứng thì không còn gì để đọc; retry ra đúng nội dung |
| `jobId` | `jobId` = id của row | `jobId` = loại + id + phiên bản | Xem D3: chống trùng dựa vào trạng thái row, không dựa vào Redis còn giữ job |
| Trạng thái row | `pending \| sent \| failed \| skipped` (`skipped` khi SMTP tắt) | — | Không đánh dấu `sent` sai khi SMTP tắt ở dev |
| Bảo đảm gửi | Gửi ít nhất một lần (at-least-once); có thể lặp nếu worker chết sau khi SMTP đã nhận | — | Không bịt được nếu không có giao thức hai pha với SMTP; ghi rõ trong spec (R11, E11) |
| Enqueue lỗi | Row nằm lại `pending`, có log | Sweep tự gửi lại | Ngoài phạm vi SP3; row để nhìn thấy |
| Retry | Kế thừa `forRoot` (3 lần, exponential) | `defaultJobOptions` ở `registerQueue` | Bẫy shallow-merge đã ghi trong `app.module.ts` |
| Rate limit | `setGlobalRateLimit(30, 60000)` cho queue mới | — | Giống queue xác minh hiện có; không dồn một loạt vào SMTP |
| Múi giờ | Một hàm `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })` | Thêm thư viện ngày giờ | Đã chạy thử trong `node:24-bookworm-slim`: mặc định UTC, có full ICU, `02:30Z` ra `09:30` |
| Escape | Một hàm escape chung cho mọi giá trị động; link họp dựa vào validate `http/https` sẵn có ở DTO | — | Template hiện có không escape; SP3 chèn chữ do người nhập |
| Endpoint | Không thêm endpoint nào đọc `email_notifications` | Màn hình "lịch sử email" cho staff | Ngoài phạm vi |
| Cột `interviewId` | `String?`, không có FK | — | Lịch có thể bị xoá cứng (`removeSchedule`) |
| Cột `recipientEmail` | Chụp lúc phát sự kiện | — | Email gửi tới đúng địa chỉ lúc sự kiện xảy ra (E1) |
| Mailpit | Container riêng trong `docker-compose.test.yml`, chỉ mở `127.0.0.1`, cổng riêng | Dùng chung Mailpit của `english-learning` | Hai dự án không được chia sẻ hạ tầng test |

**Chờ xác nhận (bổ sung khi viết spec và plan, chưa được người dùng duyệt):**

1. Thông báo cho recruiter khi có scorecard: **ngoài phạm vi SP3**. Mặc định này do phiên điều phối đặt ngày 2026-10-13;
   spec SP1 đã được sửa theo (`docs/tasks/gd2-week2-evaluation/spec.md:29`).
2. Ứng viên `inactive`: **không gửi email**, row ở `skipped` (spec R17). Lúc viết spec, Claude đặt mặc định là vẫn gửi.
   Phiên điều phối đổi lại, vì tài khoản đã bị khoá không nên nhận thư của nền tảng. **Người dùng xác nhận 2026-10-14:**
   ứng viên `inactive` không nhận email, ứng viên `active` nhận như bình thường.
3. Các điều chỉnh kỹ thuật khi viết plan (FK `applicationId` cascade, `updateManyAndReturn`, probe Mailpit và PostgreSQL
   chạy trên container dùng một lần) được ghi ở mục "Điều chỉnh spec" của [plan.md](plan.md).
