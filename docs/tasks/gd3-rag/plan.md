# GĐ3 — Nâng cấp AI bằng RAG (phần 0–4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chấm CV và phỏng vấn thử bằng AI chạy thật qua Gemini hoặc OpenAI, nhất quán hơn giữa các lần chạy nhờ RAG, có người duyệt trên từng kết quả chấm và có số liệu đo được.

**Architecture:** Phần 0 thay `GeminiService` bằng `LlmService` + hai client và thêm `EmbeddingService` (OpenAI, 1536 chiều). Phần 1 thêm pgvector, cột vector trên từng bảng, một queue embedding và `VectorSearchService` gom raw SQL. Phần 2/3a đưa danh sách kỹ năng khớp (tính bằng code) và các lần chấm đã duyệt của cùng tin vào prompt chấm; phần 3b thêm trường duyệt trên `CVScreening`; phần 4 thêm `InterviewQuestion` và truy hồi câu hỏi khi sinh phiên.

**Tech Stack:** NestJS 11, Prisma 7 (`Unsupported("vector(1536)")` + raw SQL), PostgreSQL 18 + pgvector, BullMQ, `@google/genai`, `openai`, Next.js 16 Server Actions, Jest 30, Vitest, Playwright.

**Spec:** phần 0 — `E:\wt\ats-gd3-p0\docs\tasks\gd3-p0-ai-provider\spec.md` (+ `decision.md`, chưa commit, đưa vào nhánh M0 ở Task 0.0); phần 1–4 — [`docs/tasks/gd3-rag/spec.md`](spec.md) (+ [`decision.md`](decision.md)). Mã R*/C*/E* trong plan trỏ tới spec phần 1–4; mã P0-R*/P0-C* trỏ tới spec phần 0.

## Global Constraints

- Chuỗi người dùng thấy (lỗi throw, toast, nhãn) bằng tiếng Việt; log bằng tiếng Anh; `Logger` theo class, không `console.*`.
- Enum Prisma mới chép tay sang `libs/shared/types/src/lib/enums.ts` **trong cùng commit** với `schema.prisma`.
- Không truyền `defaultJobOptions` vào `BullModule.registerQueue()`; mọi queue kế thừa `attempts: 3` + backoff từ `forRoot` (`app.module.ts:53-57`). Processor `catch` phải rethrow.
- Gọi AI chỉ qua `LlmService` / `EmbeddingService` (sau M0); không khởi tạo client SDK ở nơi khác.
- Embedding cố định `text-embedding-3-small`, 1536 chiều (P0-R5). Cột vector: `vector(1536)`.
- AI không bao giờ đổi `Application.status` hay `aiRecommendation` theo điểm hoặc theo duyệt (ADR 0002, R12).
- Web: component không gọi `fetch`/`lib/http.ts`; đi qua `'use server'` trong `src/servers/<domain>/`; mutation gọi `revalidatePath`; dialog dùng `AccessibleDialog`; toast qua `src/lib/toast.ts`; test query theo role và chữ hiển thị.
- Không hand-edit `libs/backend/database/src/generated/prisma`; schema đổi bằng `schema.prisma` + `prisma migrate dev --config libs/backend/database/prisma.config.ts`; sau khi đổi schema chạy `prisma generate --schema=libs/backend/database/prisma/schema.prisma` và `rm -rf dist .nx/cache`.
- Defect fix (B-01, Task 2.2) là **hai commit**: test đỏ trước, fix sau.
- Commit, push, merge theo quy tắc git của người dùng: bước "Commit" trong plan nghĩa là trình đề xuất commit theo 4 bước và chờ duyệt. Sửa `docker-compose.yml` (prod) cần người dùng đồng ý riêng (`CLAUDE.md` §7).
- Lời gọi AI thật (probe, kiểm tay, script đo) chỉ chạy khi người dùng cho phép trong lượt đó; không in key.
- Lệnh test API: `npx nx test api --runInBand --testPathPatterns=<đường dẫn spec>` (Jest 30; nếu Nx báo flag lạ thì dùng `npx nx test api --runInBand -- <đường dẫn>`). Lệnh test web: `npm run test:web -- <đường dẫn>`.

## Review Focus

1. **Embedding trả về sai số chiều hoặc chứa NaN** → không được ghi vào DB (lỗi raw SQL khó đọc). Test ở Task 1.2: `toVectorLiteral` từ chối mảng 1535 phần tử và mảng có `NaN`.
2. **Hồ sơ đang chấm lại tự làm mốc của chính nó** (đã duyệt rồi, chấm lại) → mốc phải loại `applicationId` hiện tại. Test ở Task 3a.1: `nearestAnchorScreenings` nhận `excludeApplicationId` và probe DB xác nhận.
3. **LLM trả về cùng một `bankQuestionId` hai lần** → không được tạo hai câu trùng trong một phiên. Test ở Task 4.2: `reconcileSelection` giữ lần đầu, lần sau đổi thành `generated` không id.
4. **CV không có `skills.technical` (null hoặc chuỗi rỗng)** → chấm vẫn chạy, mọi kỹ năng của tin là thiếu, không gọi embed với mảng rỗng. Test ở Task 2.2.
5. **Duyệt điểm với số thập phân như 72.55** → làm tròn về 1 chữ số như cột `Decimal(5,1)`, điểm tổng tính trên giá trị đã làm tròn. Test ở Task 3b.2.

---

## M0 — Phần 0: lớp nhà cung cấp AI + client embedding

Nhánh `feat/gd3-p0-ai-provider`, worktree `E:\wt\ats-gd3-p0` (cắt từ `dev` `9627518`; **rebase hoặc merge `dev` mới nhất trước khi bắt đầu** — `dev` đã có `5510da1`, `e76876d`). Spec phần 0 là nguồn của mọi giá trị dưới đây.

### Task 0.0: Đưa spec phần 0 vào nhánh và đồng bộ `dev`

**Files:** `docs/tasks/gd3-p0-ai-provider/spec.md`, `decision.md` (đang untracked trong worktree).

- [x] **Step 1:** Đồng bộ nhánh với `dev` (qua `sync_with_base_branch` nếu là worktree của app, ngược lại `git -C E:/wt/ats-gd3-p0 merge dev`). Expected: không xung đột (nhánh chưa có commit riêng).
- [x] **Step 2:** Sửa dòng trạng thái của `spec.md` thành "đã duyệt 2026-10-30".
- [x] **Step 3: Commit** — `docs(tasks): add the gđ3 part 0 spec and decision record`.

