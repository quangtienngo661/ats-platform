# Decision record — GĐ3 phần 1–4: nâng cấp AI bằng RAG

**Ngày:** 2026-10-30 · Các quyết định do người dùng chọn qua câu hỏi trong chat cùng ngày (brainstorm GĐ3 phần 1–4) · Spec:
[spec.md](spec.md). Các phương án dưới đây là đúng những gì đã trình bày trong chat; không thêm phương án mới. Quyết định của
phần 0 nằm ở [`../gd3-p0-ai-provider/decision.md`](../gd3-p0-ai-provider/decision.md).

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D0 | Cách hiểu mục tiêu và 5 giả định | Đúng như trình bày | Người dùng ("ok") |
| D1 | Khi chấm CV, RAG truy hồi gì | C: khớp kỹ năng bằng code luôn chạy + mốc chấm đã duyệt khi đủ | Người dùng |
| D2 | Người duyệt sửa được gì | Sửa 3 điểm con, điểm tổng tính lại | Người dùng |
| D3 | "Kiểm chứng được" đo bằng gì | Script đo offline | Người dùng |
| D4 | Kỹ năng CV không khớp bảng `Skill` | Giữ dạng chữ | Người dùng |
| D5 | Ngân hàng câu hỏi thuộc ai, gắn với gì | Toàn hệ thống, theo topic + độ khó | Người dùng |
| D6 | LLM làm gì với câu truy hồi | Chọn + sinh bù, ghi nguồn | Người dùng |
| D7 | Vector lưu ở đâu | Cột trên từng bảng | Người dùng |
| — | Bốn đoạn thiết kế | Duyệt từng đoạn ("Ổn") | Người dùng |

## D0 — Cách hiểu và giả định

