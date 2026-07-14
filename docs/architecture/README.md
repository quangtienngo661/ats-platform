# Architecture Snapshot

Bộ 3 file mô tả kiến trúc hệ thống ATS Platform tại thời điểm 2026-07-11, tách riêng để mang sang session mới mà không cần đọc lại toàn bộ code từ đầu.

- [`system.md`](system.md) — kiến trúc backend/frontend, luồng request (sync/async/realtime), BullMQ queue, AI Mock Interview flow, auth.
- [`database.md`](database.md) — 24 model Prisma theo domain, điểm thiết kế tốt, vấn đề kỹ thuật đã xác nhận (index thiếu, FK bắc cầu qua service, enum mồ côi), câu hỏi còn mở.
- [`infrastructure.md`](infrastructure.md) — docker-compose (dev vs prod), networking, storage, SSL, CI/CD, sự cố hạ tầng gần nhất.

## Nếu bắt đầu session mới cho việc migrate

Đọc theo thứ tự này để có đủ ngữ cảnh nhanh nhất:

1. **`database.md`** (file này) — nếu công việc tập trung vào DB/RAG/microservices data layer.
2. [`../migration-roadmap.md`](../migration-roadmap.md) — kế hoạch Phase 0-5, checklist, Risk Register, Progress Log (mục "Progress Log" ở đầu file cho biết đang ở đâu).
3. [`../architecture-decisions/`](../architecture-decisions/) — các quyết định đã chốt kèm lý do/trade-off (ADR). Đọc trước khi đề xuất lại hướng đã quyết định.
4. `system.md` / `infrastructure.md` — đọc thêm nếu việc đang làm chạm tới phần ngoài DB.

## Trạng thái hiện tại (tóm tắt, xem Progress Log trong migration-roadmap.md để cập nhật mới nhất)

- Phase 0: gần xong (7/8 mục `[x]`, còn Winston logging đã code nhưng chưa commit).
- Phase 1: phần technical debt có tiến triển (2/7 `[x]`), phần feature (candidate/recruiter flows, email) chưa bắt đầu.
- Phase 2-5: chưa bắt đầu.
- Sự cố gần nhất: container `ats-api` crash-loop do Docker Alpine/musl, đã fix (`apps/api/Dockerfile`), đang chờ verify sau rebuild.
- Bối cảnh làm việc: học kỳ tới (bắt đầu ~Sep 2026) người phát triển tập trung toàn thời gian cho đồ án này — không có áp lực deadline gấp, ưu tiên là hiểu sâu kiến trúc xuyên suốt quá trình migrate hơn là tốc độ.

## Khi có quyết định kiến trúc mới

1. Ghi ADR mới vào `../architecture-decisions/` (copy `0000-template.md`).
2. Cập nhật checklist tương ứng trong `../migration-roadmap.md` (đánh `[x]` hoặc sửa mục liên quan) + thêm 1 dòng vào Progress Log.
3. Nếu quyết định làm thay đổi nội dung 1 trong 3 file kiến trúc ở đây, cập nhật luôn — 3 file này chỉ có giá trị nếu được giữ khớp với thực tế, không phải chụp 1 lần rồi bỏ.