### Task 0.1: Kiểu chung và `GeminiClient`

**Files:**
- Create: `apps/api/src/common/external-apis/llm/llm.types.ts`, `gemini.client.ts`, `gemini.client.spec.ts`

**Interfaces:**
- Produces:
  - `type LlmTier = 'pro' | 'flash'`; `type LlmReasoning = 'medium' | 'high'`
  - `interface LlmRequest { refId: string | null; actionType: AiActionType; tier: LlmTier; reasoning: LlmReasoning; systemPrompt: string; content: string; signal: AbortSignal }`
  - `interface LlmResult { text: string; model: string; promptTokens: number; outputTokens: number }`
  - `interface LlmClient { generateJson(req: LlmRequest): Promise<LlmResult> }`; token DI `LLM_CLIENT`
  - `class GeminiClient implements LlmClient` (constructor nhận `ConfigService`, đọc `GOOGLE_API_KEY`)

- [x] **Step 1: Write the failing test** `gemini.client.spec.ts` (mock `@google/genai`):
  - `uses gemini-3.1-pro-preview for pro and gemini-3.5-flash for flash`
  - `maps medium/high to ThinkingLevel.MEDIUM/HIGH and sets responseMimeType application/json and systemInstruction`
  - `outputTokens = candidatesTokenCount + thoughtsTokenCount` — usage `{ promptTokenCount: 120, candidatesTokenCount: 40, thoughtsTokenCount: 15 }` → `{ promptTokens: 120, outputTokens: 55 }`; thiếu `thoughtsTokenCount` → `outputTokens: 40`
- [x] **Step 2:** Run `npx nx test api --runInBand --testPathPatterns=llm/gemini.client` → FAIL (module not found).
- [x] **Step 3:** Implement `GeminiClient.generateJson` bằng `@google/genai` như `gemini.service.ts` hôm nay; trả `text` thô (parse ở `LlmService`).
- [x] **Step 4:** Run lại → PASS.
- [x] **Step 5: Commit** — `feat(api): add the shared llm types and the gemini client`.

### Task 0.2: `OpenAiClient`

**Files:** Create `apps/api/src/common/external-apis/llm/openai.client.ts`, `openai.client.spec.ts`; Modify `package.json` (thêm `openai`).

**Interfaces:** Produces `class OpenAiClient implements LlmClient` (đọc `OPENAI_API_KEY`, `OPENAI_MODEL_PRO` mặc định `gpt-6.1-sol`, `OPENAI_MODEL_FLASH` mặc định `gpt-6-luna`).

- [x] **Step 1:** `npm install openai` (ghi version vào commit message body).
- [x] **Step 2: Write the failing test** (mock gói `openai`):
  - `creates the client with maxRetries 0`
  - `sends model per tier, instructions = systemPrompt, input = content, text.format json_object, reasoning effort = req.reasoning, signal`
  - `model env overrides`: `OPENAI_MODEL_PRO=x` → model `x`
  - `reads input/output tokens from usage, output includes reasoning tokens` (tên trường theo tài liệu Responses API đọc ở Step 3; giá trị test: input 200, output 60 → `{ promptTokens: 200, outputTokens: 60 }`)
- [x] **Step 3:** Đọc tài liệu chính thức `openai` Node SDK (context7 hoặc developers.openai.com) cho: tên tham số mức suy luận trong Responses API, tên trường usage và trường token suy luận. Ghi URL + ngày vào `docs/tasks/gd3-p0-ai-provider/research.md` (documented). Sửa assert Step 2 nếu tên khác.
- [x] **Step 4:** Run `--testPathPatterns=llm/openai.client` → FAIL; implement; run → PASS.
- [x] **Step 5: Commit** — `feat(api): add the openai client behind the llm interface`.

### Task 0.3: `LlmService` + `LlmModule`

**Files:** Create `apps/api/src/common/external-apis/llm/llm.service.ts`, `llm.module.ts`, `llm.service.spec.ts`; Modify `apps/api/src/common/configs/gemini.config.ts` (giữ tên file như spec phần 0; nội dung đổi thành bảng ánh xạ hàm → tier/reasoning/actionType/prompt, không còn kiểu của `@google/genai`).

**Interfaces:**
- Consumes: `LlmClient`, `LLM_CLIENT` (Task 0.1), `AiUsageLogsService.create`.
- Produces: `LlmService` với 7 hàm, mỗi hàm `(refId: string | null, content: string) => Promise<any>` trả object JSON đã parse: `parseCV`, `parseJD`, `screeningCV`, `generateInterviewQuestions`, `checkInterviewFollowup`, `evaluateInterviewAnswer`, `generateInterviewResult`. `LlmModule` export `LlmService`; provider `LLM_CLIENT` là factory theo `AI_PROVIDER` (`gemini` mặc định → `GeminiClient`, `openai` → `OpenAiClient`).

- [x] **Step 1: Write the failing test** `llm.service.spec.ts`:
  - `C2 mapping table` (test.each 7 dòng của bảng "Ánh xạ" phần 0: `parseCV` flash/medium/`cv_parsing`, `parseJD` flash/medium/`job_parsing`, `screeningCV` pro/high/`cv_scoring`, `generateInterviewQuestions` pro/high/`mock_interview`, `checkInterviewFollowup` flash/high/`mock_interview`, `evaluateInterviewAnswer` flash/high/`mock_interview`, `generateInterviewResult` pro/high/`mock_interview`) — assert systemPrompt đúng hằng số, `parseJD` bọc `<jd_text>…</jd_text>`
  - `C5 unparseable JSON` → ném lỗi, `aiUsageLogsService.create` gọi một lần với `status: 'failed'`
  - `C5 timeout`: dùng fake timers, client không trả lời 120 000 ms → abort, log `failed`, ném lỗi
  - `success logs model, promptTokens, completionTokens = outputTokens, status success`
  - `log failure does not fail the call` (create reject → hàm vẫn trả kết quả)
  - `C1 factory`: `AI_PROVIDER` không đặt → `GeminiClient`; `openai` → `OpenAiClient`
- [x] **Step 2:** Run → FAIL. **Step 3:** Implement (AbortController 120 s, `JSON.parse`, ghi log fire-and-forget như P0-R10). **Step 4:** Run → PASS.
- [x] **Step 5: Commit** — `feat(api): route every ai generation through llmservice`.

### Task 0.4: Cấu hình môi trường

