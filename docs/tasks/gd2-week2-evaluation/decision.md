# Decision record — GĐ2 SP1: đánh giá ứng viên

**Ngày:** 2026-10-13 · Spec: [spec.md](spec.md) · Nguồn: các câu hỏi và câu trả lời trong buổi brainstorm cùng ngày.
Chỉ ghi các phương án đã thật sự được đưa ra trong chat.

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D1 | Mức "xong" của phần nhà tuyển dụng và email của GĐ2, và ràng buộc thời gian | Không cắt mục nào, bỏ ràng buộc thời gian, làm theo artifact kế hoạch | Người dùng (trả lời tự do, hai vòng) |
| D2 | Bộ tiêu chí của scorecard | Bộ tiêu chí cố định | Người dùng |
| D3 | Ai nộp scorecard và khi nào | Interviewer của lịch, khi lịch `completed` | Người dùng |
| D4 | Ai đọc ghi chú của recruiter | Chia sẻ cho staff cùng tổ chức | Người dùng |
| D5 | Mức của màn hình so sánh ứng viên | Trang so sánh 2–4 ứng viên của cùng một tin | Người dùng |
| D6 | Cách lưu điểm tiêu chí | Cột cố định trong `interview_scorecards` | Người dùng |
| D7 | Khoá scorecard khi đơn đã chốt | Khoá (chỉ đọc khi đơn sang `hired`/`rejected`/`cancelled`) | Người dùng |

## D1 — Mức "xong" của GĐ2 và ràng buộc thời gian

**Bối cảnh.** Đề cương giao cho GĐ2 phần nhà tuyển dụng (ghi chú, so sánh ứng viên, form đánh giá, chấm CV hàng loạt,
xuất CSV) và email tự động. Lúc hỏi, Claude tính còn 12 ngày đến 25/10 và các mục chưa có trong code.

**Vòng 1** — "Đến 25/10, mức nào là 'xong'?"

| Phương án | Trade-off | |
|---|---|---|
| Đủ đầu mục, làm mỏng (khuyến nghị) | Cả 6 mục đều có, mỗi mục một lát dọc tối thiểu; đề cương là cam kết với giáo viên; chiều sâu để GĐ5; nếu trễ thì cắt so sánh trước, ghi chú sau | |
| Ít mục, làm chắc | Bỏ ghi chú và so sánh, các mục còn lại đúng chuẩn tuần 1; ít rủi ro lỗi nhưng lệch đề cương và phải ghi lý do vào báo cáo | |
| Chạy trọn một luồng demo | Chuỗi ngắn nhất kể được câu chuyện đầu-cuối; demo mượt nhưng lệch đề cương nhiều nhất | |

Người dùng không chọn phương án nào mà đính chính thời gian: "tính từ ngày 5 đến ngày 18/10". Claude tính lại còn 6 ngày
và ước lượng 5,5–8,5 ngày cho 6 mục.

**Vòng 2** — "Tuần 19–25/10 dành cho việc gì?"

| Phương án | Trade-off | |
|---|---|---|
| Dự phòng / tràn việc | 18/10 là mục tiêu, việc chưa xong được tràn sang 19–25/10; làm mỏng cả 6 mục, thứ tự A, D, E trước rồi B, C | |
| Kiểm thử, E2E, sửa lỗi, báo cáo | 18/10 là hạn cứng cho tính năng; làm A, D, E cho chắc, B và C chỉ làm nếu dư | |

Người dùng trả lời tự do: không cần quan tâm về thời gian, cứ làm tiếp công việc theo artifact kế hoạch. **Kết quả:**
không cắt mục nào; phạm vi là các mục GĐ2 còn lại trong artifact "Lộ trình ĐA2 ATS Platform".

## D2 — Bộ tiêu chí của scorecard

