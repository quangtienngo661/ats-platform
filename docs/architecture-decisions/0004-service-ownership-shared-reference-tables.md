# 0004. Service sở hữu cho bảng dữ liệu dùng chung (Department/Skill/JobCategory/AiConfig)

## Trạng thái

Accepted (2026-07-16, xác nhận bởi chủ dự án)

## Ngày

2026-07-16

## Bối cảnh (Context)

`docs/architecture/database.md` §4.3 xác nhận bằng cách đọc trực tiếp schema: `Department`, `Skill`, `JobCategory`, `AiConfig` sẽ được nhiều service tương lai đọc/ghi (Phase 4, `docs/migration-roadmap.md`) nhưng **chưa có service nào được gán làm chủ sở hữu chính thức**. Đây là câu hỏi mở #2 trong §5 của cùng file đó.

`docs/migration-roadmap.md` Phase 4 Step 6 ("Core services — coupling cao nhất, tách sau cùng") liệt việc này là điều kiện tiên quyết phải chốt **trước** khi tách `job-service`/`application-service`, và tự đánh dấu là "chưa quyết định chính thức" (`~1 day (decision + ADR)`).

Chốt chủ sở hữu là cần thiết vì một khi service đã tách, chỉ service sở hữu mới được ghi trực tiếp vào bảng đó qua Prisma — service khác phải gọi qua API/event, không còn `include` chéo bảng như monolith hiện tại.

**Lưu ý phạm vi:** §5 của `docs/architecture/database.md` còn liệt một câu hỏi mở khác (#3 — chiến lược soft-reference cho `Application`/`CVScreening`/`InterviewSchedule`, các model có FK bắc cầu ≥2 service theo §4.2). ADR này **không** giải quyết câu hỏi đó — nguồn tài liệu hiện có không chứa đề xuất cụ thể nào cho nó, chỉ nêu vấn đề. Cần một ADR riêng, sau khi có đề xuất, trước khi Phase 4 Step 6 thực sự tách `application-service`.

## Quyết định (Decision)

**Đã chốt** (Accepted, xem Trạng thái ở trên — ban đầu là đề xuất tạm, được chủ dự án xác nhận 2026-07-16):

- `Department` → `job-service`
- `Skill` → `job-service`
- `JobCategory` → `job-service`
- `AiConfig` → `ai-service`

Service sở hữu chịu trách nhiệm ghi (write) trực tiếp qua Prisma; service khác đọc qua API/event một khi đã tách, không còn JOIN/`include` chéo bảng.

## Lý do (Rationale)

`Department`, `Skill`, `JobCategory` đều gắn chặt nhất với `JobPosting` (departmentId, `JobPostingSkill`, cây cha-con của `JobCategory`) — service sẽ sở hữu `JobPosting` (`job-service`, theo target architecture trong `docs/migration-roadmap.md`) là nơi tự nhiên nhất để giữ luôn các bảng phụ trợ này, vì đa số write/read đi cùng lúc với thao tác trên `JobPosting`.

`AiConfig` cấu hình hành vi chấm điểm AI (`minimumScoreThreshold`, v.v.) — đọc/ghi chủ yếu bởi luồng chấm điểm CV, được `ai-service` sở hữu (Gemini wrapper + RAG, theo target architecture).

## Lựa chọn khác đã cân nhắc (Alternatives considered)

Nguồn tài liệu (`docs/architecture/database.md`, `docs/migration-roadmap.md`) chỉ ghi lại đúng một đề xuất — không có ghi chép nào cho thấy đã cân nhắc và loại các phương án khác. Để không bịa lý do chưa từng được viết ra, ADR này chỉ nêu các phương án khả dĩ mà **chưa** được đánh giá, đúng như tình trạng thật:

- **Giữ nguyên trạng "không ai sở hữu", mọi service đọc trực tiếp qua Prisma dùng chung** — đây chính là vấn đề đang cần giải quyết, không phải phương án khả thi sau khi tách; loại vì mâu thuẫn với chính lý do Phase 4 Step 6 cần quyết định này trước khi tách.
- **Một `reference-data-service` riêng, sở hữu toàn bộ bảng lookup dùng chung** (thay vì gán vào `job-service`/`ai-service` theo domain gần nhất) — chưa được cân nhắc trong tài liệu nguồn nào; có thể là phương án hợp lý nếu tần suất đọc từ nhiều service khác nhau cao hơn dự kiến, nhưng chưa có dữ liệu (query pattern thật) để đánh giá.

## Đánh đổi (Trade-offs)

**Được:**
- Cho Phase 4 Step 6 một điểm khởi đầu cụ thể thay vì để trống.
- Khớp với nguyên tắc "chủ sở hữu = nơi ghi/đọc nhiều nhất" — dễ giải thích, dễ nhớ.

**Mất:**
- Chưa được kiểm chứng bằng query pattern thật — ví dụ `cv-service` hoặc `interview-service` có thể đọc `Skill` thường xuyên hơn dự đoán (matching kỹ năng CV, tiêu chí phỏng vấn), và nếu vậy việc đặt `Skill` ở `job-service` sẽ tạo nhiều cross-service call hơn mong đợi. Rủi ro này vẫn còn dù đã Accepted — nếu query pattern thật cho thấy sai, cần một ADR mới ghi `Supersedes 0004` thay vì sửa lại file này.

## Hệ quả (Consequences)

- Đã được chủ dự án xác nhận (2026-07-16) — không còn là đề xuất tạm, có thể trích dẫn như quyết định chính thức.
- Không đổi code, không đổi `docs/migration-roadmap.md`/`docs/architecture/database.md` — cả hai đã phản ánh đúng đây là đề xuất, ADR này chỉ đưa đề xuất đó vào định dạng ADR để nó có một nơi duy nhất, chính thức để trỏ tới.
- Câu hỏi mở #3 (soft-reference cho `Application`/`CVScreening`/`InterviewSchedule`) vẫn treo, cần một ADR riêng trước khi Phase 4 Step 6 tách `application-service`/`interview-service`.
- Nếu được Accept, cần cập nhật `docs/migration-roadmap.md` Phase 4 Step 6 để trỏ về ADR này thay vì tự mô tả đề xuất inline (ngoài phạm vi thay đổi của ADR này — chỉ ghi lại ở đây để không quên).