**Files:** Modify `apps/api/src/common/configs/env.validation.ts` (+ spec cạnh nó, tạo nếu chưa có), `.env.example`, `docker-compose-dev.yml`, `docker-compose.test.yml`, `docker-compose.yml` (**hỏi người dùng trước**).

- [x] **Step 1: Write the failing test** (P0-C7): `gemini without GOOGLE_API_KEY fails`; `openai without OPENAI_API_KEY fails`; `gemini without OPENAI_API_KEY passes`; `AI_PROVIDER=abc fails`; `OPENAI_MODEL_PRO optional`.
- [x] **Step 2:** Run → FAIL. **Step 3:** `AI_PROVIDER @IsOptional @IsIn(['gemini','openai'])`; `GOOGLE_API_KEY` `@ValidateIf(provider !== 'openai')`; `OPENAI_API_KEY` `@ValidateIf(provider === 'openai')`; compose truyền `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL_PRO`, `OPENAI_MODEL_FLASH`; test compose thêm `OPENAI_API_KEY: local-verification-no-external-ai`. **Step 4:** Run → PASS.
- [x] **Step 5: Commit** — `feat(config): choose the ai provider through ai_provider`. (Trừ `docker-compose.yml` prod: chưa sửa, chờ người dùng đồng ý riêng.)

### Task 0.5: Đổi 9 nơi gọi sang `LlmService`, gỡ `GeminiService`

**Files:** Modify `cv-screenings.module.ts`, `cv-screenings.processor.ts`, `cvs.module.ts`, `cv-parsing.processor.ts`, `interview-generation.processor.ts`, `interview-session.service.ts`, `interview.processor.ts`, `job-postings.module.ts`, `job-postings.service.ts` và spec của chúng; Delete `common/external-apis/gemini/*`, `common/types/enums/gemini-model.enum.ts`; Modify `CLAUDE.md` mục Tech Stack ("always through `GeminiService`" → `LlmService`).

- [x] **Step 1:** Đổi mock trong các spec từ `GeminiService` sang `LlmService` — **không đổi assert** (P0-C8). Run `npx nx test api --runInBand` → FAIL (import chưa đổi).
- [x] **Step 2:** Đổi import/inject, xoá thư mục gemini. Run `npx nx test api --runInBand` → PASS toàn bộ; `npx tsc --build apps/api/tsconfig.app.json` → 0 lỗi; `grep -rn GeminiService apps/api/src` → không còn kết quả.
- [x] **Step 3: Commit** — `refactor(api): replace geminiservice with llmservice at every call site`.

### Task 0.6: `EmbeddingService` + enum `embedding`

**Files:** Create `apps/api/src/common/external-apis/embedding/embedding.service.ts`, `embedding.module.ts`, `embedding.service.spec.ts`; Modify `schema.prisma` (`AiActionType` thêm `embedding`), migration `20261101000000_add_embedding_ai_action_type`, `libs/shared/types/src/lib/enums.ts`.

**Interfaces:** Produces `EmbeddingService.embed(refId: string | null, texts: string[]): Promise<number[][]>`; hằng `EMBEDDING_MODEL = 'text-embedding-3-small'`, `EMBEDDING_DIMENSIONS = 1536`.

- [x] **Step 1: Write the failing test** (P0-C6, P0-E3): `embed([]) returns [] without calling the API or logging`; `returns vectors in input order` (API trả `data` lệch thứ tự theo `index` → kết quả theo thứ tự đầu vào); `logs one embedding row per batch, completionTokens 0`; `missing OPENAI_API_KEY throws an English error naming OPENAI_API_KEY`.
- [x] **Step 2:** Run → FAIL. **Step 3:** Implement (client `openai` `maxRetries: 0`). Migration chỉ `ALTER TYPE "ai_action_type" ADD VALUE 'embedding'`. **Step 4:** Run → PASS.
- [x] **Step 5:** Probe DB dùng một lần (P0-C9): `docker run --rm` Postgres cổng riêng, `prisma migrate deploy`, `SELECT unnest(enum_range(NULL::ai_action_type))` → đúng 5 giá trị. Lưu output vào `docs/tasks/gd3-p0-ai-provider/results/`.
- [x] **Step 6: Commit** — `feat(api): add the openai embedding service`.

### Task 0.7: Web — nhật ký AI hiển thị `embedding`

**Files:** Modify `apps/web/src/types/interfaces/ai-usage-log.interface.ts`, `apps/web/src/components/ai-usage-logs/ui/AiUsageLogsFilter.tsx`, `AiUsageLogsTable.tsx` (+ test cạnh chúng).

- [x] **Step 1: Write the failing test** (P0-C10): `filter offers the "Embedding" option`; `table renders an embedding row with the label "Embedding"`.
- [x] **Step 2:** Run `npm run test:web -- src/components/ai-usage-logs` → FAIL. **Step 3:** Implement. **Step 4:** PASS; `npm run typecheck:web`, `npm run lint:web` sạch.
- [ ] **Step 5: Commit** — `feat(web): show embedding calls in the ai usage log`.

### Task 0.8: Probe API thật và kiểm tay (cần người dùng cho phép)

- [ ] **Step 1:** Script `docs/tasks/gd3-p0-ai-provider/results/probe-openai.mjs` (P0-C11): một lời gọi JSON mode trên `gpt-6-luna` và `gpt-6.1-sol` với tham số suy luận; in tên trường usage; embed `["ReactJS","React.js","PostgreSQL","lập trình hướng đối tượng","OOP"]` → in số chiều (1536) và ma trận cosine. Không in key. Lưu output.
- [ ] **Step 2:** Nếu tên tham số/trường khác Task 0.2 → sửa client + test, chạy lại test.
- [ ] **Step 3:** Kiểm tay P0-C12 với `AI_PROVIDER=openai` trên dev: tải CV → bóc tách → chấm → một lượt phỏng vấn thử; ghi kết quả vào `docs/tasks/gd3-p0-ai-provider/results/manual-check.md`.
- [ ] **Step 4:** Toàn bộ: `npx nx test api --runInBand`, `npx nx lint api`, `npx nx build api --skip-nx-cache`, `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`. PR M0 vào `dev`.

---

## M1 — Phần 1: hạ tầng vector

Nhánh `feat/gd3-p1-vector-infra`, cắt từ `dev` **sau khi M0 vào `dev`**.

### Task 1.1: Image có pgvector, extension, cột vector