Đã trình bày: mục tiêu theo đề cương (pgvector + embedding, chấm CV bằng RAG "nhất quán hơn giữa các lần chạy", người duyệt
trên từng kết quả chấm, ngân hàng câu hỏi kiểm soát độ khó, khớp kỹ năng theo nghĩa; kết quả "nhất quán và kiểm chứng
được") và hiện trạng code (B-01 còn mở, chưa có ngân hàng câu hỏi, `CVScreening` chưa có trường duyệt, chưa có cột vector).
Năm giả định được người dùng xác nhận: (1) mục đích demo/bảo vệ, quy mô vài chục CV; (2) "kiểm chứng được" = phép đo lặp
lại được, đưa vào báo cáo; (3) dữ liệu demo phải seed; (4) mọi thứ truy hồi tách theo tổ chức; (5) người duyệt chỉ ghi nhận
và điều chỉnh điểm, AI không tự đổi trạng thái (ADR 0002).

## D1 — Khi chấm CV, RAG truy hồi gì

Bối cảnh: LLM hôm nay tự so kỹ năng CV với JD bằng chữ rồi trả 3 điểm con; điểm tổng do code tính theo trọng số `AiConfig`.

| Phương án | Trade-off | |
|---|---|---|
| A: truy hồi các lần chấm cũ đã có người duyệt làm mốc | Đúng nghĩa RAG, nối người duyệt vào vòng; cold start với tin mới, demo phải seed mốc, mốc lệch kéo điểm lệch | |
| B: khớp kỹ năng bằng code (embedding + bảng `Skill`, sửa B-01), LLM chấm trên kết quả | Không cold start, bước dao động nhất thành tất định; phụ thuộc phần 2, "RAG" là truy hồi taxonomy, điểm vẫn do LLM | |
| C: B làm nền luôn chạy, A thêm vào khi tin có đủ mốc | Lấy cả hai lợi ích, đề cương đòi cả hai ý; nhiều việc nhất, phải đo riêng phần góp của từng cái | ✅ |

## D2 — Người duyệt sửa được gì

| Phương án | Trade-off | |
|---|---|---|
| Sửa 3 điểm con, điểm tổng tự tính lại; lưu điểm AI gốc + điểm sửa + lý do | Mốc có cùng cấu trúc đầu ra AI, so được AI với người theo từng trục; form có 3 ô | ✅ |
| Chỉ sửa điểm tổng + lý do | Đơn giản nhất; mốc chỉ còn một con số, lệch công thức trọng số | |
| 3 điểm con + sửa danh sách kỹ năng khớp/thiếu | Dạy được cả phần B; nặng nhất | |

## D3 — "Kiểm chứng được" đo bằng gì

| Phương án | Trade-off | |
|---|---|---|
| Script đo offline: ~10 cặp CV–tin, mỗi cặp chấm 5 lần ở 3 chế độ, báo độ lệch chuẩn | Trả lời đúng câu hỏi, chạy lại được, tách được phần góp B và A; tốn vài USD mỗi lần đo (ASSUMPTION), phải soạn bộ dữ liệu | ✅ |
| Nút "chấm lại để kiểm tra" trong app | Demo trực quan; tốn tiền mỗi lần bấm, thêm UI, khó ra số tổng hợp | |
| Chỉ so điểm AI với điểm người duyệt | Không tốn thêm lời gọi; đo độ đúng chứ không đo nhất quán giữa các lần chạy, cần nhiều lần duyệt thật | |

Ghi nhận cùng lúc: so điểm AI với điểm duyệt tự có sẵn từ dữ liệu D2, dùng làm số liệu phụ.

## D4 — Kỹ năng CV không khớp bảng `Skill`

Bối cảnh: kỹ năng của tin luôn là dòng có sẵn trong `Skill`, nên kỹ năng lạ trong CV không đổi điểm; nó chỉ quyết định
`CandidateSkill` đầy đủ đến đâu. Research `docs/research/2026-07-14-skill-taxonomy-unknown-skill.md` khuyên giữ bảng
taxonomy và cột `isVerified`.

| Phương án | Trade-off | |
|---|---|---|
| Chỉ khớp vào kỹ năng đã có; kỹ năng lạ giữ dạng chữ trong `CVParsedData` | Đủ cho chấm điểm, không sinh rác, ít việc nhất; `CandidateSkill` chỉ có kỹ năng đã có, bảng không tự lớn | ✅ |
| Tạo `Skill` với `isVerified=false`, admin duyệt/gộp | Bảng lớn dần, hồ sơ đủ; thêm migration và màn duyệt | |
| Như trên + LLM gợi ý gộp | Admin gộp nhanh hơn; nặng nhất, thêm loại lời gọi AI | |

Hệ quả: câu hỏi để ngỏ "tách phần 2 thành 2a/2b" (đặt ra trước brainstorm) không còn cần, vì phần chuẩn hoá chỉ còn nối
`CandidateSkill` cho kỹ năng đã khớp.

## D5 — Ngân hàng câu hỏi thuộc ai, gắn với gì

Bối cảnh: `InterviewSession` gắn ứng viên + `InterviewTopic` + độ khó, không gắn tin; `Skill`, `JobCategory` là bảng toàn
hệ thống.

| Phương án | Trade-off | |
|---|---|---|
| Toàn hệ thống, gắn `InterviewTopic` + độ khó, admin soạn; "vị trí" hiểu là topic | Khớp luồng hiện có, không đụng multi-tenant, ít việc nhất; không có câu riêng cho từng tin | ✅ |
| Theo tổ chức, gắn `JobPosting`, recruiter soạn | Sát chữ "theo từng vị trí tuyển dụng"; đổi luồng, lộ câu hỏi trước phỏng vấn thật, tách tổ chức, nhiều việc nhất | |
| Cả hai | Linh hoạt nhất; gộp chi phí của cả hai | |

## D6 — LLM làm gì với câu truy hồi

| Phương án | Trade-off | |
|---|---|---|
| Chọn 10 câu trong ~25 câu truy hồi, viết lại nhẹ; thiếu thì sinh bù, ghi nguồn `bank`/`generated` | Phiên không hỏng vì thiếu câu, đo được tỉ lệ câu từ ngân hàng; vẫn có câu AI tự sinh khi ngân hàng mỏng | ✅ |
| Chỉ dùng câu trong ngân hàng, thiếu thì không mở phiên | Nhất quán tuyệt đối; topic thiếu câu thì không luyện được, demo phụ thuộc seed | |
| Ngân hàng chỉ là ví dụ, LLM vẫn sinh mới | Ít thay đổi nhất; không đạt ý "thay vì để AI tự bịa" | |

## D7 — Vector lưu ở đâu

| Phương án | Trade-off | |
|---|---|---|
| Cột `embedding vector(1536)` trên từng bảng (`Skill`, `CVParsedData`, bảng câu hỏi), raw SQL gom vào một helper | Giữ FK, query gắn thẳng dữ liệu gốc, embed lại tại chỗ; ba nơi raw SQL | ✅ |
| Một bảng `embeddings(entityType, entityId, vector)` | Một chỗ, thêm loại mới không migration; mất FK, dễ có vector mồ côi, query nào cũng join | |

## Đề xuất kỹ thuật được duyệt cùng thiết kế (4 đoạn, người dùng trả lời "Ổn")

| Đề xuất | Chọn | Bỏ / lý do |
|---|---|---|
| Image Postgres có pgvector ở cả 3 compose + CI; sửa compose prod cần đồng ý riêng | Chọn | Image hiện tại `postgres:18.4-alpine` không có pgvector; tag cho PG18 chưa xác minh |
| Embedding qua queue BullMQ riêng + script backfill | Chọn | Được thử lại 3 lần như các queue khác |
| Không index HNSW | Chọn | Quy mô vài chục CV, quét tuần tự đủ |
| `matchedSkills`/`missingSkills` do code tính; LLM vẫn chấm 3 điểm con; điểm tổng giữ công thức hiện tại | Chọn | Hệ quả của D1 |
| Đổi `CV_SCREENING_PROMPT` (thêm `<skill_match>`, `<anchors>`) | Chọn | Ràng buộc "không đổi prompt" chỉ áp cho phần 0 |
| `ragMode` + id mốc lưu trên `CVScreening`; chế độ truyền theo từng lần gọi | Chọn | Để giải thích kết quả và để script đo chạy 3 chế độ |
| τ chốt bằng probe; k mặc định 3 | Chọn | k = 3 là ASSUMPTION, chốt lại sau đo |
| Quyền duyệt = quyền xem kết quả chấm (`assertCanAccessJob`) | Chọn (Claude tự chọn theo lệ SP1, người dùng không đổi) | — |
| Xác nhận không bắt buộc ghi chú; sửa điểm bắt buộc ghi chú | Chọn | — |
| Không đổi `Application.status`, `aiRecommendation` khi duyệt | Chọn | ADR 0002 |
| Chấm lại xoá bản duyệt; chỉ lưu lần duyệt cuối | Chọn | Bản duyệt gắn với bộ điểm AI cũ; lịch sử là YAGNI |
| Điểm hiệu lực hiển thị ở Kanban, so sánh (SP1), CSV (SP2, thêm cột điểm AI gốc); ứng viên thấy điểm hiệu lực, không thấy ghi chú/người duyệt | Chọn (phần ứng viên do Claude tự chọn, người dùng không đổi) | — |
| `InterviewQuestion` xoá mềm; `InterviewQnA.source` + `bankQuestionId` | Chọn | Phiên cũ vẫn trỏ tới câu |
| Seed ~135 câu (3 topic × 3 mức × ≥15), AI soạn nháp, người dùng duyệt | Chọn | Rủi ro công sức nội dung |
| Script đo: 10 cặp trên 2 tin, mỗi tin ≥ k mốc seed, 5 lần × 3 chế độ | Chọn | Chỉ chạy khi người dùng cho phép |
| E2E chỉ phủ luồng duyệt điểm với dữ liệu seed; luồng AI thật kiểm tay + script đo | Chọn | Test stack không có AI thật |
| Thứ tự: tuần 2 = phần 1 ‖ 3b ‖ soạn seed; tuần 3 = phần 2 → 3a ‖ phần 4; tuần 4 = đo + nghiệm thu | Chọn | Đổi so với D4 của phần 0: 3b lên sớm vì không cần vector |
| Một spec chung cho phần 1–4, mỗi phần một plan, chạy trong worktree riêng | Chọn | Bốn phần dùng chung schema và luồng |
