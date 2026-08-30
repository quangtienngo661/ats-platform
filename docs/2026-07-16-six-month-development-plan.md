# Kế hoạch phát triển 6 tháng tới — ATS Platform

**Ngày:** 2026-07-16
**Phạm vi:** Tháng 7/2026 → tháng 1/2027 (6.5 tháng). Đây là bản tổng hợp một-lần (point-in-time), gom lại thông tin đang nằm rải rác ở nhiều file (`current-state.md`, `migration-roadmap.md`, `docs/architecture/`, `docs/architecture-decisions/`, `docs/research/`) thành **một tài liệu duy nhất** để đọc/trình bày mà không cần mở 10 file khác nhau.
**Không thay thế** `docs/migration-roadmap.md` — file đó vẫn là nơi cập nhật checklist hàng ngày (đánh dấu `[x]`/`[ ]`, thêm dòng Progress Log). Tài liệu này là ảnh chụp để báo cáo/trình bày, không phải nơi tick việc.

**Phương pháp:** tổng hợp trực tiếp từ `docs/migration-roadmap.md` (đọc toàn bộ, bao gồm Progress Log), `docs/architecture/README.md` (mục "Trạng thái hiện tại", vừa được xác minh lại với code hôm nay), 5 ADR ở `docs/architecture-decisions/`, và phần khuyến nghị trong `docs/research/2026-07-15-voice-video-microservices-differentiators.md`. Không có tuyên bố nào trong tài liệu này là suy đoán mới — mọi con số/mốc thời gian đều lấy nguyên từ các file nguồn nói trên.

**Hợp đồng về độ mới (freshness contract):** tài liệu này chỉ còn đúng nếu không có phase nào bị trễ/thay đổi so với ngày viết. Nếu đọc lại sau hơn ~4 tuần, hoặc nếu `migration-roadmap.md`'s Progress Log có mục mới hơn 2026-07-16, **tin file đó, không tin file này** — đây là ảnh chụp, không phải nguồn sự thật sống.

---

## 1. Hệ thống đang ở đâu (hôm nay, 2026-07-16)

- **Phase 0 (vá nền tảng) và Phase 0.5 (ổn định hoá) đã xong toàn bộ.** Phase 0.5 vá 4 nhóm lỗi thật đã tìm thấy qua audit: bảo mật (leo quyền qua `PATCH /candidates/me`, `UserStatus.inactive` không được enforce, lộ tin tuyển dụng chưa công bố...), độ tin cậy hàng đợi bất đồng bộ (BullMQ không retry thật, lỗi bị nuốt khiến job "thất bại" bị ghi nhận "hoàn tất"), toàn vẹn nghiệp vụ (bỏ qua state machine khi revert trạng thái đơn ứng tuyển), và lưới an toàn vận hành (`GET /health`, backup script). **Còn đúng 1 lỗi thật chưa sửa**: health check bị treo (không trả về) thay vì báo lỗi 503 khi Redis bị đóng băng, vì lệnh ping Redis không có giới hạn thời gian chờ.
- **Phase 1 (hoàn thiện luồng nghiệp vụ cốt lõi)**: đang chạy, phần nợ kỹ thuật đã xong sớm 1 phần qua Phase 0.5 (health check, backup); phần tính năng (candidate xem lịch phỏng vấn, ghi chú ứng viên, thông báo email...) **chưa bắt đầu code**.
- **Hôm nay (07-16)**: sửa lại cách AI đề xuất sau khi chấm CV — trước đây điểm cao vượt ngưỡng+20 sẽ được gắn nhãn "Nên tuyển" ngay (trước khi phỏng vấn), giờ sàng lọc CV chỉ còn đề xuất "nên phỏng vấn" hoặc "không phù hợp"; quyết định tuyển thật sự luôn đi qua từng bước Kanban do recruiter tự bấm, không suy luận thẳng từ điểm số nữa.
- **Phase 1.5, Phase 2, Phase 3, Phase 3.5, Phase 4, Phase 5: chưa bắt đầu code.**
- Bối cảnh: dự án đồ án của 1 sinh viên làm một mình, không có áp lực deadline gấp — ưu tiên hiểu sâu kiến trúc trong lúc migrate hơn là chạy nhanh.

---

## 2. Lộ trình 6 tháng, theo từng giai đoạn

