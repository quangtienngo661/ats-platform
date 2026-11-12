# Decision record — GĐ4: phỏng vấn trực tuyến, AI co-pilot, thống kê

**Ngày:** 2026-11-13 · Spec: [spec.md](spec.md).

**Nguồn.** D1 được trình bày trong chat và người dùng chọn. D2 được trình bày trong chat nhưng người dùng không trả lời câu
đó. Thay vào đó, người dùng đặt mục tiêu `/goal`: *"làm theo quy trình viết spec, chốt các decision recommend, lên plan và
triển khai toàn bộ giai đoạn 4"*. Vì vậy D2–D12 do Claude chốt theo phương án đề xuất. Các phương án của D3–D12 là phương án
Claude cân nhắc khi viết spec, **chưa từng trình bày trong chat**; ghi lại để người dùng xem và đổi nếu cần.

D13–D15 bổ sung ngày 13/11: đối chiếu đề cương cho thấy thiếu phòng chờ và thông báo Socket.IO; người dùng trả lời
"Làm bổ sung ngay". Claude chốt theo phương án đề xuất; các phương án khác chưa trình bày trong chat.

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D1 | Viết spec GĐ4 theo cách nào | Một spec, chia 3 phần | Người dùng |
| D2 | Phỏng vấn online demo ở đâu | Máy local (compose dev + test); prod để sau, cần đồng ý | Claude (`/goal`) |
| D3 | Phòng nội bộ hay link ngoài | Phòng nội bộ mặc định, link ngoài vẫn được | Claude (`/goal`) |
| D4 | Ai vào phòng, khi nào | Ứng viên, người phỏng vấn, người tạo lịch; 15' trước → hết giờ + 30' | Claude (`/goal`) |
| D5 | Giao diện phòng họp | Component dựng sẵn của LiveKit (`PreJoin`, `VideoConference`) | Claude (`/goal`) |
| D6 | Ai quyết định gợi ý co-pilot | Luật bằng code; LLM chỉ giải thích khi bấm | Claude (`/goal`) |
| D7 | Áp dụng gợi ý thế nào | API áp dụng phía server, kiểm lại gợi ý, ghi `CopilotDecision` | Claude (`/goal`) |
| D8 | Thống kê đặt ở đâu | Nâng cấp `/dashboard`; giá model ở `/ai-usage-logs` | Claude (`/goal`) |
| D9 | Gắn chi phí AI với tổ chức | Cột `organizationId` nullable + điền ngược `cv_scoring` | Claude (`/goal`) |
| D10 | Lấy giá model từ đâu | Bảng giá do admin nhập trong DB | Claude (`/goal`) |
| D11 | Nhánh và PR | Chuỗi 3 nhánh trên đỉnh GĐ3, mỗi PR vào `dev` | Claude (`/goal`) |
| D12 | Funnel tính thế nào | Nhóm đơn theo ngày nộp, "đạt" theo lịch sử | Claude (`/goal`) |
| D13 | Phòng chờ hoạt động thế nào | API giữ token tới khi người phỏng vấn cho vào; trạng thái lưu trên lịch | Claude ("Làm bổ sung ngay") |
| D14 | Thông báo qua kênh nào | Thông báo trong ứng dụng + Socket.IO, không thêm email | Claude ("Làm bổ sung ngay") |
| D15 | Nhắc lịch thế nào khi lịch đổi | Job trễ BullMQ (−24h, −15'); job tự bỏ qua nếu lịch đã đổi | Claude ("Làm bổ sung ngay") |

## D1 — Viết spec theo cách nào

Bối cảnh: GĐ4 có 3 phần gần như độc lập.

| Phương án | Trade-off | |
|---|---|---|
| Một spec, chia 3 phần (như GĐ3) | Một lượt duyệt, dễ theo tiến độ 3 tuần; spec dài hơn | ✅ |
| Ba spec riêng (như GĐ2) | Duyệt từng phần, bắt đầu LiveKit sớm hơn; ba lượt brainstorm | |
| Chỉ spec LiveKit trước | Bắt đầu nhanh nhất; chưa có bức tranh cả GĐ4 | |

## D2 — Phỏng vấn online demo ở đâu

Bối cảnh: LiveKit cần cổng TCP/UDP, TLS và TURN khi hai bên ở hai mạng. Sửa `docker-compose.yml` prod và `nginx/` là thao tác
cần chủ dự án đồng ý (CLAUDE.md §7).

| Phương án | Trade-off | |
|---|---|---|
| Máy local + server prod | Demo được hai mạng khác nhau; phải sửa compose prod, nginx, mở cổng VPS | |
| Chỉ máy local | Đơn giản nhất, không đụng prod; prod để GĐ5 | ✅ |
| LiveKit Cloud | Không lo TURN/cổng; lệch đề cương ("tự host") | |

Các bước prod ghi trong `operation.md` để làm khi được đồng ý.

## D3 — Phòng nội bộ hay link ngoài

| Phương án | Trade-off | |
|---|---|---|
| Phòng nội bộ mặc định; không nhập link thì hệ thống điền link phòng; link ngoài vẫn được | Email/thẻ lịch/drawer không đổi vì vẫn đọc `onlineMeetingLink`; dữ liệu cũ giữ nguyên | ✅ |
| Bỏ link ngoài, chỉ phòng nội bộ | Một luồng duy nhất; phá lịch cũ đang dùng Meet/Zoom | |
| Thêm cột `livekitRoomName` (như roadmap) | Tách rõ; thêm migration và mọi nơi hiển thị phải đọc thêm cột | |

## D4 — Ai vào phòng, khi nào

| Phương án | Trade-off | |
|---|---|---|
| Ứng viên của đơn, người phỏng vấn, người tạo lịch; khung 15' trước giờ hẹn → hết giờ + 30' | Đúng người trong buổi, riêng tư cho ứng viên; người quan sát khác không vào được | ✅ |
| Mọi staff xem được lịch (cùng quy tắc `assertCanViewSchedule`) | Linh hoạt; org_admin/recruiter khác vào buổi phỏng vấn của người khác | |
| Không giới hạn giờ | Đơn giản; phòng mở vô thời hạn, token sống lâu | |

## D5 — Giao diện phòng họp

| Phương án | Trade-off | |
|---|---|---|
| `@livekit/components-react` dựng sẵn (`PreJoin`, `VideoConference`) | Có sẵn camera/mic/chia sẻ màn hình/chat; giao diện theo style LiveKit | ✅ |
| Tự dựng UI trên `livekit-client` | Khớp design TalentAI; nhiều ngày công, nhiều lỗi thiết bị | |

## D6 — Ai quyết định gợi ý co-pilot

| Phương án | Trade-off | |
|---|---|---|
| Luật bằng code quyết định; LLM chỉ viết lời giải thích khi recruiter bấm | Tất định, test được biên, hợp ADR 0002; có phần "AI" rõ ràng, tốn token chỉ khi bấm | ✅ |
| LLM quyết định bước tiếp theo | "AI" hơn; khó kiểm, kết quả dao động, tốn token mỗi thẻ | |
| Chỉ luật, không LLM | Rẻ nhất; phần "AI" chỉ là dùng điểm AI có sẵn | |

## D7 — Áp dụng gợi ý thế nào

| Phương án | Trade-off | |
|---|---|---|
| `POST /copilot/apply` phía server: tính lại gợi ý, khác key → 409, gọi `updateStatus` sẵn có, ghi `CopilotDecision` | Một lệnh, không áp gợi ý đã cũ, có dấu vết người duyệt (HITL) | ✅ |
| Web gọi thẳng API đổi trạng thái, không lưu quyết định | Ít code; không biết thay đổi nào đến từ gợi ý, bỏ qua thì lần sau hiện lại | |

## D8 — Thống kê đặt ở đâu

| Phương án | Trade-off | |
|---|---|---|
| Nâng cấp `/dashboard` sẵn có cho recruiter/org_admin/admin; chi phí AI là một khối cho org_admin/admin; giá model sửa ở `/ai-usage-logs` | Không thêm trang, sửa luôn A-04; dashboard dài hơn | ✅ |
| Trang `/analytics` mới, dashboard giữ nguyên | Tách bạch; A-04 vẫn còn ở dashboard cũ | |

## D9 — Gắn chi phí AI với tổ chức

Bối cảnh: `AiUsageLog` chỉ có `referenceId`. Phân tích JD dùng id tạm `jd-preview-…` nên không truy ra tổ chức. Spec GĐ3 đã để
"`organizationId` trên `AiUsageLog`" sang GĐ4.

| Phương án | Trade-off | |
|---|---|---|
| Thêm cột `organizationId` nullable, ghi ở các lời gọi biết tổ chức, điền ngược `cv_scoring` cũ | Đúng cho cả JD và co-pilot; phải sửa chữ ký `LlmService`/`EmbeddingService` | ✅ |
| Join lúc truy vấn qua `referenceId` | Không migration; bỏ sót JD và mọi loại không có bảng tham chiếu | |
| Không tách theo tổ chức | Đơn giản; org_admin không xem được chi phí của mình | |

## D10 — Lấy giá model từ đâu

| Phương án | Trade-off | |
|---|---|---|
| Bảng `AiModelPrice` do admin nhập; thiếu giá → chi phí `null` | Không ghi con số chưa kiểm vào code; cần admin nhập trước khi có số | ✅ |
| Hằng số trong code | Có số ngay; giá không có nguồn chính thức trong repo, sai mà không ai biết | |
| Biến môi trường JSON | Không cần UI; khó sửa, không hiện ở đâu | |

## D11 — Nhánh và PR

| Phương án | Trade-off | |
|---|---|---|
| Ba nhánh nối tiếp (M1 ⊂ M2 ⊂ M3) trên đỉnh GĐ3, mỗi PR base `dev` | CI chạy cho từng PR; merge theo thứ tự không conflict; diff có cả GĐ3 cho tới khi GĐ3 vào `dev` | ✅ |
| Ba nhánh độc lập từ `dev` | Diff gọn; conflict ở `schema.prisma`, `app.module.ts` khi merge, chưa có code GĐ3 | |
| PR xếp chồng (base là nhánh trước) | Diff gọn; CI không chạy (chỉ chạy PR vào `dev`) | |

## D12 — Funnel tính thế nào

| Phương án | Trade-off | |
|---|---|---|
| Nhóm đơn có `appliedAt` trong kỳ; "đạt giai đoạn S" = lịch sử từng có `toStatus = S` hoặc đang ở S | Đúng nghĩa tỉ lệ chuyển đổi, chịu được revert và nhảy cóc | ✅ |
| Đếm theo trạng thái hiện tại | Đơn giản; không phải funnel (đơn đã qua giai đoạn không được tính) | |

## D13 — Phòng chờ hoạt động thế nào

| Phương án | Trade-off | |
|---|---|---|
| API không cấp token cho ứng viên tới khi người phỏng vấn bấm Cho vào; `candidateWaitingAt`/`candidateAdmittedAt` trên lịch; báo qua Socket.IO | Chặn ở server, giữ được qua tải lại trang, có dấu vết; thêm 2 cột và một route | ✅ |
| Ứng viên vào LiveKit với quyền rỗng, người phỏng vấn nâng quyền qua `RoomServiceClient.updateParticipant` | Dùng tính năng của LiveKit; API phải gọi được LiveKit server (thêm URL nội bộ), ứng viên đã ở trong phòng khi chưa được nhận | |
| Chỉ màn chờ phía web tới giờ hẹn | Ít code nhất; không có "người phỏng vấn cho vào", không chặn ở server | |

## D14 — Thông báo qua kênh nào

| Phương án | Trade-off | |
|---|---|---|
| Thông báo trong ứng dụng (lưu DB) + sự kiện Socket.IO, qua `NotificationsService` sẵn có | Đúng đề cương ("thông báo qua Socket.IO"); chuông thông báo hiện ngay | ✅ |
| Thêm email nhắc lịch | Tới được người không mở web; thêm loại email, mẫu, test; email tạo lịch đã có | |

## D15 — Nhắc lịch thế nào khi lịch đổi

| Phương án | Trade-off | |
|---|---|---|
| Job trễ BullMQ lúc `startAt − 24h` và (online) `startAt − 15'`; job mang `startAt`, lịch đã đổi/huỷ thì bỏ qua | Không phải tìm và xoá job cũ; đúng giờ | ✅ |
| Job lặp mỗi phút quét lịch sắp tới | Không quản job theo lịch; chạy liên tục, phải nhớ lịch nào đã nhắc | |

## Đề xuất kỹ thuật đi cùng spec

- **Chọn:** `livekit-server-sdk` (tạo token phía API, không cần gọi server LiveKit), `livekit-client` + `@livekit/components-react`
  + `@livekit/components-styles` phía web; ghim phiên bản cũ hơn 2 tuần (`research.md`).
- **Chọn:** image `livekit/livekit-server` ghim tag, chạy `--dev` trong compose dev/test (khoá `devkey`/`secret` chỉ dùng local).
- **Bỏ:** webhook LiveKit để ghi điểm danh, đóng phòng chủ động. Lý do: token hết hạn đã chặn vào lại, phòng trống tự đóng.
- **Bỏ:** lưu lời giải thích của LLM. Lý do: chỉ để đọc, sinh lại khi cần; lưu thì phải tính khi nào nó cũ.