**Files:** Modify `docker-compose-dev.yml`, `docker-compose.test.yml`, `docker-compose.yml` (**hỏi người dùng**), `schema.prisma` (`Skill.embedding`, `CVParsedData.embedding` kiểu `Unsupported("vector(1536)")?`), migration `20261102000000_enable_pgvector_and_embedding_columns`; Create `docs/tasks/gd3-rag/research.md`.

- [ ] **Step 1:** Đọc tài liệu chính thức pgvector (README GitHub `pgvector/pgvector` và Docker Hub `pgvector/pgvector`): có tag cho PostgreSQL 18 không, có bản alpine không; đọc tài liệu Prisma 7 về `Unsupported` trong migrate. Ghi URL, ngày, kết luận vào `research.md` (documented). Nếu không có tag PG18 → **dừng, hỏi người dùng** (đổi major version DB là quyết định riêng).
- [ ] **Step 2:** Đổi image ở compose dev/test; migration: `CREATE EXTENSION IF NOT EXISTS vector;` + `ALTER TABLE skills ADD COLUMN embedding vector(1536);` + tương tự `cv_parsed_data`.
- [ ] **Step 3: Verify** (C1 phần cấu trúc): `docker compose -f docker-compose.test.yml up -d --build --wait`; `docker exec` psql `SELECT extversion FROM pg_extension WHERE extname='vector'` → một dòng; `\d skills` có cột `embedding vector(1536)`. Lưu output `docs/tasks/gd3-rag/results/task-1.1-pgvector.txt`. `npx nx test api --runInBand` vẫn PASS (Prisma client bỏ qua cột Unsupported).
- [ ] **Step 4: Commit** — `build(db): enable pgvector and add embedding columns`.

### Task 1.2: `VectorSearchService`

**Files:** Create `apps/api/src/common/vector/vector-search.service.ts`, `vector.module.ts`, `vector-search.service.spec.ts`, `docs/tasks/gd3-rag/results/probe-vector-search.mjs`.

**Interfaces:**
- Produces:
  - `type EmbeddingTarget = 'skill' | 'cv_parsed_data' | 'interview_question'` (bảng/khoá chính lấy từ một map hằng, không nhận tên bảng từ ngoài)
  - `toVectorLiteral(values: number[]): string` — hàm thuần, ném `Error` khi `length !== 1536` hoặc có giá trị không hữu hạn
  - `VectorSearchService.writeEmbedding(target: EmbeddingTarget, id: string, vector: number[]): Promise<void>`
  - `VectorSearchService.readEmbeddings(target: EmbeddingTarget, ids: string[]): Promise<Map<string, number[]>>` (bỏ qua dòng null)
  - `VectorSearchService.findMissing(target: EmbeddingTarget, limit: number): Promise<string[]>`

- [ ] **Step 1: Write the failing test**: `toVectorLiteral formats 1536 numbers as [a,b,…]`; `rejects 1535 values`; `rejects NaN and Infinity` (Review Focus 1); `writeEmbedding uses $executeRaw with the literal as a parameter, never string-concatenated`; `readEmbeddings([]) returns an empty map without querying`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement bằng `prisma.$executeRaw` / `$queryRaw` tagged template, cast `::vector`, đọc về bằng `embedding::text`. **Step 4:** PASS.
- [ ] **Step 5: Verify** (C1): probe trên Postgres có pgvector dùng một lần — ghi 3 vector biết trước, `readEmbeddings` trả đúng; truy vấn `ORDER BY embedding <=> $1` trả đúng thứ tự. Lưu output vào `results/`.
- [ ] **Step 6: Commit** — `feat(api): add the vector search service over raw sql`.

### Task 1.3: Queue embedding

**Files:** Create `apps/api/src/common/vector/embedding-queue.service.ts`, `processors/embedding.processor.ts`, `embedding-text.ts` + spec; Modify `vector.module.ts` (`BullModule.registerQueue({ name: 'embedding' })`), `apps/api/src/app/skills/skills.service.ts`, `apps/api/src/app/cvs/processors/cv-parsing.processor.ts` (+ spec).

**Interfaces:**
- Produces: `EmbeddingQueueService.enqueue(target: EmbeddingTarget, id: string): Promise<void>` (job name `embed`, data `{ target, id }`); `buildEmbeddingText(target, row): string | null` (hàm thuần).
- Consumes: `EmbeddingService.embed` (0.6), `VectorSearchService.writeEmbedding` (1.2).