| Giai đoạn | Thời gian dự kiến | Mục tiêu chính | Vì sao xếp thứ tự này |
|---|---|---|---|
| **Phase 1** — Hoàn thiện luồng cốt lõi | T7–T8/2026 | Candidate xem được lịch phỏng vấn, timeline đơn ứng tuyển; recruiter ghi chú/so sánh ứng viên, chấm CV hàng loạt; email thông báo; thêm index còn thiếu, chuẩn hoá bảng `CandidateSkill` | Một demo bị đứt giữa chừng còn tệ hơn 1 demo ít tính năng — đóng hết luồng gãy trước khi thêm cái mới |
| **Phase 1.5** — Tính năng khác biệt hoá | Sau Phase 1 (~1–1.5 tuần) | Panel AI gợi ý bước tiếp theo trên Kanban, panel "ứng viên đáng xem lại", chấm code tự động (Judge0 tự host) | Không phụ thuộc RAG/video/microservices — kéo lên sớm vì làm được ngay, không cần chờ hạ tầng khác |
| **Phase 2** — Nâng cấp AI bằng RAG | T9/2026 | Bật `pgvector`, chấm CV nhất quán hơn (so với các CV đã chấm trước), sinh câu hỏi phỏng vấn từ ngân hàng câu hỏi thay vì AI tự bịa mỗi lần, gợi ý job phù hợp cho ứng viên | Cải thiện trực tiếp chất lượng AI đang có, chi phí hạ tầng thấp hơn nhiều so với video/voice — làm trước khi thêm tính năng mới nặng hơn |
| **Phase 3** — Tích hợp video call | T10/2026 | Phỏng vấn trực tuyến qua LiveKit (nền tảng video mã nguồn mở, tự host) giữa candidate và recruiter | Chọn LiveKit vì tự host được, có SDK React/Node sẵn, có TURN/STUN server tích hợp (xem ADR 0005 để hiểu vì sao voice AI cũng dựa trên nền tảng này) |
| **Phase 3.5** — Voice AI cho mock interview | Sau Phase 3 (2–3 tuần) | AI phỏng vấn bằng giọng nói (LiveKit Agents + Gemini Live) — ứng viên nói, AI nói lại, thay vì chỉ gõ chữ | **Phải làm sau Phase 3**, không song song — kiến trúc chọn là AI "vào phòng" LiveKit như 1 người tham gia, nên cần server LiveKit tồn tại trước. Có phương án dự phòng rẻ hơn (Web Speech API có sẵn trình duyệt) nếu thời gian gấp |
| **Phase 4** — Tách microservices | T11–T12/2026 | Tách dần từ hệ thống 1 khối (monolith) sang nhiều service độc lập, bắt đầu từ `ai-service` (ít phụ thuộc nhất) → `notification-service` → `auth-service` → `cv-service` → cuối cùng mới đến `job`/`application`/`interview`-service (phụ thuộc nhiều nhất) | Tách theo độ phụ thuộc từ thấp đến cao — xem ADR 0003 để biết vì sao chọn NATS/gRPC và thứ tự này |
| **Phase 5** — Làm cứng cho production | T12/2026–T1/2027 | Backup tự động, CI/CD, giám sát hệ thống (Grafana/Prometheus), bảo mật bổ sung | Chạy song song Phase 4 khi có thể — phần an toàn dữ liệu (backup) đã được kéo sớm lên làm từ Phase 1, không đợi tới đây |

---

## 3. Quyết định kiến trúc đã chốt (ADR)

5 quyết định đã ghi thành ADR ở `docs/architecture-decisions/` — mỗi cái giải thích "tại sao chọn cái này, không phải cái khác":

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [0001](architecture-decisions/0001-docker-base-image-glibc.md) | Đổi base image Docker của API từ Alpine sang Debian slim (fix lỗi crash-loop do thư viện xử lý PDF cần glibc) | Accepted |
| [0002](architecture-decisions/0002-no-auto-reject-on-ai-score.md) | Không tự động loại ứng viên chỉ dựa trên điểm AI (luật GDPR cấm quyết định tuyển dụng hoàn toàn tự động) | Accepted |
| [0003](architecture-decisions/0003-microservices-transport-and-migration-strategy.md) | Chiến lược tách microservices: NATS (gửi sự kiện không đồng bộ) + gRPC (gọi trực tiếp đồng bộ), tách dần kiểu "Strangler Fig", giữ chung 1 database tới hết Phase 4 | Accepted |
| [0004](architecture-decisions/0004-service-ownership-shared-reference-tables.md) | Các bảng dùng chung (Department/Skill/JobCategory thuộc về `job-service`, AiConfig thuộc về `ai-service`) | Accepted (2026-07-16) |
| [0005](architecture-decisions/0005-voice-ai-livekit-agents-gemini-live.md) | Voice AI dùng LiveKit Agents + Gemini Live — tái dùng hạ tầng LiveKit (Phase 3) và API key Gemini đã có, không thêm nhà cung cấp thứ 3 | Accepted |