| Phương án | Trade-off | |
|---|---|---|
| Bộ tiêu chí cố định (khuyến nghị) | 4–5 tiêu chí chấm 1–5 cộng khuyến nghị tổng (enum mới) và nhận xét; một bảng mới, dữ liệu có cấu trúc để so sánh và làm đầu vào co-pilot GĐ4; đổi tiêu chí phải sửa code | ✅ |
| Mẫu cấu hình theo tổ chức | Mỗi tổ chức tự định nghĩa tiêu chí, đúng hướng Interview Kit của ATS lớn; thêm 2–3 bảng, migration, UI quản trị, và so sánh phức tạp hơn khi mẫu khác nhau | |
| Chỉ điểm tổng + nhận xét | Rẻ nhất; so sánh ứng viên và co-pilot nghèo dữ liệu | |

## D3 — Ai nộp scorecard và khi nào

| Phương án | Trade-off | |
|---|---|---|
| Interviewer của lịch, khi lịch `completed` (khuyến nghị) | Chặt nhất, truy được ai đánh giá buổi nào; quên bấm completed thì chưa nộp được | ✅ |
| Interviewer của lịch, từ lúc đến giờ phỏng vấn | Tiện hơn, không ép thêm bước đổi trạng thái; scorecard không tự đổi trạng thái lịch | |
| Bất kỳ recruiter trong tổ chức | Linh hoạt nhất, vẫn lưu người viết; đánh giá có thể đến từ người không dự buổi phỏng vấn nên mất ý nghĩa "scorecard của interviewer" | |

## D4 — Ai đọc ghi chú của recruiter

| Phương án | Trade-off | |
|---|---|---|
| Chia sẻ cho staff cùng tổ chức (khuyến nghị) | Có tác giả và thời gian, chỉ tác giả sửa/xoá, ứng viên không thấy; đúng mục đích phối hợp; thêm cờ riêng tư sau này chỉ cần thêm một cột | ✅ |
| Mỗi ghi chú có cờ riêng tư / chia sẻ | Giống cách Greenhouse phân quyền ghi chú; thêm cột, logic lọc theo người xem và test cho từng trường hợp | |
| Chỉ riêng tư cho tác giả | Rẻ nhất và an toàn nhất về quyền; không giúp phối hợp nhiều recruiter | |

## D5 — Mức của màn hình so sánh

| Phương án | Trade-off | |
|---|---|---|
| Trang so sánh 2–4 ứng viên của cùng một tin (khuyến nghị) | Chọn ở danh sách của một tin, xem cạnh nhau điểm AI, kỹ năng khớp/thiếu, trung bình scorecard, khuyến nghị và trạng thái; đúng chữ "so sánh ứng viên" của đề cương | ✅ |
| Chỉ thêm cột điểm và sắp xếp trên danh sách | Rẻ nhất; không xem cạnh nhau từng tiêu chí | |
| So sánh cả ứng viên khác tin | Nặng hơn nhiều; điểm AI không so được vì mỗi tin có cấu hình và yêu cầu khác nhau | |

## D6 — Cách lưu điểm tiêu chí

| Phương án | Trade-off | |
|---|---|---|
| 1. Cột cố định (khuyến nghị) | Mỗi tiêu chí một cột `Int`, enum khuyến nghị và nhận xét, duy nhất theo lịch; truy vấn và so sánh đơn giản, ràng buộc ở DB; đổi tiêu chí là migration cộng code (đã chấp nhận ở D2) | ✅ |
| 2. Hàng đánh giá | Bảng con `scorecard_ratings(criterion, score)`; thêm tiêu chí không đổi bảng nhưng vẫn phải sửa enum và code; join nhiều hơn; chỉ có lợi nếu sau này cấu hình theo tổ chức | |
| 3. Một cột JSON | Viết nhanh nhất; không có ràng buộc ở DB, truy vấn trung bình khó, kiểu lỏng | |

## D7 — Khoá scorecard khi đơn đã chốt

| Phương án | Trade-off | |
|---|---|---|
| Duyệt, kể cả khoá khi đơn chốt (khuyến nghị) | Tác giả sửa được đến khi đơn sang `hired`/`rejected`/`cancelled`, sau đó chỉ đọc; giữ bằng chứng cho quyết định tuyển dụng, hợp tinh thần human-in-the-loop | ✅ |
| Duyệt, nhưng bỏ khoá | Ít hơn một điều kiện và một test; đánh giá có thể bị đổi sau khi đã quyết định | |

