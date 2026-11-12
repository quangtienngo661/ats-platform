# GĐ4 — checklist kiểm thử tay

Dùng nhánh `feat/gd4-p4-waiting-room` (đã gồm M1, M2, M3; nếu chuỗi PR đã merge thì dùng `dev`). Mỗi mục ghi **làm gì** và
**phải thấy gì**. Đánh dấu ✅/❌ và ghi chú cạnh mục nào khác kỳ vọng.

## 0. Chuẩn bị (một lần)

1. `npm ci` ở gốc repo, rồi `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`.
2. Chạy stack dev: `docker-compose -f docker-compose-dev.yml up -d --build`. Stack có thêm service `livekit` (cổng 7880,
   7881/TCP, 7882/UDP). API tự nhận `LIVEKIT_*` mặc định nếu `.env` không đặt.
3. Container API tự chạy `prisma migrate deploy` khi khởi động (CMD của image). Xem `docker logs ats-api`: phải có các
   migration GĐ3 và 3 migration GĐ4 (`20261113000000_add_copilot_decisions`, `20261113100000_add_ai_cost_tracking`,
   `20261113200000_add_interview_waiting_room`).
   Lưu ý: trong phiên làm GĐ4, build image API trên máy này hai lần đứng ở bước `npm ci`; nếu gặp lại, dừng rồi build lại,
   hoặc chạy API trên máy bằng `npx nx build api` + `node dist/apps/api/main.js` với biến môi trường trỏ `localhost`.
4. Kiểm nhanh: mở `http://localhost:7880` → trả `OK`. `GET http://localhost:5000/api/health` → `up`.
5. Cần sẵn: 1 tài khoản admin, 1 org_admin, 1 recruiter (thuộc một phòng ban), 1 ứng viên đã nộp đơn vào một tin của
   phòng ban đó, và cấu hình AI mặc định có ngưỡng (ví dụ 60).

## 1. Phòng phỏng vấn trực tuyến (M1)

| # | Làm gì | Phải thấy |
|---|---|---|
| 1.1 | Recruiter → Lịch phỏng vấn → Đặt lịch cho ứng viên, hình thức **Trực tuyến**, để trống "Đường dẫn phòng họp", giờ bắt đầu = 5 phút nữa | Ô link có dòng "Không bắt buộc. Để trống: dùng phòng phỏng vấn trực tuyến của hệ thống."; lưu được |
| 1.2 | Mở chi tiết lịch vừa tạo | "Phòng phỏng vấn trực tuyến của hệ thống" và nút **Vào phòng phỏng vấn** đang bật |
| 1.3 | Đặt thêm một lịch online bắt đầu sau 2 giờ, mở chi tiết | Nút **Vào phòng phỏng vấn** bị khoá, cạnh đó "Phòng mở lúc HH:mm" = giờ hẹn − 15 phút |
| 1.4 | Đăng nhập ứng viên (trình duyệt/hồ sơ khác) → Lịch phỏng vấn của tôi | Thẻ lịch 1.1 có nút **Vào phòng phỏng vấn**, không hiện link thô |
| 1.5 | Email "lịch phỏng vấn" trong hộp thư (Mailpit nếu dùng) | "Link phòng họp: http://…/interview-room/<id>" |
| 1.6 | Recruiter bấm **Vào phòng phỏng vấn** | Màn kiểm thiết bị (camera, micro), nút **Vào phòng**; góc trên "Phòng đóng lúc HH:mm" = giờ kết thúc + 30' |
| 1.7 | Bấm **Vào phòng**, rồi ứng viên cũng vào (ứng viên phải chờ được cho vào, xem mục 1b) | Mỗi bên thấy video và tên người kia; bật/tắt mic, camera, chia sẻ màn hình, chat được |
| 1.8 | Một bên bấm rời phòng | Quay về trang lịch của vai trò đó (recruiter: `/interviews`, ứng viên: `/my-interviews`) |
| 1.9 | Đăng nhập một recruiter khác (không phải người tạo, không phải người phỏng vấn), mở thẳng `/interview-room/<id>` | "Không vào được phòng phỏng vấn" + "Bạn không tham gia buổi phỏng vấn này" |
| 1.10 | Mở link phòng của lịch 1.3 (chưa tới giờ) | "Phòng phỏng vấn mở lúc HH:mm ngày dd/mm/yyyy" |
| 1.11 | Huỷ lịch 1.1 rồi mở lại link phòng | "Lịch phỏng vấn đã bị huỷ" |
| 1.12 | Sửa lịch online đang có link ngoài (Google Meet), xoá trống ô link, lưu | Lịch chuyển sang dùng phòng của hệ thống (bước 1.2) |
| 1.13 | (Tuỳ chọn) Dừng service `livekit` và bỏ 3 biến `LIVEKIT_*` khỏi API, vào phòng | "Phòng phỏng vấn trực tuyến chưa được cấu hình"; API vẫn chạy |