---

## 4. Rủi ro lớn nhất (rút gọn từ Risk Register trong `migration-roadmap.md`)

- **Trễ tiến độ** (khả năng cao, tác động cao) — vì làm một mình. Cách giảm thiểu: nếu Phase 1–3 bị trễ, Phase 4 (microservices) sẽ bị hạ ưu tiên trước tiên, không phải Phase 1-3.
- **Mất dữ liệu Postgres trước khi có backup** — đã kéo việc backup lên làm sớm ở Phase 1 thay vì đợi tới Phase 5.
- **Hết quota/tiền của Gemini API** — đã từng xảy ra thật trong lúc dev (lỗi `RESOURCE_EXHAUSTED`) — cần theo dõi billing, giữ sẵn phương án phản hồi giả (mock) để demo không bị gián đoạn nếu hết quota giữa chừng.
- **Giao dịch phân tán bị lỗi khi tách service** — dùng chung 1 database tới hết Phase 4 để né vấn đề này, chuyển sang xử lý bằng Saga pattern sau tháng 1/2027.

---

## 5. Cố ý không làm / để sau (đọc để biết ranh giới đã có chủ đích, không phải bị quên)

Những thứ đã cân nhắc và **quyết định không làm** trong 6 tháng này, kèm lý do cụ thể (không phải "không có thời gian" chung chung):

Từ `docs/research/2026-07-15-voice-video-microservices-differentiators.md`:

- Đăng tin tự động lên LinkedIn/Indeed — cần trở thành đối tác kỹ thuật chính thức của họ, không chỉ là vấn đề chi phí API.
- Tiện ích trình duyệt để lấy dữ liệu ứng viên từ LinkedIn — vi phạm điều khoản sử dụng, rủi ro pháp lý thật (LinkedIn đã kiện nhà cung cấp công cụ tương tự năm 2026).
- Chữ ký điện tử thật (DocuSign) cho thư mời làm việc — không có gói miễn phí dùng được cho môi trường thật; thay bằng nút "Đồng ý/Từ chối" tự làm, ghi rõ đây là mô phỏng quy trình, không phải chữ ký điện tử có giá trị pháp lý.
- Kiểm tra lý lịch ứng viên (background check) — luật Mỹ (FCRA) yêu cầu bên yêu cầu kiểm tra phải là doanh nghiệp thật đang tuyển dụng thật, đồ án không đủ tư cách pháp lý dù API có giá phải chăng.

Từ `docs/research/2026-07-13-ats-ai-screening-interview.md`:

- Bộ chuẩn kỹ năng phân cấp + so khớp ngữ nghĩa đầy đủ kiểu LinkedIn/ESCO — quy mô nghiên cứu quá lớn cho 1 đồ án, để dành cho "future work".
- Kiểm toán thiên vị AI độc lập theo luật NYC Local Law 144 / hồ sơ tuân thủ EU AI Act — cần dữ liệu ứng viên thật quy mô lớn và bên kiểm toán độc lập thứ 3, không khả thi với dữ liệu tổng hợp/demo của đồ án.

---

## 6. Đọc thêm nếu cần đào sâu

- Checklist chi tiết từng phase, ước lượng thời gian từng việc nhỏ: [`docs/migration-roadmap.md`](migration-roadmap.md)
- Kiến trúc hệ thống hiện tại (backend/frontend/DB/hạ tầng), đã xác minh lại 2026-07-16: [`docs/architecture/`](architecture/)
- Nghiên cứu so sánh với ATS thật (Greenhouse/Ashby/Workday...) và các tính năng khác biệt hoá: [`docs/research/`](research/)
- Bằng chứng chạy thật cho Phase 0.5 (không chỉ unit test): [`docs/audit/2026-07-14-phase-0.5-verification.md`](audit/2026-07-14-phase-0.5-verification.md)
