# Decision record — GĐ2 SP2: chấm CV hàng loạt và xuất CSV

**Ngày:** 2026-10-13 · Spec: [spec.md](spec.md) · Nguồn: các câu hỏi và câu trả lời trong buổi brainstorm cùng ngày.
Chỉ ghi các phương án đã thật sự được đưa ra trong chat. Phiên "Kiểm tra tiến độ dự án" gửi sẵn danh sách câu hỏi và
khuyến nghị ban đầu; các phương án dưới đây là bản Claude trình bày cho người dùng sau khi đọc lại code.

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D1 | Chọn đơn để chấm hàng loạt | Cả hai: `applicationIds` tùy chọn, không gửi thì server tự chọn đơn đủ điều kiện | Người dùng |
| D2 | Đơn còn ở `applied` | Chuyển sang `screening` nếu recruiter bật cờ đồng ý | Người dùng (hai vòng, vòng 1 bấm nhầm) |
| D3 | Theo dõi tiến độ | Dùng lại sự kiện Socket.IO `cv-screening:completed` đang có | Người dùng |
| D4 | Notification in-app mỗi đơn chấm xong | Job của bulk không tạo notification từng đơn | Người dùng |
| D5 | Chặn chi phí Gemini | Trần 50 đơn/lần + giới hạn tần suất | Người dùng |
| D6 | Cột của file CSV | Hồ sơ + AI, không có trường liên hệ | Người dùng |
| D7 | Dòng của file CSV | Mọi đơn của tin, trừ `cancelled` | Người dùng |
| D8 | Cách làm phía API | Hàm luật dùng chung + service bulk riêng | Người dùng |

## D1 — Chọn đơn để chấm hàng loạt

**Bối cảnh.** Đơn lẻ được chấm qua menu chuột phải trên Kanban (`ScreeningConfigModal`). Trang danh sách ứng viên của
tin chưa có checkbox; SP1 sẽ thêm checkbox cho "So sánh".

| Phương án | Trade-off | |
|---|---|---|
| Tick chọn trên danh sách (khuyến nghị) | Checkbox ở `jobs/[jobId]/candidates` + "chọn cả trang", gửi `applicationIds` ≤ 50, trả `{queued, skipped}`; recruiter biết chính xác mình chọn gì và tự quyết chi phí; dùng chung phần chọn với checkbox SP1 nhưng đụng file `CandidateRow`/`CandidatesFilters` lúc plan | |
| Nút "Chấm mọi đơn đủ điều kiện" | Server tự chọn đơn chưa có kết quả, có trần, hộp thoại báo số lượng; một click; recruiter không thấy trước từng đơn, phải có trần cứng | |
| Cả hai | `applicationIds` tùy chọn; linh hoạt nhất; số test và UI gấp đôi | ✅ |

Sau câu D2, người dùng xác nhận lại D1 giữ "Cả hai" (chỗ bấm nhầm là câu D2).

## D2 — Đơn còn ở `applied`

**Bối cảnh.** Đọc `KanbanClient.tsx:134-137`: kéo thẻ sang cột "Sàng lọc" thì modal chấm tự mở, tức chuyển trạng thái và
chấm đi liền nhau. Đơn mới nộp đều ở `applied`. Nếu bulk bỏ qua mọi đơn `applied` thì chế độ "chấm mọi đơn đủ điều
kiện" gần như không có gì để chấm.

**Vòng 1.** Người dùng chọn "Chuyển nếu recruiter đồng ý", rồi ngắt phiên: "hỏi lại, misclick".

**Vòng 2** — cùng câu hỏi, cùng các phương án:

| Phương án | Trade-off | |
|---|---|---|
| Chuyển nếu recruiter đồng ý (khuyến nghị) | Cờ `moveAppliedToScreening`, hộp thoại ghi rõ số đơn sẽ chuyển; chuyển theo đúng đường Kanban (ghi `ApplicationHistory`, người đổi là recruiter) rồi mới đưa vào hàng đợi; vẫn đúng ADR 0002 vì người bấm đổi trạng thái, trước khi có điểm và không phụ thuộc điểm; SP2 chạm luồng đổi trạng thái mà SP3 cũng sửa, thêm test | ✅ |
| Bỏ qua kèm lý do | Không đổi trạng thái, không xung đột SP3; recruiter vẫn phải kéo từng thẻ, mà kéo thì modal đơn lẻ đã tự mở, nên bulk ít tác dụng | |
| Cho chấm khi còn `applied` | Bỏ luật "phải sang screening trước" cho cả đơn lẻ và bulk; đổi luật đang có; cột "Sàng lọc" mất nghĩa; guard phía web dựa vào stage screening | |

