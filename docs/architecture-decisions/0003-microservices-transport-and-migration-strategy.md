# 0003. Chiến lược transport và migration cho microservices (Phase 4)

## Trạng thái

Accepted

## Ngày

2026-07-16

## Bối cảnh (Context)

Roadmap (`docs/migration-roadmap.md`, mục "Architecture targets" và "Phase 4 — Microservices Extraction") đặt mục tiêu tách modular monolith hiện tại (NestJS + PostgreSQL + Redis + BullMQ + Socket.IO) thành 9 service vào Nov–Dec 2026: `auth-service`, `user-service`, `job-service`, `application-service`, `cv-service`, `ai-service`, `interview-service`, `notification-service`, `video-service`.

Bốn quyết định cần chốt trước khi bắt tay vào Phase 4, cả bốn gắn chặt với nhau (không tách được thành 4 ADR riêng vì cùng phục vụ một chiến lược migrate duy nhất):

1. **Transport** cho giao tiếp giữa service — cả bất đồng bộ lẫn đồng bộ.
2. **Chiến lược migrate** — viết lại toàn bộ (big-bang) hay tách dần từ monolith đang chạy.
3. **Thứ tự tách** service nào trước, service nào sau.
4. **Chiến lược dữ liệu** trong lúc tách — có tách DB theo service ngay không, và làm sao tránh dual-write problem khi bắt đầu publish event.

Đây là dự án solo developer (`docs/migration-roadmap.md` Risk Register: "Timeline slip (solo developer)" — Probability High, Impact High), nên rủi ro tiến độ là ràng buộc thật, không phải lý thuyết.

`docs/architecture/database.md` §4.2 xác nhận bằng cách đọc trực tiếp schema: nhiều model có FK Prisma cascade thật bắc cầu qua ≥2 service dự kiến (`Application` → candidateId/jobId/cvId qua user-/job-/cv-service; `CVScreening` → cv-/application-/ai-service; `InterviewSchedule` → application-/interview-/user-service). Đây là lý do chính khiến "tách DB ngay" và "tách core service trước" đều rủi ro.

## Quyết định (Decision)

**1. Transport:** NATS cho async event messaging, gRPC cho sync inter-service call (ví dụ: xác thực JWT tại API gateway gọi vào `auth-service`). REST vẫn giữ nguyên cho tầng public API Gateway hướng ra browser/client.

**2. Chiến lược migrate:** Strangler Fig — tách dần từng service ra khỏi monolith đang chạy, không viết lại toàn bộ (big-bang).

**3. Thứ tự tách** (theo độ coupling, ít nhất trước):
```
Step 1: Transport layer (NATS + NestJS hybrid mode + outbox pattern)
Step 2: ai-service          (isolated — nhận input, gọi Gemini, trả output)
Step 3: notification-service (chỉ tiêu thụ event)
Step 4: auth-service         (xử lý token, stateless)
Step 5: cv-service
Step 6: Core services (job-service, application-service, interview-service) — coupling cao nhất, tách sau cùng
Step 7: video-service
```

**4. Chiến lược dữ liệu:** Giữ nguyên **Shared DB** (một Postgres instance, một schema Prisma trong `libs/backend/database`) xuyên suốt toàn bộ Phase 4. Tách DB theo từng service bị hoãn tới sau January 2027. **Outbox pattern** (bảng `event_outbox` + publisher poll định kỳ) triển khai ngay ở Step 1, trước khi bất kỳ service nào (bắt đầu từ `ai-service` ở Step 2) phụ thuộc vào event.

## Lý do (Rationale)

- **NATS thay vì viết REST-broadcast tự chế**: hệ thống hiện đã có BullMQ (Redis) cho async job trong-process; NATS là bước tự nhiên để mở rộng pattern đó ra ngoài process boundary mà không cần một cluster nặng.
- **gRPC cho sync call nội bộ**: các cuộc gọi như xác thực token xảy ra ở gần như mọi request đi qua API gateway — hưởng lợi từ contract kiểu mạnh (protobuf) và overhead serialize thấp hơn JSON-over-HTTP. Đây không phải endpoint hướng ra browser nên không cần tính phổ dụng của REST.
- **Strangler Fig thay vì big-bang**: rủi ro cao nhất trong Risk Register là "Timeline slip (solo developer)", mitigation ghi rõ "Phase 4 is deprioritized if Phase 1–3 slip". Strangler Fig giữ hệ thống chạy được (deployable) ở mọi bước trung gian; big-bang thì không có hệ thống nào chạy được cho tới khi xong 100%, không tương thích với rủi ro đã xác định.
- **Thứ tự tách theo coupling**: `ai-service` được chính roadmap mô tả là "isolated — receives input, calls Gemini, returns output" — ít FK, ít phụ thuộc nghiệp vụ nhất. Ngược lại, `docs/architecture/database.md` §4.2 xác nhận core service (`Application`/`CVScreening`/`InterviewSchedule`) có FK cascade thật bắc cầu ≥2 service — tách những service này trước sẽ phải giải quyết cross-service query đồng thời với việc còn chưa có kinh nghiệm tách service nào. Để cuối cùng khi đã có 4 lần thực hành tách (Step 2–5) là hợp lý.
- **Shared DB xuyên suốt Phase 4 + outbox ở Step 1**: Risk Register ghi "Distributed transaction failure across services" — Probability High, Impact High, mitigation "Shared DB for entire Phase 4; Saga after January". Tách DB trước khi service boundary đã được kiểm chứng sẽ cộng dồn hai loại rủi ro cùng lúc (đúng boundary + đúng consistency). Outbox giải quyết đúng vấn đề dual-write (ghi DB thành công nhưng publish event thất bại) — phải có trước khi `ai-service` (Step 2) bắt đầu tiêu thụ event, không thể làm sau.