- [ ] **Step 1: Write the failing test**:
  - `buildEmbeddingText`: skill `{ name: 'React', synonyms: ['ReactJS','React.js'] }` → `"React; ReactJS; React.js"`; skill `synonyms: null` → `"React"`; CV `{ summary: 'S', skills: { technical: ['NestJS'] }, experience: [{ position: 'Backend Developer' }] }` → chứa `S`, `NestJS`, `Backend Developer`; CV mọi trường rỗng → `null`; question → `questionText`
  - processor: `embeds and writes the vector for the row`; `text null → skips without calling the API`; `row deleted → completes without error`; `API error → rethrows`
  - C2: `SkillsService.create/update enqueue('skill', id)`; `CvParsingProcessor enqueues('cv_parsed_data', id) after saving parsed data`; enqueue lỗi không làm hỏng việc lưu (log warn)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(api): embed skills and parsed cvs through a queue`.

### Task 1.4: Backfill

**Files:** Create `apps/api/src/common/vector/embedding-backfill.controller.ts`, `embedding-backfill.service.ts` + spec.

**Interfaces:** Produces `POST /embeddings/backfill` (`@Roles(UserRole.admin)`) → `{ enqueued: number }`; `EmbeddingBackfillService.enqueueMissing(): Promise<number>` duyệt cả ba target qua `findMissing`.

- [ ] **Step 1: Write the failing test** (C3): `enqueues only rows with a null embedding`; `second run after completion enqueues 0`; `non-admin → 403` (controller spec theo khuôn `cv-screenings.controller.spec.ts`).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Toàn bộ test/lint/build như Task 0.8 Step 4. PR M1 vào `dev`.
- [ ] **Step 6: Commit** — `feat(api): add an admin backfill for missing embeddings`.

---

## M3b — Phần 3b: người duyệt trên từng kết quả chấm

Nhánh `feat/gd3-p3b-screening-review`, cắt từ `dev` **ngay** (không phụ thuộc M0/M1); chạy song song với M0/M1. M0 (Task 0.5) cũng sửa `cv-screenings.processor.ts` và spec của nó → nhánh nào vào `dev` sau thì merge `dev` vào rồi giải xung đột trước khi mở PR (cách đã làm ở GĐ2).

### Task 3b.1: Schema duyệt + `RagMode` + điểm hiệu lực

**Files:** Modify `schema.prisma`, migration `20261102100000_add_screening_review_and_rag_mode`, `libs/shared/types/src/lib/enums.ts`; Create `libs/shared/types/src/lib/utils/screening-scores.ts` (+ export ở `src/index.ts`), `apps/api/src/app/cv-screenings/screening-scores.spec.ts` (test nằm trong `src/app/**` để Jest thấy).

**Interfaces:**
- Produces: các cột `reviewedById`, `reviewedAt`, `reviewedSkillsScore`, `reviewedExperienceScore`, `reviewedEducationScore`, `reviewedOverallScore` (Decimal(5,1)), `reviewNote`, `ragMode RagMode?`, `anchorScreeningIds Json?` trên `CVScreening`; quan hệ `reviewedBy User?`; enum `RagMode { none skills skills_anchors }`.
- `effectiveScreeningScores(s: ScreeningScoreFields): { overall: number | null; skills: number | null; experience: number | null; education: number | null; isReviewed: boolean }` — điểm duyệt nếu `reviewedAt` khác null, ngược lại điểm AI; nhận `number | string | null` (Decimal về dạng chuỗi).

- [ ] **Step 1: Write the failing test**: `returns AI scores when not reviewed`; `returns reviewed scores and isReviewed true when reviewedAt is set`; `parses decimal strings ("72.5" → 72.5)`; `all null → all null, isReviewed false`.
- [ ] **Step 2–4:** FAIL → implement + migration → PASS. Probe DB dùng một lần: migration áp được.
- [ ] **Step 5: Commit** — `feat(db): add review fields and rag mode to cv screenings`.

### Task 3b.2: API duyệt điểm

**Files:** Create `apps/api/src/app/cv-screenings/dto/review-screening.dto.ts`; Modify `cv-screenings.service.ts`, `cv-screenings.controller.ts`, `processors/cv-screenings.processor.ts` (xoá trường duyệt khi chấm lại) + spec của ba file.

**Interfaces:**
- Produces: `PATCH /cv-screenings/:applicationId/review` (`@Roles(UserRole.admin, UserRole.recruiter)`), body `ReviewScreeningDto { skillsScore: number; experienceScore: number; educationScore: number; note?: string }`; `CvScreeningsService.reviewScreening(caller: TenantCaller, applicationId: string, dto: ReviewScreeningDto)` trả bản ghi `CVScreening` sau cập nhật, cùng shape với `GET /cv-screenings/:applicationId`; socket `cv-screening:reviewed` tới `job_${jobId}`.

- [ ] **Step 1: Write the failing test** (C7, C8, Review Focus 5):
  - `caller without job access → 403` (qua `assertCanAccessJob`)
  - `status !== completed → 400 "Chỉ duyệt được kết quả sàng lọc đã hoàn tất"`
  - DTO: `101 → 400`, `-1 → 400` (`@Min(0) @Max(100)`)
  - `changed score without note → 400 "Vui lòng nhập lý do khi sửa điểm"`; `all equal to AI scores, no note → 200`
  - `reviewedOverallScore = calculateOverallScore(reviewed…, screening.aiConfig)` — weights 0.5/0.3/0.2, điểm 80/70/60 → 73
  - `72.55 → stored 72.6 and overall computed from 72.6`
  - `does not update Application.status nor aiRecommendation` (prisma.application.update không được gọi; data không chứa `aiRecommendation`)
  - `sets reviewedById = caller.userId, reviewedAt = now`; `emits cv-screening:reviewed to job room`
  - processor: `rescreening clears all review fields`
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** — `feat(api): let recruiters review each screening score`.

### Task 3b.3: Ứng viên và CSV dùng điểm hiệu lực

**Files:** Modify `cv-screenings.service.ts` (`getScreeningResultForCandidate`), `apps/api/src/app/applications/application-export.service.ts` + spec.

- [ ] **Step 1: Write the failing test** (C9 API): `candidate result returns reviewed scores when reviewed and never includes reviewNote nor reviewedBy`; CSV: `score columns use effective scores`, `adds columns "Điểm AI tổng (gốc)" and "Đã duyệt" ("Có"/"Không")`.
- [ ] **Step 2–4:** FAIL → implement bằng `effectiveScreeningScores` → PASS.
- [ ] **Step 5: Commit** — `feat(api): show effective scores to candidates and in the csv export`.

### Task 3b.4: Web — dialog duyệt và điểm hiệu lực

**Files:** Create `apps/web/src/components/candidates/ui/ReviewScreeningDialog.tsx` + `.test.tsx`; Modify `apps/web/src/servers/cv-screenings/cv-screenings.action.ts` (+ test), `apps/web/src/types/interfaces/cv-screening.interface.ts`, `components/kanban/KanbanClient.tsx`, `components/candidates/CompareTable.tsx`, `components/candidates/ui/CandidateOverviewTab.tsx`, `components/candidates/ui/CandidateRow.tsx`.

**Interfaces:** Produces `reviewScreeningAction(applicationId: string, input: { skillsScore: number; experienceScore: number; educationScore: number; note?: string }): Promise<ActionResult>` theo khuôn `lib/action-error.ts`, `revalidatePath` các route candidates/kanban.

- [ ] **Step 1: Write the failing test** (C13, C9 web):
  - dialog: `opens from the "Duyệt điểm" button and shows AI scores side by side`; `submitting changed scores without a note shows "Vui lòng nhập lý do khi sửa điểm"`; `confirming unchanged scores calls the action without a note`
  - `Kanban card and compare table show the reviewed overall score and the text "Đã duyệt"`; `unreviewed shows the AI score without "Đã duyệt"`
- [ ] **Step 2:** `npm run test:web -- src/components/candidates src/components/kanban src/servers/cv-screenings` → FAIL. **Step 3:** Implement (dùng `effectiveScreeningScores`; giữ layout, class, màu hiện có). **Step 4:** PASS; `typecheck:web`, `lint:web` sạch; `NODE_ENV=production npx nx build web` rồi `git checkout apps/web/next-env.d.ts`.
- [ ] **Step 5: Commit** — `feat(web): review screening scores and show effective scores`.

### Task 3b.5: E2E duyệt điểm

**Files:** Create `apps/web/e2e/screening-review.spec.ts`; Modify fixture seed trong `apps/web/e2e/support/` để có một lần chấm `completed` chưa duyệt.

- [ ] **Step 1:** Viết journey (C14): recruiter đăng nhập → mở hồ sơ → "Duyệt điểm" → sửa kỹ năng, nhập lý do → lưu → Kanban hiện "Đã duyệt" và điểm tổng mới.
- [ ] **Step 2:** `docker compose -f docker-compose.test.yml up -d --build --wait`; `node apps/web/e2e/support/prepare-local.mjs`; `npm run test:e2e:web -- screening-review` → PASS; tắt stack.
- [ ] **Step 3: Commit** — `test(web): cover reviewing a screening score end to end`. PR M3b vào `dev`.

---

## M2 — Phần 2: khớp kỹ năng theo nghĩa + B-01

Nhánh `feat/gd3-p2-skill-match`, cắt từ `dev` sau khi M1 **và** M3b vào `dev`.

### Task 2.1: `matchSkills` thuần

**Files:** Create `apps/api/src/app/cv-screenings/skill-matcher.ts`, `skill-matcher.spec.ts`; Modify `env.validation.ts` (`SKILL_MATCH_THRESHOLD` tuỳ chọn, mặc định `0.8` — ASSUMPTION, chốt ở Task 2.3).

**Interfaces:** Produces
- `cosine(a: number[], b: number[]): number`
- `matchSkills(cvSkills: { text: string; vector: number[] }[], jobSkills: { skillId: string; name: string; isRequired: boolean; vector: number[] | null }[], threshold: number): SkillMatchResult`
- `interface SkillMatchResult { matchedRequired: SkillMatch[]; matchedOptional: SkillMatch[]; missingRequired: { skillId: string; name: string }[] }`; `interface SkillMatch { skillId: string; name: string; cvSkill: string; similarity: number }`

- [ ] **Step 1: Write the failing test** (C4, test.each với vector 3 chiều dựng tay):
  - `cosine` của hai vector giống nhau = 1, vuông góc = 0
  - CV rỗng → mọi kỹ năng required vào `missingRequired`; tin rỗng → mọi mảng rỗng
  - similarity đúng bằng threshold → khớp; ngay dưới (threshold − 1e-9) → thiếu
  - hai kỹ năng CV cùng khớp một kỹ năng tin → khớp một lần, `cvSkill` là cái có similarity cao nhất
  - kỹ năng CV trùng chữ → không nhân đôi
  - kỹ năng tin `vector: null` → so khớp theo tên không phân biệt hoa thường; không trùng tên → thiếu
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** — `feat(api): match cv skills to job skills by embedding similarity`.

### Task 2.2: Đưa kỹ năng của tin vào chấm (B-01) — hai commit

**Files:** Modify `apps/api/src/app/cv-screenings/processors/cv-screenings.processor.ts` (+ spec), `apps/api/src/common/constants/gemini-api.ts` (`CV_SCREENING_PROMPT`; nếu M0 đã đổi tên file thì theo tên mới).

**Interfaces:** Consumes `matchSkills` (2.1), `EmbeddingService.embed`, `VectorSearchService.readEmbeddings('skill', ids)`. Produces job data tuỳ chọn `ragMode?: RagMode` trên `process-cv-screening` (dùng ở 3a và M5).

- [ ] **Step 1: Write the failing test (B-01, commit riêng)** `screening prompt contains a <skill_match> block listing the job's required skills` — tin có `jobPostingSkills` [React required, Docker optional] → content gửi `llmService.screeningCV` chứa `<skill_match>` với "React". Run → FAIL.
- [ ] **Step 2: Commit đỏ** — `test(api): expect job posting skills in the screening prompt`.
- [ ] **Step 3: Thêm test** (C5, C12, E1, E2, Review Focus 4):
  - `matchedSkills = { hardSkills: matchedRequired names, niceToHaveSkills: matchedOptional names }`, `missingSkills = missingRequired names` — không lấy từ LLM
  - `ragMode = 'skills'` được lưu
  - `CandidateSkill` upsert cho mọi kỹ năng khớp, `source: 'cv_parsed'`, không tạo `Skill`
  - E1: tin không có kỹ năng → `<skill_match>` rỗng, LLM vẫn được gọi
  - Review Focus 4: `skills.technical` null/rỗng → không gọi `embed`, mọi required vào missing
  - C12: `embed` ném lỗi → `ragMode = 'none'`, prompt không có `<skill_match>`, `matchedSkills/missingSkills` lấy từ LLM như hôm nay, log warn, job vẫn completed
- [ ] **Step 4:** Implement: embed `skills.technical` theo một lô; đọc vector kỹ năng tin; `matchSkills`; thêm khối `<skill_match>` vào `getRawJson`; thêm vào `CV_SCREENING_PROMPT` mục mô tả `<skill_match>` ("system-computed; do not re-match skills yourself; base skills_score on it"), giữ quy tắc dữ liệu không tin cậy. Run → PASS.
- [ ] **Step 5: Commit fix** — `fix(api): feed job posting skills into cv screening through the skill matcher`.

### Task 2.3: Probe ngưỡng τ (cần người dùng cho phép)

- [ ] **Step 1:** Script `docs/tasks/gd3-rag/results/probe-threshold.mjs` (C15): embed các cặp `ReactJS/React.js`, `Node/Node.js`, `PostgreSQL/Postgres`, `ReactJS/PostgreSQL`, `Java/JavaScript`, `lập trình hướng đối tượng/OOP`, `cơ sở dữ liệu/Database`; in cosine. Lưu output.
- [ ] **Step 2:** Chọn τ nằm giữa cặp "đồng nghĩa" thấp nhất và cặp "khác" cao nhất; ghi vào `research.md` (verified) và sửa mặc định `SKILL_MATCH_THRESHOLD` + test biên Task 2.1 nếu cần. Ghi rõ cặp tiếng Việt nào không vượt τ.
- [ ] **Step 3:** Toàn bộ test/lint/build. PR M2 vào `dev`.

---

## M3a — Phần 3a: mốc chấm đã duyệt

Nhánh `feat/gd3-p3a-anchors`, cắt từ `dev` sau M2.

### Task 3a.1: `AnchorRetriever` và chọn chế độ

**Files:** Create `apps/api/src/app/cv-screenings/anchor-retriever.ts` + spec; Modify `vector-search.service.ts` (+ spec), `cv-screenings.processor.ts` (+ spec), `CV_SCREENING_PROMPT`, `env.validation.ts` (`ANCHOR_COUNT` tuỳ chọn, mặc định 3).

**Interfaces:**
- Produces: `selectRagMode(input: { forced?: RagMode; embeddingsAvailable: boolean; reviewedCount: number; k: number }): RagMode` (thuần); `VectorSearchService.nearestAnchorScreenings(jobId: string, excludeApplicationId: string, cvVector: number[], k: number): Promise<string[]>` (chỉ `reviewed_at IS NOT NULL`, cùng `job_id`, `cv_parsed_data.embedding IS NOT NULL`); `AnchorRetriever.retrieve(jobId, applicationId, cvParsedDataId, k): Promise<Anchor[]>`; `interface Anchor { screeningId: string; cvSummary: string | null; cvSkills: string[]; skillsScore: number; experienceScore: number; educationScore: number }` (điểm sau duyệt).

- [ ] **Step 1: Write the failing test** (C6, E3, Review Focus 2):
  - `selectRagMode`: `forced` luôn thắng; embeddings không dùng được → `none`; reviewedCount 2, k 3 → `skills`; reviewedCount 3 → `skills_anchors`
  - `nearestAnchorScreenings` SQL có `job_id = $jobId`, `application_id <> $exclude`, `reviewed_at IS NOT NULL` (assert trên tham số `$queryRaw`)
  - processor: `skills_anchors` → prompt có `<anchors>` với đúng điểm sau duyệt của 3 mốc; `anchorScreeningIds` lưu 3 id; chỉ còn 2 mốc có vector → chạy `skills`; CV đang chấm chưa có vector → `skills`
  - job data `ragMode: 'none'` → không `<skill_match>`, không `<anchors>`
- [ ] **Step 2–4:** FAIL → implement (thêm mục `<anchors>` vào prompt: "reviewed examples for calibration; do not copy scores") → PASS.
- [ ] **Step 5: Verify:** probe DB — 4 lần chấm cùng tin (1 là hồ sơ hiện tại đã duyệt) + 1 lần chấm tin khác đã duyệt → `nearestAnchorScreenings` không trả hồ sơ hiện tại và không trả tin khác. Lưu output.
- [ ] **Step 6: Commit** — `feat(api): calibrate cv screening with reviewed anchors from the same job`. PR M3a vào `dev`.

---

## M4 — Phần 4: ngân hàng câu hỏi phỏng vấn

Nhánh `feat/gd3-p4-question-bank`, cắt từ `dev` sau M1 (song song với M2/M3a).

### Task 4.1: Schema + API quản lý câu hỏi

**Files:** Modify `schema.prisma` (`InterviewQuestion`, enum `QuestionSource`, `InterviewQnA.source` mặc định `generated`, `InterviewQnA.bankQuestionId` FK SetNull), migration `20261109000000_add_interview_question_bank`, `enums.ts`, `vector-search.service.ts` (target `interview_question`); Create `apps/api/src/app/interviews/questions/interview-questions.service.ts`, `interview-questions.controller.ts`, `dto/*.ts` + spec; Modify `interviews.module.ts`.

**Interfaces:** Produces (tất cả `@Roles(UserRole.admin)`):
- `GET /interviews/topics/:topicId/questions` → `{ items, pagination }` (lọc `difficulty?`, `includeInactive?`)
- `POST /interviews/topics/:topicId/questions` body `{ difficulty: DifficultyLevel; questionText: string; expectedPoints: string[] }`
- `PATCH /interviews/questions/:questionId` (cùng trường, tuỳ chọn, + `isActive?: boolean`)
- `DELETE /interviews/questions/:questionId` → đặt `isActive = false`
- Lưu (tạo/sửa text) → `EmbeddingQueueService.enqueue('interview_question', id)`

- [ ] **Step 1: Write the failing test** (C10): `non-admin → 403`; `create enqueues embedding`; `update without text change does not enqueue`; `delete sets isActive false and keeps the row`; `topic not found → 404 "Không tìm thấy chủ đề phỏng vấn"`; `expectedPoints empty → 400`.
- [ ] **Step 2–4:** FAIL → implement → PASS. Probe DB: migration áp được, dòng `interview_qnas` cũ có `source = 'generated'`.
- [ ] **Step 5: Commit** — `feat(api): add an admin-managed interview question bank`.

### Task 4.2: Sinh câu hỏi từ ngân hàng

**Files:** Create `apps/api/src/app/interviews/session/question-selection.ts` + spec; Modify `interview-session.service.ts` (thêm `topicId` vào job data), `interview-generation.processor.ts` (+ spec), `vector-search.service.ts` (+ spec), `MOCK_INTERVIEW_GENERATE_PROMPT`.

**Interfaces:**
- Produces: `GenerateQuestionsJobData.topicId: string`; `VectorSearchService.nearestQuestions(topicId: string, difficulty: DifficultyLevel, vector: number[], limit: number): Promise<BankQuestion[]>` (`is_active`, `embedding IS NOT NULL`); `interface BankQuestion { questionId: string; questionText: string; expectedPoints: string[]; difficulty: DifficultyLevel }`; `reconcileSelection(items: LlmQuestionItem[], retrieved: BankQuestion[]): QnaDraft[]`; `interface LlmQuestionItem { bankQuestionId?: string | null; questionText: string; expectedPoints: string[]; difficulty: DifficultyLevel }`; `interface QnaDraft extends LlmQuestionItem { source: QuestionSource }`.

- [ ] **Step 1: Write the failing test** (C11, E6, C12, Review Focus 3):
  - `reconcileSelection`: id thuộc tập → `bank`; id ngoài tập → `generated`, id thành null; cùng id hai lần → lần đầu `bank`, lần sau `generated` không id; id null → `generated`
  - processor: truy hồi gọi `nearestQuestions(topicId, difficultyLevel, vec, 25)`; prompt chứa danh sách câu kèm id và số câu cần sinh bù = `max(0, 10 − retrieved.length)`; 12 câu truy hồi → 10 câu `bank` lưu với `bankQuestionId`; 6 câu → 6 `bank` + 4 `generated`; 0 câu (E6) → 10 `generated`
  - C12: `embed` ném lỗi → bỏ truy hồi, prompt như hôm nay, 10 câu `generated`, log warn
  - ít hơn 10 câu sau `reconcileSelection` → ném lỗi như hôm nay (để BullMQ thử lại)
- [ ] **Step 2–4:** FAIL → implement (prompt: chọn ưu tiên từ `<question_bank>`, được viết lại nhẹ giữ ý, trả `bankQuestionId`; chỉ sinh câu mới khi bank không đủ) → PASS.
- [ ] **Step 5: Commit** — `feat(api): draw mock interview questions from the question bank`.

### Task 4.3: Web — quản lý câu hỏi của topic

**Files:** Create `apps/web/src/components/interview-topic-management/ui/TopicQuestionsPanel.tsx` + `.test.tsx`, `apps/web/src/servers/interviews/interview-questions.action.ts` + test; Modify `InterviewTopicClient.tsx`.

- [ ] **Step 1: Write the failing test** (C13): `admin opens "Câu hỏi" on a topic and sees its questions grouped by difficulty`; `adding a question with empty expected points shows "Cần ít nhất một ý mong đợi"`; `hiding a question removes it from the active list and shows it under "Đã ẩn"`.
- [ ] **Step 2–4:** FAIL → implement (`AccessibleDialog`, toast) → PASS; typecheck/lint web sạch.
- [ ] **Step 5: Commit** — `feat(web): manage interview questions per topic`.

### Task 4.4: Nội dung seed ngân hàng câu hỏi

**Files:** Create `libs/backend/database/prisma/seed_interview_questions.sql`.

- [ ] **Step 1:** Chọn 3 topic đang có (hỏi người dùng nếu chưa đủ 3); AI soạn nháp ≥15 câu × 3 mức cho mỗi topic, mỗi câu 2–4 `expectedPoints`, tiếng Việt.
- [ ] **Step 2: Người dùng duyệt nội dung** trước khi commit.
- [ ] **Step 3:** Nạp vào dev, gọi `POST /embeddings/backfill`, kiểm `SELECT count(*) FROM interview_questions WHERE embedding IS NULL` → 0 (cần key thật, người dùng cho phép).
- [ ] **Step 4: Commit** — `chore(db): seed the interview question bank`. PR M4 vào `dev`.

---

## M5 — Đo nhất quán và nghiệm thu

Nhánh `feat/gd3-consistency-measurement`, cắt từ `dev` sau M2, M3a, M4.

### Task 5.1: Bộ dữ liệu và script đo

**Files:** Create `docs/tasks/gd3-rag/results/consistency/dataset.md` (mô tả bộ), `seed-consistency.sql`, `run-consistency.mjs`, `stats.mjs` + `stats.test.mjs` (chạy bằng `node --test`).

**Interfaces:** `summarize(runs: { pairId: string; mode: RagMode; skills: number; experience: number; education: number; overall: number }[]): { mode: RagMode; field: string; meanStdev: number; maxStdev: number }[]` (độ lệch chuẩn tổng thể theo từng cặp, rồi trung bình và lớn nhất theo chế độ).

- [ ] **Step 1: Write the failing test** `stats.test.mjs`: hai cặp, chế độ `none`, overall [70,70,70] và [60,70,80] → stdev cặp 0 và 8.165 (±0.001) → `meanStdev 4.082`, `maxStdev 8.165`; một lần chạy → stdev 0.
- [ ] **Step 2:** `node --test docs/tasks/gd3-rag/results/consistency/stats.test.mjs` → FAIL; implement; → PASS.
- [ ] **Step 3:** Seed: 2 tin có `jobPostingSkills`, 10 cặp CV–tin, mỗi tin ≥ 3 lần chấm đã duyệt làm mốc (CV khác 10 cặp). CV lấy từ dữ liệu demo đã có; nội dung cho người dùng duyệt.
- [ ] **Step 4:** `run-consistency.mjs`: với mỗi cặp × chế độ × 5 lần, thêm job `process-cv-screening` (data có `ragMode`, `notify: false`) vào queue `cv-screening` qua BullMQ, chờ `status` về `completed`, đọc điểm; tuần tự; ghi `runs.json` rồi `summary.md` (bảng `summarize`, kèm τ, k, model, ngày). `--dry-run` chỉ in kế hoạch 150 lần chạy.
- [ ] **Step 5: Commit** — `test(api): add the cv screening consistency measurement`.

### Task 5.2: Chạy đo, chốt τ/k, nghiệm thu (cần người dùng cho phép)

- [ ] **Step 1:** `node run-consistency.mjs --dry-run` → 150 lần; ước tính token từ 1 lần thật; báo chi phí cho người dùng trước khi chạy đủ.
- [ ] **Step 2:** Chạy đủ (C16); commit `runs.json`, `summary.md`. Nếu `skills_anchors` không giảm độ lệch so với `skills` → ghi rõ trong `summary.md`, không chỉnh số.
- [ ] **Step 3:** Chốt k (giữ 3 hoặc đổi theo số liệu) và τ (từ Task 2.3); cập nhật mặc định nếu đổi.
- [ ] **Step 4:** Kiểm tay C17 trên dev với key thật: tải CV → chấm (`skills_anchors`) → duyệt → phiên phỏng vấn thử có câu `bank`. Ghi `docs/tasks/gd3-rag/results/manual-check.md`; viết `operation.md` (hành trình recruiter, admin, ứng viên).
- [ ] **Step 5:** Tài liệu: `docs/migration-roadmap.md` (GĐ3 xong, sửa dòng `text-embedding-004`, tick các mục Phase 2 đã làm); `docs/deliveries/gd3-rag.md` thêm mục "as-built"; brain §10 dòng "Gemini — only via `GeminiService`" → `LlmService` (file ngoài repo).
- [ ] **Step 6: Commit** — `docs: record the gđ3 measurement and close-out`. PR M5 vào `dev`.

---

## Thứ tự và song song

```
M0 (phần 0) ──► M1 (hạ tầng vector) ──┬──► M2 (khớp kỹ năng) ──► M3a (mốc) ──┐
                                      └──► M4 (ngân hàng câu hỏi) ────────────┼──► M5 (đo + nghiệm thu)
M3b (người duyệt) — bắt đầu ngay, song song M0/M1 ────────────────────────────┘
```

| Tuần | Milestone |
|---|---|
| 1 (→1/11) | M0 Task 0.0–0.5; M3b Task 3b.1 |
| 2 (2–8/11) | M0 xong (0.6–0.8); M1; M3b xong; soạn nội dung seed (4.4 Step 1, 5.1 Step 3) |
| 3 (9–15/11) | M2 → M3a; M4 song song |
| 4 (16–22/11) | M5 |