## 1b. Phòng chờ và thông báo (M4)

Dùng hai trình duyệt (hoặc một cửa sổ ẩn danh): recruiter và ứng viên. Lịch online bắt đầu sau 5 phút.

| # | Làm gì | Phải thấy |
|---|---|---|
| 1b.1 | Recruiter vào phòng (bấm **Vào phòng**) trước | Phòng họp, chưa có ai khác |
| 1b.2 | Ứng viên → Lịch phỏng vấn của tôi → **Vào phòng phỏng vấn** | Màn "Đang chờ người phỏng vấn cho vào", nút **Kiểm tra lại**, **không** có màn kiểm tra thiết bị |
| 1b.3 | Nhìn màn của recruiter | Dải xanh "<tên ứng viên> đang chờ từ HH:mm" + nút **Cho vào** (trong vài giây; chậm nhất 20 giây) |
| 1b.4 | Recruiter mở chuông thông báo ở trang khác (ví dụ `/interviews`) | Thông báo "Ứng viên đang chờ" — "<tên> đang chờ trong phòng phỏng vấn vị trí <tin>." (một lần, tải lại trang chờ không tạo thêm) |
| 1b.5 | Recruiter bấm **Cho vào** | Dải xanh biến mất; màn ứng viên tự sang bước kiểm tra thiết bị (chậm nhất 20 giây) |
| 1b.6 | Ứng viên bấm **Vào phòng** | Hai bên thấy nhau. Ứng viên rời rồi vào lại: không phải chờ nữa |
| 1b.7 | Recruiter sửa giờ của lịch đó, ứng viên mở lại link phòng (trong khung giờ mới) | Phải chờ cho vào lại |
| 1b.8 | Tạo lịch online bắt đầu sau 5 phút | Trong vài giây, ứng viên và recruiter có thông báo "Phòng phỏng vấn đã mở" — "… Buổi phỏng vấn bắt đầu lúc HH:mm." |
| 1b.9 | Tạo lịch bắt đầu sau ~24 giờ 2 phút; đợi 2 phút | Thông báo "Nhắc lịch phỏng vấn" với giờ và ngày (giờ Việt Nam). Lịch onsite: chỉ có nhắc lịch, không có "Phòng phỏng vấn đã mở" |
| 1b.10 | Tạo lịch sau ~24 giờ 2 phút rồi huỷ (hoặc dời giờ) ngay | Không có "Nhắc lịch phỏng vấn" cho giờ cũ |
| 1b.11 | Ứng viên gọi thẳng `POST /api/interviews/schedules/<id>/admit` | 403 |

## 2. AI co-pilot trên Kanban (M2)

