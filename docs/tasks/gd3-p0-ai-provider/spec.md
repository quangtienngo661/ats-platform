# Spec — GĐ3 phần 0: lớp nhà cung cấp AI (Gemini hoặc OpenAI) và client embedding

**Ngày:** 2026-10-15 · **Trạng thái:** đã duyệt 2026-10-30 ·
**Nguồn:** đề cương ĐA2 mục "Nâng cấp AI bằng RAG" (GĐ3, 26/10–22/11/2026) và các quyết định ở [decision.md](decision.md).
**Nhánh:** `feat/gd3-p0-ai-provider` (worktree `E:\wt\ats-gd3-p0`, cắt từ `dev` `9627518`).

## Mục tiêu

Hệ thống sinh văn bản bằng AI được **qua một lớp chung**, chọn Gemini hoặc OpenAI bằng một biến môi trường, mà 7 luồng AI
đang có (bóc tách CV, bóc tách JD, chấm CV, 4 bước phỏng vấn thử) nhận đúng dữ liệu như hôm nay. Thêm client
**embedding** OpenAI `text-embedding-3-small` làm nền cho các phần RAG sau. Lý do: key Gemini đang hết tiền
(`RESOURCE_EXHAUSTED`, brain §5) nên mọi luồng AI thật đang lỗi; người dùng đã nạp tiền tài khoản OpenAI.

## Vị trí trong GĐ3

| # | Phần | Phụ thuộc |
|---|---|---|
| **0** | **Lớp nhà cung cấp AI + client embedding (spec này)** | — |
| 1 | Hạ tầng vector: PostgreSQL có pgvector (dev, test, prod, CI), bảng vector, tìm top-K | 0 |
| 2 | Kỹ năng: chuẩn hoá vào `CandidateSkill`, sửa B-01, khớp theo nghĩa | 1 |
| 3 | Chấm CV bằng RAG + người duyệt từng điểm | 1, nên có 2 |
| 4 | Ngân hàng câu hỏi phỏng vấn | 1 |

## Ngoài phạm vi phần 0