## D3 — Theo dõi tiến độ

**Bối cảnh.** Processor đã phát `cv-screening:completed` vào room `job_<jobId>`; chỉ trang Kanban vào room đó. Khi chấm
lỗi, sự kiện gửi `null`, không có `applicationId`.

| Phương án | Trade-off | |
|---|---|---|
| Dùng lại socket đang có (khuyến nghị) | Trang danh sách thêm `<InitSocketRoom jobId>`, nhận sự kiện thì tải lại danh sách (debounce); toast "đã đưa N đơn, bỏ qua M"; không thêm backend, giống Kanban; không có thanh "12/50"; đóng trang thì không nhận sự kiện (mở lại vẫn đúng vì dữ liệu ở DB) | ✅ |
| Polling stats | Gọi `GET /screening/stats?jobId` vài giây một lần, có thanh tiến độ; stats đếm cả tin chứ không riêng đợt; thêm request và logic client | |
| Không theo dõi trực tiếp | Chỉ toast; rẻ nhất; recruiter phải tự tải lại | |

## D4 — Notification in-app mỗi đơn chấm xong

**Bối cảnh.** `cv-screenings.processor.ts:80-85` tạo một notification cho recruiter sở hữu tin (không nhất thiết là
người bấm) mỗi khi chấm xong một đơn; 50 đơn là 50 notification.

| Phương án | Trade-off | |
|---|---|---|
| Bulk không tạo thông báo từng đơn (khuyến nghị) | Job bulk mang `notify: false`, đơn lẻ giữ nguyên, socket vẫn phát; chuông không bị ngập, sửa nhỏ; chủ tin khác người bấm thì không được báo | ✅ |
| Giữ nguyên, mỗi đơn một thông báo | Không tốn công, chủ tin luôn được báo; tới 50 mục mỗi lần bulk | |
| Một thông báo tổng khi cả đợt xong | Gọn nhất; cần FlowProducer của BullMQ hoặc bộ đếm trong Redis/DB, nặng hơn hẳn, dễ lỗi khi có retry hoặc fail | |

## D5 — Chặn chi phí Gemini

**Bối cảnh.** Sàng lọc mặc định dùng `GeminiModel.Pro` (`gemini.service.ts:40`). `AiUsageLog` không có
`organizationId`; `CVScreening` là upsert một dòng mỗi đơn.

| Phương án | Trade-off | |
|---|---|---|
| Trần 50 đơn/lần + giới hạn tần suất (khuyến nghị) | Tự chọn thì lấy 50 đơn nộp sớm nhất và báo phần còn lại; `ThrottlerGuard` như auth (ví dụ 3 lần/phút); giữ `MAX_SCREENING_RETRIES = 3`; không cần bảng mới; không có trần tổng theo ngày | ✅ |
| Thêm hạn mức theo tổ chức/ngày | Chặn chi phí thật sự; cần bảng hoặc cột mới (migration), chỗ cấu hình hạn mức, test | |
| Chỉ trần 50 đơn/lần | Đơn giản nhất; không chặn bấm liên tiếp | |

## D6 — Cột của file CSV

**Bối cảnh.** API danh sách đã trả `email` và `phoneNumber` cho staff; điểm khác là CSV mang dữ liệu ra khỏi hệ thống.
Bảng scorecard của SP1 chưa có trong code.

| Phương án | Trade-off | |
|---|---|---|
| Hồ sơ + AI, không liên hệ (khuyến nghị) | Họ tên, trạng thái, ngày nộp, chức danh, số năm kinh nghiệm, trạng thái sàng lọc, điểm tổng và 3 điểm con, gợi ý AI (ghi rõ "gợi ý"), kỹ năng khớp/thiếu; file bị chuyển tiếp cũng không lộ liên hệ; thêm cột sau chỉ là một dòng code; muốn liên hệ thì vào UI | ✅ |
| Như trên + email, số điện thoại | Dùng được ngay để liên hệ hoặc gửi hiring manager; dữ liệu cá nhân nằm trong file không kiểm soát được, nên có cảnh báo | |
| Như trên + liên hệ + trung bình scorecard (SP1) | Đầy đủ nhất; SP2 phải chờ SP1 merge, mất tính không phụ thuộc, thêm xung đột | |

