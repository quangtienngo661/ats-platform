# Decision record — GĐ3 phần 0: lớp nhà cung cấp AI và client embedding

**Ngày:** 2026-10-15 · Các quyết định do người dùng chọn qua câu hỏi trong chat cùng ngày (brainstorm GĐ3) · Spec:
[spec.md](spec.md). Các phương án dưới đây là đúng những gì đã trình bày trong chat; không thêm phương án mới.

## Tóm tắt

| # | Quyết định | Phương án chọn | Ai chốt |
|---|---|---|---|
| D1 | Nguồn embedding / AI chạy thật khi demo | Embedding qua OpenAI (người dùng đã nạp tiền OpenAI) | Người dùng (trả lời tự do) |
| D2 | Sinh văn bản (7 luồng) dùng gì trong GĐ3 | Thêm công tắc chọn nhà cung cấp | Người dùng |
| D3 | Công tắc có áp cho embedding không | Cố định OpenAI `text-embedding-3-small` | Người dùng |
| D4 | Cách chia và thứ tự GĐ3 | 5 phần, làm 0 → 1 → 2 → 3, phần 4 sau 1 | Người dùng |
| D5 | Công tắc nằm ở đâu | Biến môi trường toàn hệ thống `AI_PROVIDER` | Người dùng |
| D6 | Tổ chức lớp sinh văn bản | `LlmService` mới + `GeminiClient` + `OpenAiClient` | Người dùng |
| D7 | Ánh xạ model OpenAI | Pro → `gpt-6.1-sol`, Flash → `gpt-6-luna` | Người dùng |

## D1 — AI có chạy thật khi demo, và embedding lấy từ đâu

Bối cảnh: key Gemini hết tiền (`RESOURCE_EXHAUSTED`), mọi luồng AI thật đang lỗi; kế hoạch ban đầu (roadmap Phase 2) dùng
embedding của Google qua cùng key.

| Phương án | Trade-off | |
|---|---|---|
| Nạp tiền Gemini, dùng embedding của Google | Một nhà cung cấp, một key, ít hạ tầng; tốn phí theo lượt | |
| Embedding chạy local, LLM vẫn Gemini | Không tốn tiền, không phụ thuộc key cho embedding; chấm CV vẫn cần Gemini; thêm tải model và bộ nhớ cho API | |
| Chưa nạp, làm với mock trước | Không tốn tiền ngay; chưa chứng minh được "nhất quán" bằng số liệu thật | |
| *(người dùng trả lời tự do)* Dùng embedding của OpenAI, đã nạp tiền tài khoản OpenAI | Embedding chạy thật với số tiền sẵn có; phần sinh văn bản vẫn cần quyết riêng (D2) | ✅ |

Đã đọc tài liệu OpenAI (developers.openai.com/api/docs/guides/embeddings, 2026-10-15): `text-embedding-3-small` 1536 chiều,
`text-embedding-3-large` 3072 chiều, cả hai rút ngắn được bằng `dimensions`, tối đa 8192 token; tài liệu không nói về tiếng Việt.

## D2 — Phần sinh văn bản dùng gì

Bối cảnh: chấm CV, bóc tách CV/JD và phỏng vấn thử đều sinh văn bản bằng Gemini; embedding OpenAI không giải quyết việc key
Gemini hết tiền.

| Phương án | Trade-off | |
|---|---|---|
| Giữ Gemini, nạp tiền trước demo | Không đụng 7 luồng AI; hai nhà cung cấp, hai key; phải nạp tiền Gemini mới demo chấm thật | |
| Chuyển luôn sang OpenAI | Một key, demo chạy ngay; việc riêng khá lớn, ngoài phạm vi GĐ3 theo đề cương, rủi ro làm hỏng luồng đang chạy | |
| Thêm công tắc chọn nhà cung cấp | Linh hoạt nhất; tốn công nhất (viết và test cả hai bên), dễ thành làm thừa | ✅ |

Hệ quả: thêm phần 0 vào GĐ3 (spec này), làm trước mọi phần RAG.

## D3 — Công tắc có áp cho embedding không

| Phương án | Trade-off | |
|---|---|---|
| Cố định OpenAI `text-embedding-3-small` | Vector của hai model không so sánh được; cố định một model giữ cột vector đơn giản (1536 chiều, rẻ) | ✅ |
| Cho chọn cả embedding | Linh hoạt; phải lưu tên model theo vector, xử lý số chiều khác nhau, job embed lại, test cả hai đường | |

## D4 — Cách chia và thứ tự GĐ3

Năm phần: 0 lớp nhà cung cấp AI; 1 hạ tầng vector; 2 kỹ năng; 3 chấm CV bằng RAG + người duyệt từng điểm; 4 ngân hàng câu hỏi.