## Đề xuất kỹ thuật được duyệt cùng design

| Mục | Chọn | Bỏ / không làm | Vì sao |
|---|---|---|---|
| Tách GĐ2 còn lại | 3 spec: SP1 đánh giá, SP2 chấm hàng loạt + CSV, SP3 email; SP1 trước | Một spec chung cho cả 6 mục | Mỗi phần độc lập và đủ lớn để có vòng spec → plan → build riêng; scorecard là đầu vào của co-pilot GĐ4. Claude đề xuất, người dùng tiếp tục theo hướng này và không phản đối (không phải duyệt tường minh) |
| Đặt code | Module mới `interview-scorecards` và `application-notes`; so sánh là `ApplicationComparisonService` trong module `applications` | Nhét vào `interviews.service.ts` hoặc `applications.service.ts` | Mỗi resource một module như `cv-screenings`, `interviews`; hai file service đó đã lớn |
| Enum khuyến nghị | `ScorecardRecommendation`: `strong_no \| no \| yes \| strong_yes` | Dùng lại `AiRecommendation` | `AiRecommendation` chỉ còn `interview \| reject` sau khi bỏ `hire` |
| Ràng buộc điểm | DTO và `CHECK` 1–5 ở DB | Chỉ kiểm ở DTO | `CHECK` đã được dùng cho `org_admin`; mock không chứng minh được ràng buộc DB |
| Quyền mặc định | Staff cùng tổ chức đọc mọi scorecard và ghi chú; platform admin chỉ đọc; ứng viên không bao giờ thấy | Ẩn scorecard của người khác đến khi tự nộp | Mặc định do Claude chọn, người dùng duyệt cùng Phần 2 |
| Ghi chú | Xoá cứng, tối đa 2000 ký tự | Xoá mềm, @mention | Ghi chú không phải bản ghi quyết định; giữ mỏng |
| Chọn so sánh | Chỉ trong trang hiện tại (50 ứng viên/trang) | Giữ lựa chọn qua nhiều trang | Giữ qua trang cần state chia sẻ và chưa có nhu cầu |
| So sánh và ADR 0002 | Chỉ hiển thị, không xếp hạng, không đổi trạng thái | Cột "tốt nhất", gợi ý tự động | Spine human-in-the-loop của ĐA2 |
| Giao diện | Tab *Tổng quan \| Đánh giá phỏng vấn \| Ghi chú* trên trang chi tiết; liên kết ở drawer lịch | Form scorecard riêng ở drawer | Một nơi duy nhất cho form, không nhân đôi |
| Tổ chức khác (R6) | Trả 404 qua helper mới `assertInCallerOrganizationOr404`, gọi trước các helper hiện có (code cũ trả 403) | Sửa helper hiện có để trả 404 | Claude đề xuất khi viết plan để không lộ sự tồn tại của bản ghi; chờ người dùng đọc plan, chưa được người dùng duyệt |
| Quyền xem đơn (R8) | Quyền đọc/ghi ghi chú, đọc scorecard và so sánh theo quyền xem đơn đó: org_admin và platform admin theo tổ chức, recruiter theo khoa của tin; platform admin chỉ đọc; interviewer của lịch vẫn nộp được dù khác khoa (R1) | Mọi staff cùng tổ chức đọc mọi scorecard và ghi chú | Claude đề xuất khi viết plan để giữ ranh giới khoa của tin; chờ người dùng đọc plan, chưa được người dùng duyệt |

**Đã duyệt 2026-10-13 (người dùng: spec không có vấn đề):** R12 trong spec — xoá lịch đã có scorecard trả 409 (FK
`Restrict`). Phương án đã cân nhắc: cascade (mất đánh giá khi xoá lịch) và cấm xoá mọi lịch `completed` (đổi hành vi hiện
có rộng hơn cần thiết). Claude đề xuất `Restrict`.