## D7 — Dòng của file CSV

**Bối cảnh.** Trang danh sách chỉ tải trang đầu (50 đơn); bộ lọc trạng thái chạy ở client trên 50 đơn đó, API không
nhận tham số lọc trạng thái.

| Phương án | Trade-off | |
|---|---|---|
| Mọi đơn của tin, trừ `cancelled` (khuyến nghị) | Toàn bộ tin, không chỉ trang đang xem, có trần số dòng, giống mặc định của trang danh sách; một endpoint đơn giản; muốn lọc thì lọc trong Excel | ✅ |
| Theo bộ lọc trạng thái đang chọn | File đúng cái đang nhìn; thêm tham số và test; dễ hiểu nhầm vì bộ lọc hiện chỉ áp trên 50 đơn đầu | |
| Chỉ các đơn đang tick | Kiểm soát từng dòng; chỉ trong trang hiện tại (≤ 50), xuất cả tin phải tick từng trang | |

## D8 — Cách làm phía API

**Bối cảnh.** Đọc `updateStatus` (`applications.service.ts:545-617`): chuyển `applied → screening` ghi
`ApplicationHistory`, không phát socket, không báo ứng viên.

| Phương án | Trade-off | |
|---|---|---|
| 1. Hàm luật chung + service bulk (khuyến nghị) | `checkScreeningEligibility` dùng chung cho đơn lẻ và bulk; `BulkScreeningService` kiểm quyền một lần, chọn đơn, chuyển `applied` bằng `updateStatus()` public, enqueue với `notify:false`; mã lý do ổn định; không sửa thân `updateStatus` (với SP3 chỉ chung file); thêm một file service, refactor nhẹ `triggerScreening` | ✅ |
| 2. Lặp gọi `triggerScreening` | Ít code nhất; lý do lấy từ message exception, dễ vỡ; chế độ tự chọn phải viết lại điều kiện bằng query riêng nên có thể lệch luật; kiểm quyền N lần | |
| 3. Job BullMQ cha + `batchId` | Bất đồng bộ toàn phần, theo dõi được cả đợt; cần bảng hoặc state mới, nặng hơn nhu cầu với trần 50 | |

## Đề xuất kỹ thuật được duyệt cùng design

Người dùng duyệt thiết kế theo ba phần (API chấm hàng loạt, API xuất CSV, web + kiểm thử + phối hợp); mỗi phần trả lời
"Ổn".