| Phương án | Trade-off | |
|---|---|---|
| Chia 5 phần, làm 0 → 1 → 2 → 3, phần 4 sau 1 | Mọi phần phụ thuộc phần 0; phần 4 chạy song song với 2 và 3 khi phần 1 xong | ✅ |
| Gộp 0 và 1 thành một spec nền tảng | Ít vòng duyệt; diff lớn (7 luồng AI + image DB), khó review và khó lùi | |
| Ưu tiên phần 3 sớm | Đưa trọng tâm đề cương lên trước, làm tối thiểu 0 và 1; phần 2 và 4 sau | |

## D5 — Công tắc nằm ở đâu

| Phương án | Trade-off | |
|---|---|---|
| Biến môi trường toàn hệ thống (`AI_PROVIDER`) | Đơn giản, đủ cho demo, đổi bằng `.env` + khởi động lại, không migration | ✅ |
| Theo từng tổ chức (cấu hình AI) | Linh hoạt; cần cột, migration, giao diện, kiểm quyền; luồng không gắn tổ chức vẫn cần mặc định | |
| Theo từng loại tác vụ | Phối hợp theo chi phí/chất lượng; nhiều biến cấu hình | |

## D6 — Tổ chức lớp sinh văn bản

Bối cảnh: 9 file đang dùng `GeminiService` (chat lúc đó nêu "11 file", tính cả `gemini.module.ts` và `gemini.service.ts`);
`CLAUDE.md` và brain ghi "Gemini chỉ qua `GeminiService`"; gói `openai` chưa có.

| Phương án | Trade-off | |
|---|---|---|
| `LlmService` mới + 2 client | Giữ 7 hàm, đổi import ở các file gọi, cập nhật CLAUDE.md/brain; tên đúng việc, diff vừa | ✅ |
| Giữ tên `GeminiService` | Diff nhỏ nhất; tên sai sự thật khi gọi OpenAI | |
| `LlmService` + giữ `GeminiService` làm tên cũ | Không sửa ngay các file gọi; hai tên cho một việc, dễ quên dọn | |

## D7 — Ánh xạ model OpenAI

Đã đọc tài liệu OpenAI (developers.openai.com/api/docs/models, 2026-10-15): `gpt-6-astra` ($10/$50 mỗi 1M token vào/ra),
`gpt-6.1-sol` ($2/$10), `gpt-6-luna` ($0,10/$0,50), đều qua Responses API và có mức suy luận. Code hiện dùng Gemini Pro cho
chấm CV, sinh câu hỏi, tổng kết; Flash cho bóc tách CV/JD, câu hỏi đào sâu, chấm từng câu.

| Phương án | Trade-off | |
|---|---|---|
| Pro → `gpt-6.1-sol`, Flash → `gpt-6-luna` | Gần bản mạnh nhất với giá 1/5; tác vụ nhanh dùng bản rẻ | ✅ |
| Pro → `gpt-6-astra`, Flash → `gpt-6-luna` | Chấm CV và sinh câu hỏi bằng model mạnh nhất; đắt gấp 5 lần sol | |
| Cả hai → `gpt-6.1-sol` | Một model; bóc tách và chấm từng câu tốn hơn khoảng 20 lần luna | |

Cả hai giá trị đổi được qua `OPENAI_MODEL_PRO` / `OPENAI_MODEL_FLASH`.

## Đề xuất kỹ thuật được duyệt cùng thiết kế (3 đoạn, người dùng trả lời "ổn"/"ok")

| Đề xuất | Chọn | Bỏ / lý do |
|---|---|---|
| Khởi động chỉ đòi key của nhà cung cấp đang chọn | Chọn | Hôm nay `GOOGLE_API_KEY` bắt buộc ở `env.validation.ts` và `getOrThrow` lúc khởi động → chạy openai mà không có key Gemini sẽ sập |
| Token ra = trả lời + suy luận/thinking ở cả hai nhà cung cấp | Chọn (đổi cách đếm của Gemini) | Hôm nay Gemini chỉ ghi `candidatesTokenCount`, bỏ thinking dù bị tính tiền → dashboard chi phí GĐ4 sẽ thấp hơn thực tế |
| Thêm `embedding` vào `AiActionType` (migration nhỏ) | Chọn | Để chi phí embedding cũng hiện ở nhật ký AI |
| `maxRetries: 0` cho client OpenAI, BullMQ là lớp thử lại duy nhất | Chọn | Tránh một lỗi thành 9 lần gọi và tính tiền |
| Giữ huỷ 120 giây, JSON hỏng = thất bại, log "bắn rồi quên" | Chọn | Giữ hành vi hiện tại |
| Lời gọi thử thật (< 0,01 USD) và kiểm cả luồng với openai, đều chờ người dùng cho phép | Chọn | Khép các điểm "chưa kiểm" về tham số và tên trường của OpenAI |
| Không thêm `organizationId` vào `AiUsageLog` trong phần 0 | Ghi nhận, để GĐ4 | Ngoài phạm vi phần 0 |
