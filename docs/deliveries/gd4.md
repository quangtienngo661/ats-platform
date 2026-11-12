# GĐ4 — Phỏng vấn trực tuyến, AI co-pilot, thống kê — plan tóm tắt (13/11/2026)

Plan chi tiết: [`docs/tasks/gd4/plan.md`](../tasks/gd4/plan.md). Spec: [`docs/tasks/gd4/spec.md`](../tasks/gd4/spec.md).

## M1 — Phòng phỏng vấn trực tuyến
1. Tính khung giờ được vào phòng và kiểm điều kiện vào.
2. Lịch online không nhập link thì tự dùng phòng nội bộ.
3. API cấp token LiveKit cho đúng người trong buổi phỏng vấn.
4. Thêm LiveKit server vào compose dev và test.
5. Trang phòng họp và nút "Vào phòng phỏng vấn" cho ứng viên và recruiter.
6. E2E hai người vào cùng phòng.

## M2 — AI co-pilot
1. Bảng luật gợi ý bước tiếp theo cho từng đơn.
2. Bảng ghi quyết định áp dụng/bỏ qua và loại log AI `copilot`.
3. API xem, áp dụng, bỏ qua gợi ý và nhờ AI giải thích.
4. Gợi ý trên thẻ Kanban và dialog áp dụng.
5. E2E áp dụng gợi ý "Mời phỏng vấn".

## M3 — Thống kê và chi phí AI
1. Tính funnel, thời gian ở mỗi giai đoạn và chi phí AI.
2. Gắn log AI với tổ chức và thêm bảng giá model.
3. API thống kê tuyển dụng, tổng hợp chi phí AI, bảng giá.
4. Nâng cấp dashboard và bảng giá model cho admin.
5. E2E dashboard hiện đúng số funnel.

## M4 — Phòng chờ và thông báo (bổ sung 13/11)
1. Thêm trạng thái chờ và đã cho vào trên lịch phỏng vấn.
2. API giữ ứng viên ở phòng chờ, báo người phỏng vấn, cho vào; đổi giờ thì phải chờ lại.
3. Nhắc lịch trước 24 giờ và báo phòng đã mở qua queue, thông báo trong ứng dụng.
4. Màn chờ của ứng viên, dải "đang chờ" và nút Cho vào của người phỏng vấn.
5. E2E chờ → cho vào → thấy nhau, và thông báo phòng đã mở qua queue thật.

---

# GĐ4 — as-built (12/11/2026, chưa merge)

Ba nhánh nối tiếp trên đỉnh GĐ3, mỗi PR base `dev`: M1 `feat/gd4-p1-video-interview` → M2 `feat/gd4-p2-copilot` →
M3 `feat/gd4-p3-analytics`. Merge sau chuỗi GĐ3 (#75–#79), theo thứ tự M1 → M2 → M3.

## Đã làm và đã kiểm

- **M1 — phòng phỏng vấn trực tuyến:** lịch online không cần link ngoài (hệ thống ghi link phòng nội bộ); `POST
  /interviews/schedules/:id/join` cấp token LiveKit cho ứng viên, người phỏng vấn, người tạo lịch, từ 15' trước giờ hẹn
  tới 30' sau giờ kết thúc; LiveKit `v1.13.10` trong compose dev và test; trang `/interview-room/[id]` (kiểm thiết bị →
  phòng họp có camera, mic, chia sẻ màn hình, chat); nút "Vào phòng phỏng vấn" cho ứng viên và recruiter.
- **M2 — AI co-pilot:** 9 luật gợi ý bước tiếp theo bằng code; gợi ý trên thẻ Kanban; áp dụng (đổi trạng thái qua FSM sẵn
  có hoặc chạy sàng lọc) và bỏ qua đều ghi `copilot_decisions`; "AI giải thích" gọi LLM theo yêu cầu. Không có nút từ
  chối nào của co-pilot (ADR 0002).
- **M3 — thống kê:** `GET /analytics/recruitment` (funnel, thời gian ở giai đoạn, xu hướng, 6 đơn mới nhất bằng query,
  sửa A-04); `ai_usage_logs.organization_id` + điền ngược; bảng giá model do admin nhập; `GET /analytics/ai-cost`;
  dashboard mới cho recruiter/org_admin/admin; bảng giá ở trang Nhật ký AI.
- **Kiểm chứng:** unit test API và web, typecheck, lint (số liệu trong mô tả từng PR); probe migration trên Postgres dùng
  một lần (`results/task-2.2-*.txt`, `results/task-3.2-*.txt`); E2E thật trên stack test: phòng LiveKit hai người, co-pilot
  áp dụng/bỏ qua, dashboard ba vai trò (`operation.md`).

- **M4 — phòng chờ và thông báo (13/11, nhánh `feat/gd4-p4-waiting-room` từ M3):** ứng viên chưa được cho vào không
  nhận token, thấy màn chờ; người phỏng vấn/người tạo lịch nhận sự kiện Socket.IO `interview-room:waiting` và thông
  báo "Ứng viên đang chờ", bấm **Cho vào** (`POST /interviews/schedules/:id/admit`); đổi giờ/hình thức thì chờ lại.
  Queue `interview-reminders`: "Nhắc lịch phỏng vấn" trước 24 giờ, "Phòng phỏng vấn đã mở" lúc phòng mở, gửi cho ứng
  viên, người phỏng vấn, người tạo lịch qua thông báo trong ứng dụng (`notification:new`). Probe migration:
  `results/task-4.1-migration-probe.txt`. E2E: `operation.md`.

## Chưa làm / chưa kiểm

| Mục | Lý do |
|---|---|
| Deploy LiveKit lên prod | Cần sửa `docker-compose.yml` prod và `nginx/`, mở cổng VPS — chờ chủ dự án đồng ý (D2); các bước ở `operation.md` |
| "AI giải thích" với LLM thật | Không có key AI thật trong phiên; chỉ kiểm bằng unit test (thành công và 503) |
| Hai người ở hai mạng khác nhau (qua NAT/TURN) | Chỉ chạy được trên một máy; cần môi trường prod |
| Build image API của stack test trên máy này | Đứng ở `npm ci` hai lần; E2E chạy với API trên máy, cùng biến môi trường |
| "Nhắc lịch phỏng vấn" (−24h) chạy thật | Chỉ unit test; E2E chỉ chạy được job "phòng đã mở" (chạy ngay). Kiểm tay: checklist 1b.9 |
| Bấm vào thông báo để mở phòng | Thông báo hiện tại chỉ đánh dấu đã đọc, không dẫn tới trang nào (hành vi sẵn có của chuông thông báo) |