| Mục | Chọn | Bỏ / không làm | Vì sao |
|---|---|---|---|
| Mã lý do bỏ qua | Enum `ScreeningSkipReason` (8 mã) trong `@ats-platform/types`, web dịch sang nhãn tiếng Việt | Trả message của exception | UI và test dựa được vào mã; message đơn lẻ giữ nguyên |
| Lỗi chặn cả request | Chỉ body sai (400) và thiếu cấu hình AI (404), kiểm trước khi động vào đơn nào | Để lỗi cấu hình thành lý do của từng đơn | Tránh trường hợp đã chuyển trạng thái nhiều đơn rồi mới phát hiện không chấm được |
| Cấu hình AI | Tìm một lần cho cả request | Tìm cho từng đơn | Mọi đơn trong một lần dùng cùng cấu hình |
| Cờ `notify` | Thiếu trường thì coi như `true` | Bắt buộc có trường | Job đơn lẻ và job cũ còn trong Redis chạy như trước |
| Rate limit | `ThrottlerGuard` + `@Throttle` 3 lần/phút trên bulk endpoint | Guard toàn app | Theo đúng cách auth đang dùng; còn mở: guard có chạy ngoài `AuthModule` không (spec, *Chưa xác minh*) |
| Migration | Không có | Bảng batch, cột quota | D3–D5 không cần lưu gì mới |
| Query export | `select` chỉ các cột trong file | Dùng `applicationIncludeOptions` | Include đó kéo theo `email`/`phoneNumber`; chọn hẹp thì trường liên hệ không thể lọt vào file |
| Hàm CSV | `toCsv` tự viết, không dependency | Thêm thư viện CSV | Yêu cầu chỉ khoảng 30 dòng code; không thêm chuỗi cung ứng |
| Chống formula injection | Bọc mọi ô trong ngoặc kép, nhân đôi `"`, thêm tab đầu ô bắt đầu bằng `= + - @`, tab, CR, LF | Thêm `'` ở đầu ô | OWASP ghi rằng thêm `'` không còn tác dụng sau khi Excel lưu rồi mở lại; tab nằm lại trong dữ liệu, chấp nhận vì file dành cho người xem |
| Trả file | `@Res()` với header `text/csv` | `StreamableFile` | `TransformInterceptor` bọc mọi giá trị trả về vào envelope; brain cho phép `@Res()` khi trả file |
| Trần export | 5000 dòng, vượt thì 400 | Cắt bớt âm thầm | Lỗi rõ ràng thay vì file thiếu dòng mà không ai biết |
| Cột "Mã đơn" | Thêm (Claude đề xuất khi trình bày phần 2; người dùng duyệt, không chọn "Bỏ cột Mã đơn") | Đúng danh sách cột ở D6 | Đối chiếu dòng trong file về hệ thống |
| Ngày nộp | `yyyy-mm-dd HH:mm`, múi giờ `Asia/Ho_Chi_Minh` cố định | Theo múi giờ server | Kết quả không phụ thuộc nơi chạy API |
| Checkbox trên danh sách | Dùng chung state chọn với SP1; nhánh merge trước tạo state | Hai bộ checkbox riêng | Cùng một bảng, cùng một thao tác chọn |
| Cờ chuyển `applied` | Mặc định tắt trong hộp thoại | Mặc định bật | D2 là "nếu recruiter đồng ý": phải tự bật |
| Tải CSV ở web | Server action `exportCandidatesCsvAction` trả chuỗi, client dựng `Blob` | Link trực tiếp tới API như nút tải CV (Claude đưa ra như một phương án ở phần 3; người dùng không chọn) | Đúng luật "component chỉ đi qua server action", dùng bearer token như mọi lời gọi khác; link trực tiếp phụ thuộc vào việc cookie `accessToken` được gửi sang domain API, chưa kiểm |
| Kiểm thử | Unit API + Vitest + probe trên test stack (history, job trong Redis, 429, header file) + một hành trình Playwright | Chỉ unit | Mock không chứng minh được history, queue, throttler hay header thật; chấm xong thật không kiểm được vì key Gemini đã hết |

## Đề xuất thêm khi viết plan (Claude đề xuất ngày 2026-10-13, chờ người dùng đọc plan)

Chưa có câu duyệt riêng của người dùng cho các mục này. Chúng nằm trong [plan.md](plan.md), và người dùng duyệt khi đọc
plan.

| Mục | Chọn | Bỏ / không làm | Vì sao |
|---|---|---|---|
| Đơn vị đếm của rate limit | Theo `req.user.userId`, không có thì dùng `req.ip` | Mặc định của `ThrottlerGuard` (`req.ip`) | Đọc `throttler.guard.js:141-142`: mặc định đếm theo IP. Sau Nginx, nhiều recruiter có thể chung một IP, nên một người bấm 3 lần sẽ chặn cả công ty |
| BOM khi tải CSV ở web | Web luôn bỏ BOM có sẵn rồi tự thêm một BOM | Tin vào BOM do API gửi | Đọc `axios/lib/adapters/http.js:1019-1022`: axios 1.16.0 luôn bỏ BOM khi đọc response dạng text |
| Thông báo 429 | Server action dịch sang tiếng Việt | Đổi message của `ThrottlerGuard` ở API | Không đụng cấu hình throttler mà auth đang dùng chung |
| Tên file CSV ở web | Server action tự dựng theo cùng quy tắc với API | Đọc `Content-Disposition` | `lib/http.ts` chỉ trả thân response, không trả header |
| Fixture E2E | File riêng `gd2-bulk-fixtures.mjs` | Thêm vào `gd2-fixtures.mjs` | Plan SP1 sửa `gd2-fixtures.mjs`; file riêng tránh xung đột khi merge |