## Lựa chọn khác đã cân nhắc (Alternatives considered)

- **Kafka** (thay cho NATS) — mạnh hơn về throughput/durability ở quy mô lớn, nhưng cần vận hành cluster (ZooKeeper hoặc KRaft, quản lý partition/broker) — chi phí vận hành không tương xứng với khối lượng event thực tế của dự án solo-dev này (vài loại event: screening-complete, interview-scheduled, notification-triggered). Đây là suy luận dựa trên đặc điểm vận hành đã biết của hai hệ thống, không phải benchmark cụ thể đã đo. Loại.
- **RabbitMQ** (thay cho NATS) — trưởng thành, đủ khả năng, nhưng mô hình exchange/queue/binding có thêm một lớp khái niệm so với pub/sub theo subject của NATS, mà không đem lại khả năng nào thật sự cần thiết cho các event pattern đơn giản ở đây. Loại.
- **REST cho sync inter-service call** (thay cho gRPC, ví dụ xác thực token) — vẫn khả thi và đơn giản hơn để triển khai (không cần codegen protobuf), nhưng mất lợi ích contract kiểu mạnh cho một endpoint bị gọi rất thường xuyên và không hướng ra browser. REST vẫn giữ lại đúng chỗ nó phù hợp: API Gateway ra ngoài. Loại cho sync nội bộ.
- **Big-bang rewrite** — thiết kế + viết lại toàn bộ 9 service rồi cutover một lần — loại vì không có hệ thống nào deploy được cho tới khi hoàn tất, mâu thuẫn trực tiếp với rủi ro tiến độ cao nhất đã xác định.
- **Tách DB theo service ngay từ đầu Phase 4** — loại vì buộc phải giải quyết distributed transaction (saga) đồng thời với việc tách boundary, thay vì làm từng việc khó một lúc như roadmap đã chọn ("Shared DB for entire Phase 4; Saga after January").

## Đánh đổi (Trade-offs)

**Được:**
- Rủi ro tiến độ giảm dần theo từng bước, không phải all-or-nothing.
- Hệ thống luôn ở trạng thái deploy được trong suốt Phase 4.
- Outbox tránh mất event âm thầm (dual-write problem) trước khi có service nào phụ thuộc vào nó.
- Không phải viết lại toàn bộ query hiện tại (`include: { jobPosting, candidate, cv }` kiểu Prisma) ngay lập tức — vẫn dùng được tới khi tách DB thật.

**Mất:**
- Shared DB xuyên suốt Phase 4 nghĩa là các service **chưa** thật sự độc lập theo nghĩa "own datastore" thường gắn với microservices trưởng thành — đây là nợ kỹ thuật được hoãn có chủ đích, không phải bị loại bỏ.
- NATS có hệ sinh thái tooling/observability nhỏ hơn Kafka (ít managed offering hơn, ít công cụ giám sát sẵn có hơn) — chấp nhận được vì hệ thống tự host, quy mô nhỏ.
- gRPC cần duy trì protobuf schema + bước codegen mà REST không cần — thêm một loại tooling cho riêng phần gọi nội bộ.

## Hệ quả (Consequences)

- Ảnh hưởng toàn bộ Phase 4 (`docs/migration-roadmap.md`, cả 7 step của "Extraction order"), thêm NATS server vào `docker-compose.yml`, và Prisma schema (`libs/backend/database`) vẫn là **một bản duy nhất** cho tới sau January 2027.
- `event_outbox` (bảng + publisher poll) phải xong ở Step 1, trước `ai-service` (Step 2) — đúng thứ tự đã ghi trong roadmap, ADR này không đổi thứ tự đó, chỉ chính thức hoá lý do.
- ADR này **không đổi nội dung `docs/migration-roadmap.md`** — Phase 4 của roadmap đã phản ánh đúng quyết định này từ trước; ADR chỉ ghi lại "tại sao" mà roadmap không lặp lại.
- Nếu sau này đổi transport (ví dụ chuyển từ NATS sang Kafka khi quy mô event tăng) hoặc đổi thứ tự tách, phải tạo ADR mới ghi "Supersedes 0003", không sửa trực tiếp file này.