| # | Làm gì | Phải thấy |
|---|---|---|
| 2.1 | Recruiter → Kanban của tin. Một đơn ở **Ứng tuyển** | Thẻ có dòng **Gợi ý: Chuyển sang vòng Sàng lọc** |
| 2.2 | Bấm gợi ý | Dialog "Gợi ý cho <tên>", lý do, dòng "Bạn quyết định; gợi ý không tự thực hiện.", các nút **AI giải thích**, **Bỏ qua**, **Áp dụng** |
| 2.3 | Bấm **Áp dụng** | Toast "Đã áp dụng gợi ý"; thẻ sang cột **Sàng lọc**; gợi ý mới **Chạy sàng lọc AI** |
| 2.4 | Đơn ở **Sàng lọc** đã có điểm ≥ ngưỡng | **Gợi ý: Mời phỏng vấn**, lý do "Điểm sàng lọc X (AI), ngưỡng Y." (hoặc "(đã duyệt)" nếu đã duyệt điểm) |
| 2.5 | Áp dụng "Mời phỏng vấn", mở lịch sử đơn | Đơn sang **Phỏng vấn**; lịch sử có ghi chú "Áp dụng gợi ý co-pilot: Mời phỏng vấn"; ứng viên nhận thông báo đổi trạng thái như khi kéo thả |
| 2.6 | Đơn có điểm < ngưỡng | **Gợi ý: Xem lại hồ sơ: điểm dưới ngưỡng**, nút chính là **Mở hồ sơ** (không có nút áp dụng, không có nút từ chối) |
| 2.7 | Đơn ở **Phỏng vấn** chưa có lịch | **Gợi ý: Đặt lịch phỏng vấn**, nút **Đặt lịch** dẫn tới `/interviews` |
| 2.8 | Lịch đã kết thúc nhưng chưa có scorecard | **Gợi ý: Nhập đánh giá buổi phỏng vấn** |
| 2.9 | Mọi scorecard "Có"/"Rất có" | **Gợi ý: Gửi đề nghị (Offer)**; có scorecard "Không" → **Xem lại: người phỏng vấn không đề xuất** |
| 2.10 | Bấm **Bỏ qua** một gợi ý, tải lại trang | Gợi ý đó không hiện lại; đổi trạng thái đơn → gợi ý mới hiện |
| 2.11 | Hai tab cùng mở một gợi ý; áp dụng ở tab 1, rồi áp dụng ở tab 2 | Tab 2 báo "Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới." |
| 2.12 | **AI giải thích** (khi có key AI hoạt động) | 2–4 câu tiếng Việt giải thích gợi ý; một dòng `AI co-pilot` trong Nhật ký AI. Không có key: "Chưa tạo được giải thích, hãy dùng các lý do bên dưới." |

## 3. Dashboard thống kê và chi phí AI (M3)

| # | Làm gì | Phải thấy |
|---|---|---|
| 3.1 | Recruiter → Bảng điều khiển | Bộ lọc "30 ngày gần nhất" + "Tất cả tin tuyển dụng"; 4 KPI (đơn trong kỳ, tin đang tuyển, đã tuyển, số ngày tuyển TB); biểu đồ đơn theo ngày; Phễu tuyển dụng; Thời gian ở mỗi giai đoạn; Ứng viên gần đây; **không** có khối "Chi phí AI" |
| 3.2 | Đếm tay số đơn của một tin đã từng đạt mỗi giai đoạn, chọn tin đó ở bộ lọc | Phễu khớp số đếm; mỗi bước có "% so với bước trước"; đơn đã revert vẫn được tính ở giai đoạn đã từng đạt |
| 3.3 | Đổi sang 7 / 90 ngày | Địa chỉ đổi thành `?days=7` / `?days=90`; số liệu đổi theo; tải lại vẫn giữ bộ lọc |
| 3.4 | "Ứng viên gần đây" | Đúng 6 đơn mới nhất trong phạm vi phòng ban của recruiter, bấm vào mở trang hồ sơ |
| 3.5 | Recruiter phòng ban khác | Không thấy số liệu của phòng ban này |
| 3.6 | Org_admin → Bảng điều khiển | Số liệu của cả tổ chức + khối **Chi phí AI** (theo tháng × tác vụ, token vào/ra, chi phí) |
| 3.7 | Khi chưa nhập giá model nào | Khối chi phí hiện "Chưa có giá cho: <model>. Tổng chi phí chưa tính được." và cột chi phí "Chưa có giá" |
| 3.8 | Admin → AI Usage Logs → **Bảng giá model AI**: nhập giá vào/ra (USD / 1 triệu token) cho từng model, **Lưu giá** | "Đã lưu giá cho <model>."; nhập số âm hoặc 5 chữ số thập phân → "Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân." |
| 3.9 | Quay lại dashboard của org_admin | Tổng chi phí = token × giá (ví dụ 1 000 000 token vào × $2.5 = $2.50) |
| 3.10 | Admin → Bảng điều khiển | Số liệu toàn hệ thống + chi phí AI của mọi tổ chức |
| 3.11 | Nhật ký AI có loại mới | Bộ lọc có "AI co-pilot"; log chấm CV mới có tổ chức (kiểm trong DB: `ai_usage_logs.organization_id`) |

## 4. Không được xảy ra

- Co-pilot tự đổi trạng thái hoặc tự từ chối hồ sơ khi chưa bấm.
- Người ngoài buổi phỏng vấn vào được phòng.
- Ứng viên nhận được token LiveKit (vào được phòng họp) trước khi người phỏng vấn bấm **Cho vào**.
- Recruiter thấy số liệu của phòng ban hay tổ chức khác.
