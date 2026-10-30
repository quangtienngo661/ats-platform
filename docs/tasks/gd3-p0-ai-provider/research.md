# Research — GĐ3 phần 0: OpenAI Responses API

Ngày đọc: 2026-10-30. Gói `openai` cài là **7.45.1** (`npm install openai`, `node_modules/openai/package.json`).
Đánh dấu theo `rules/working-expectations.md`: **documented** = đọc ở nguồn chính thức trong phiên này;
**verified** = chạy/đọc trực tiếp trên bản cài ở đây; **unverified** = chưa kiểm, chờ probe Task 0.8.

| # | Kết luận | Mức | Nguồn |
|---|---|---|---|
| 1 | Tham số mức suy luận của Responses API là `reasoning: { effort }`. Giá trị hợp lệ theo type: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`; "không phải model nào cũng hỗ trợ mọi giá trị". | verified (type SDK 7.45.1: `node_modules/openai/resources/shared.d.ts`, `interface Reasoning`, `type ReasoningEffort`) + documented | https://developers.openai.com/api/docs/guides/reasoning (qua Context7, 2026-10-30) |
| 2 | Usage của Responses API: `usage.input_tokens`, `usage.output_tokens`, `usage.output_tokens_details.reasoning_tokens`. | verified (type `ResponseUsage` trong `resources/responses/responses.d.ts`) | như trên |
| 3 | `output_tokens` **đã gồm** `reasoning_tokens` (token suy luận là tập con). Ví dụ trong tài liệu: `input_tokens 75`, `output_tokens 1186`, `reasoning_tokens 1024`, `total_tokens 1261` = 75 + 1186. Vì vậy `outputTokens` của `OpenAiClient` = `usage.output_tokens`, **không cộng** `reasoning_tokens` (cộng sẽ tính đôi). | documented (suy từ số học của ví dụ chính thức) | https://developers.openai.com/api/docs/guides/reasoning |
| 4 | JSON mode: `text: { format: { type: 'json_object' } }`. Model không sinh JSON nếu không có system/user message yêu cầu JSON. | verified (comment của `ResponseFormatJSONObject` trong `shared.d.ts`) | SDK 7.45.1 |
| 5 | `instructions?: string \| null` có trong tham số tạo response; chuỗi trả lời có sẵn ở `response.output_text`. | verified (`responses.d.ts`) | SDK 7.45.1 |
| 6 | `AbortSignal` truyền qua tuỳ chọn request (đối số thứ hai) `{ signal }`; `maxRetries` là tuỳ chọn của constructor (mặc định SDK = 2, ta đặt 0). | verified (`internal/request-options.d.ts`, `client.d.ts`) | SDK 7.45.1 |
| 7 | `gpt-6.1-sol` / `gpt-6-luna` chấp nhận `effort` `medium`/`high` và `json_object`. Tài liệu chỉ ví dụ model `gpt-6-astra`; hai tên trong spec chưa thấy ở nguồn nào đọc hôm nay. | **unverified** | probe C11 (Task 0.8) |