Không đổi prompt, không đổi cấu trúc JSON trả về, không đổi hàng đợi BullMQ. Không lưu vector, không pgvector (phần 1).
Không chọn nhà cung cấp theo tổ chức hay theo tác vụ. Không thêm `organizationId` vào `AiUsageLog` (cần cho "chi phí AI theo
tổ chức" ở GĐ4). Embedding không có công tắc: cố định một model.

## Quy tắc

| # | Quy tắc |
|---|---|
| R1 | `AI_PROVIDER` ∈ {`gemini`, `openai`}, mặc định `gemini`. Cả hệ thống dùng một nhà cung cấp sinh văn bản; đổi bằng `.env` và khởi động lại API. |
| R2 | 7 hàm của `LlmService` giữ đúng tên và đầu vào `(refId, content)` của `GeminiService` hôm nay và trả về **object JSON đã parse** như hôm nay. Không còn tham số `model` (không nơi nào truyền). |
| R3 | Mỗi hàm có một loại model và một mức suy luận cố định (bảng "Ánh xạ"), lấy đúng từ code hiện tại. |
| R4 | Khi `AI_PROVIDER=openai`: loại `pro` dùng `OPENAI_MODEL_PRO` (mặc định `gpt-6.1-sol`), loại `flash` dùng `OPENAI_MODEL_FLASH` (mặc định `gpt-6-luna`). Khi `gemini`: `pro` = `gemini-3.1-pro-preview`, `flash` = `gemini-3.5-flash` (giá trị `GeminiModel` hiện tại). |
| R5 | Embedding luôn là OpenAI `text-embedding-3-small`, 1536 chiều, bất kể `AI_PROVIDER`. Tên model là hằng số trong code. |
| R6 | Khởi động chỉ đòi key của nhà cung cấp sinh văn bản đang chọn: `gemini` → `GOOGLE_API_KEY` bắt buộc; `openai` → `OPENAI_API_KEY` bắt buộc. Với `gemini`, thiếu `OPENAI_API_KEY` vẫn khởi động; một lời gọi embedding khi đó báo lỗi rõ ràng. |
| R7 | Mỗi lời gọi (thành công hay thất bại) ghi một dòng `AiUsageLog` với tên model thật đã dùng. Token ra = phần trả lời **cộng** phần suy luận/thinking (phần bị tính tiền), ở cả hai nhà cung cấp. |
| R8 | Embedding ghi `AiUsageLog` với `actionType = embedding` (giá trị enum mới), một dòng cho mỗi lô, token ra = 0. |
| R9 | Quá 120 giây thì huỷ lời gọi. Kết quả không parse được JSON tính là lời gọi thất bại. Lỗi được ghi log rồi ném tiếp để BullMQ thử lại (3 lần theo `forRoot`). Client OpenAI tạo với `maxRetries: 0`: BullMQ là lớp thử lại duy nhất. |
| R10 | Ghi log là "bắn rồi quên" như hôm nay (`void this.aiUsageLogsService.create(...)`): log hỏng không làm lời gọi AI hỏng. |

## Thiết kế

### Thành phần

```
common/external-apis/llm/
  llm.service.ts         LlmService — 7 hàm (R2), mỗi hàm dựng LlmRequest rồi gọi client đang chọn
  llm.types.ts           LlmRequest { refId, actionType, tier: 'pro'|'flash', reasoning: 'medium'|'high',
                                      systemPrompt, content }
                         LlmResult  { data: unknown, model: string, promptTokens: number, outputTokens: number }
                         interface LlmClient { generateJson(req: LlmRequest): Promise<LlmResult> }
  gemini.client.ts       GeminiClient — @google/genai như GeminiService hôm nay (JSON mode + thinkingLevel)
  openai.client.ts       OpenAiClient — gói `openai`, Responses API, text.format = json_object, mức suy luận
  llm.module.ts          chọn client theo AI_PROVIDER (factory provider), export LlmService
common/external-apis/embedding/
  embedding.service.ts   EmbeddingService.embed(refId, texts: string[]) → Promise<number[][]>
  embedding.module.ts
```

`LlmService` giữ việc chung: đo thời gian, huỷ sau 120 giây (AbortController như hôm nay), parse JSON, ghi `AiUsageLog`,
ném lỗi. Client chỉ biết dựng request và đọc token của nhà cung cấp mình. Prompt hệ thống lấy từ
`common/constants/gemini-api.ts` như hôm nay (không đổi nội dung). `parseJD` vẫn bọc nội dung trong `<jd_text>…</jd_text>`.
Thư mục `common/external-apis/gemini/` và `GeminiModel` bị gỡ; giá trị model Gemini chuyển vào `gemini.client.ts`.

### Ánh xạ (lấy từ `gemini.service.ts` và `common/configs/gemini.config.ts` hôm nay)

| Hàm | Loại | Mức suy luận | `AiActionType` |
|---|---|---|---|
| `parseCV` | flash | medium | `cv_parsing` |
| `parseJD` | flash | medium | `job_parsing` |
| `screeningCV` | pro | high | `cv_scoring` |
| `generateInterviewQuestions` | pro | high | `mock_interview` |
| `checkInterviewFollowup` | flash | high | `mock_interview` |
| `evaluateInterviewAnswer` | flash | high | `mock_interview` |
| `generateInterviewResult` | pro | high | `mock_interview` |

Gemini: `medium`/`high` → `ThinkingLevel.MEDIUM`/`HIGH`, `responseMimeType: application/json`, `systemInstruction`.
OpenAI (Responses API): `model` theo R4, `instructions` = prompt hệ thống, `input` = nội dung, `text.format = { type: 'json_object' }`,
mức suy luận `medium`/`high` (tên tham số chốt bằng probe, xem "Chưa xác minh").

### Cấu hình

- `env.validation.ts`: thêm `AI_PROVIDER` (`@IsOptional @IsIn(['gemini','openai'])`); `GOOGLE_API_KEY` chỉ bắt buộc khi
  provider là `gemini` (`@ValidateIf`); `OPENAI_API_KEY` bắt buộc khi `openai`, tuỳ chọn khi `gemini`; `OPENAI_MODEL_PRO`,
  `OPENAI_MODEL_FLASH` tuỳ chọn.
- `.env.example`: thêm `AI_PROVIDER=gemini`, `OPENAI_API_KEY=`, `OPENAI_MODEL_PRO=gpt-6.1-sol`, `OPENAI_MODEL_FLASH=gpt-6-luna`.
- `docker-compose.yml` (prod) và `docker-compose-dev.yml`: truyền `AI_PROVIDER`, `OPENAI_API_KEY`, hai biến model giống cách
  đang truyền `GOOGLE_API_KEY`. `docker-compose.test.yml`: thêm `OPENAI_API_KEY: local-verification-no-external-ai`, giữ
  `AI_PROVIDER` mặc định.

### Dữ liệu

Một migration nhỏ chỉ cộng thêm: `ALTER TYPE "ai_action_type" ADD VALUE 'embedding'`, tên dự kiến
`20261016000000_add_embedding_ai_action_type`. Cập nhật `schema.prisma` (enum `AiActionType`) và chép tay sang
`libs/shared/types/src/lib/enums.ts` (brain §5: đồng bộ thủ công trong cùng commit). Không bảng mới.

### Web

Thêm `embedding` vào: `apps/web/src/types/interfaces/ai-usage-log.interface.ts` (kiểu `actionType`),
`components/ai-usage-logs/ui/AiUsageLogsFilter.tsx` (tuỳ chọn lọc) và `AiUsageLogsTable.tsx` (nhãn, icon, màu) — nhãn
"Embedding" theo kiểu các nhãn tiếng Anh đang có ("CV Parsing", "Job Parsing").

## Tiêu chí chấp nhận

| # | Tiêu chí | Cấp kiểm |
|---|---|---|
| C1 | `AI_PROVIDER` không đặt hoặc `gemini` → mọi hàm đi qua `GeminiClient`; `openai` → qua `OpenAiClient` | API unit |
| C2 | Mỗi hàm trong 7 hàm gửi đúng prompt hệ thống, loại model, mức suy luận và `actionType` của bảng "Ánh xạ" | API unit (bảng) |
| C3 | `GeminiClient`: model đúng theo loại; thinking đúng theo mức; token ra = `candidatesTokenCount + thoughtsTokenCount` | API unit |
| C4 | `OpenAiClient`: request có model theo R4, `instructions`, `input`, `json_object`, mức suy luận; client tạo với `maxRetries: 0`; token vào/ra đọc đúng trường usage | API unit |
| C5 | JSON không parse được → một dòng log `failed`, hàm ném lỗi; lời gọi quá 120 giây bị huỷ, ghi `failed`, ném lỗi | API unit (cả hai client) |
| C6 | `EmbeddingService.embed` gọi `text-embedding-3-small`, trả vector đúng thứ tự đầu vào, ghi một dòng log `embedding`; thiếu `OPENAI_API_KEY` → lỗi tiếng Anh nêu rõ biến thiếu | API unit |
| C7 | Env: `gemini` thiếu `GOOGLE_API_KEY` → không khởi động; `openai` thiếu `OPENAI_API_KEY` → không khởi động; `gemini` không có `OPENAI_API_KEY` → khởi động; `AI_PROVIDER=abc` → không khởi động | API unit (`env.validation`) |
| C8 | 9 file đang dùng `GeminiService` (2 module, 7 service/processor) đổi sang `LlmService`; test của chúng chỉ đổi mock, không đổi assert; jest API toàn bộ xanh | API unit |
| C9 | Migration `embedding` áp được trên PostgreSQL thật; enum có đúng 5 giá trị | probe DB dùng một lần |
| C10 | Trang nhật ký AI lọc và hiển thị được loại `embedding` | Web unit |
| C11 | Lời gọi thật (được người dùng cho phép): JSON mode chạy trên `gpt-6-luna` và `gpt-6.1-sol`; tham số mức suy luận được chấp nhận; tên trường token khớp code; embedding trả 1536 chiều và "ReactJS" gần "React.js" hơn "PostgreSQL" | probe API thật |
| C12 | Với `AI_PROVIDER=openai` trên môi trường dev có key thật: tải CV → bóc tách → chấm → một lượt phỏng vấn thử, JSON đúng cấu trúc hôm nay | kiểm tay (người dùng cho phép, tốn tiền) |

### Edge case

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| E1 | OpenAI trả JSON hợp lệ nhưng có thêm/thiếu trường so với prompt | Như hôm nay với Gemini: luồng gọi tự kiểm dữ liệu; lớp chung không kiểm cấu trúc |
| E2 | OpenAI trả lỗi 429/5xx | Một dòng log `failed`, ném lỗi, BullMQ thử lại (không có lần thử lại trong SDK) |
| E3 | `embed([])` | Trả `[]`, không gọi API, không ghi log |
| E4 | `parseJD` (gọi đồng bộ trong request HTTP, không qua BullMQ) bị lỗi | Ném lỗi như hôm nay (controller trả lỗi), không thử lại |

## Kiểm thử và quy trình

- Unit: mock gói `@google/genai` và `openai`; không gọi mạng. Mock factory dùng chung trong `test-utils/unit-test-helpers.ts`
  nếu cần (brain §10).
- Probe DB (C9): PostgreSQL dùng một lần như SP1/SP3 (cổng riêng, `docker run --rm`), không đụng test stack.
- Probe API thật (C11): script trong `results/`, chạy khi người dùng cho phép; người dùng tự đặt `OPENAI_API_KEY` vào `.env`;
  không in key; chi phí dự kiến dưới 0,01 USD.
- Kiểm toàn bộ: jest API, `nx lint api`, `nx build api` (`--skip-nx-cache`), `test:web`, `typecheck:web`, `lint:web`, E2E.
- Không commit, push, merge khi chưa được người dùng duyệt (quy tắc git của người dùng).

## Chưa xác minh (kiểm khi lập plan hoặc bằng probe C11)

- Tên tham số mức suy luận trong Responses API và giá trị hợp lệ cho `gpt-6-*` (trang structured-outputs không nêu).
- JSON mode có chạy trên `gpt-6-*` không (trang chỉ nêu "compatible GPT-5 models"), và có đòi chữ "JSON" trong prompt không.
- Tên trường token của Responses API và trường token suy luận; trường `thoughtsTokenCount` của Gemini.
- Giá trị mặc định retry/timeout của gói `openai` (thiết kế đặt `maxRetries: 0` và tự huỷ 120 giây nên không phụ thuộc mặc định).
- Chất lượng `text-embedding-3-small` với tiếng Việt (tài liệu OpenAI không nói; đo ở probe C11 và ở phần 2).
- Prompt hiện viết cho Gemini; chất lượng trả lời của OpenAI với cùng prompt chỉ thấy ở C12.

## File dự định sửa

API: tạo `common/external-apis/llm/*`, `common/external-apis/embedding/*`; gỡ `common/external-apis/gemini/*`
(`gemini.module.ts`, `gemini.service.ts`, `gemini.service.spec.ts` → chuyển test sang client mới) và
`common/types/enums/gemini-model.enum.ts`; sửa `common/configs/env.validation.ts`, `common/configs/gemini.config.ts`
(đổi thành cấu hình theo tác vụ, không còn kiểu của `@google/genai`), 9 file đang dùng `GeminiService`
(`cv-screenings.module.ts`, `cv-screenings.processor.ts`, `cvs.module.ts`, `cv-parsing.processor.ts`,
`interview-generation.processor.ts`, `interview-session.service.ts`, `interview.processor.ts`, `job-postings.module.ts`,
`job-postings.service.ts`) cùng spec của chúng.
DB: `schema.prisma`, migration mới, `libs/shared/types/src/lib/enums.ts`.
Web: 3 file ở mục "Web". Hạ tầng: `.env.example`, 3 file compose. Tài liệu: `CLAUDE.md` mục Tech Stack (dòng "always through
`GeminiService`") → `LlmService`; brain §10 dòng "Gemini — only via `GeminiService`" (file ngoài repo, `~/.claude/knowledge-base/`)
cập nhật khi phần 0 vào `dev`. Phụ thuộc mới: gói `openai`.
