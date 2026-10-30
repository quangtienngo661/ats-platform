# Spec — GĐ3 phần 1–4: nâng cấp AI bằng RAG

**Ngày:** 2026-10-30 · **Trạng thái:** chờ người dùng duyệt spec (thiết kế đã được duyệt từng đoạn trong chat cùng ngày) ·
**Nguồn:** đề cương ĐA2 (hàng "Nâng cấp AI bằng RAG", 26/10–22/11/2026, và mục b "Sàng lọc CV bằng AI", "Ngân hàng câu
hỏi phỏng vấn", "So khớp kỹ năng") cùng các quyết định ở [decision.md](decision.md).
**Phụ thuộc:** phần 0 — [`docs/tasks/gd3-p0-ai-provider/spec.md`](../gd3-p0-ai-provider/spec.md) (worktree `E:\wt\ats-gd3-p0`,
chưa commit): `LlmService`, `EmbeddingService` (OpenAI `text-embedding-3-small`, 1536 chiều), `AiActionType.embedding`.

## Mục tiêu

Sàng lọc CV và phỏng vấn thử bằng AI **nhất quán hơn giữa các lần chạy và kiểm chứng được bằng số liệu**:

1. Chấm CV dựa trên danh sách kỹ năng khớp do code tính (khớp theo nghĩa bằng embedding), cộng các lần chấm đã được
   người duyệt của cùng tin làm mốc khi có đủ.
2. Mỗi kết quả chấm có người duyệt: lưu người duyệt, thời điểm duyệt, điểm sau điều chỉnh.
3. Phỏng vấn thử lấy câu hỏi từ ngân hàng câu hỏi qua truy hồi, chỉ sinh bù khi ngân hàng thiếu.
4. Một script đo độ lệch điểm giữa các lần chấm ở ba chế độ, kết quả đưa vào báo cáo.

## Vị trí trong GĐ3

| # | Phần | Phụ thuộc | Tuần dự kiến |
|---|---|---|---|
| 0 | Lớp nhà cung cấp AI + client embedding (spec riêng) | — | 1 |
| 1 | Hạ tầng vector: image có pgvector, extension, cột vector, queue embedding, backfill, `VectorSearch` | 0 | 2 |
| 3b | Người duyệt trên từng kết quả chấm | — (không cần vector) | 2 |
| 2 | Khớp kỹ năng theo nghĩa (`SkillMatcher`), sửa B-01, nối `CandidateSkill` | 1 | 3 |
| 3a | Mốc chấm đã duyệt (`AnchorRetriever`) | 1, 2, 3b | 3 |
| 4 | Ngân hàng câu hỏi phỏng vấn | 1 | 3 |
| — | Đo nhất quán, chốt τ và k, nghiệm thu, E2E, delivery docs | tất cả | 4 |

## Ngoài phạm vi

Không tự đổi `Application.status` hay `aiRecommendation` theo điểm (ADR 0002). Không tạo `Skill` mới từ CV (kỹ năng lạ giữ
dạng chữ). Không ngân hàng câu hỏi theo tổ chức hay theo tin tuyển dụng. Không lịch sử nhiều lần duyệt (chỉ lần cuối).
Không index HNSW/IVFFlat. Không gợi ý việc làm cho ứng viên, không tìm lại ứng viên cũ bằng RAG (đề cương §9). Không
`organizationId` trên `AiUsageLog` (GĐ4).

## Quy tắc

| # | Quy tắc |
|---|---|
| R1 | Vector lưu thành cột `embedding vector(1536)` trên từng bảng (`Skill`, `CVParsedData`, `InterviewQuestion`); Prisma khai báo `Unsupported("vector(1536)")?`; mọi truy vấn tương đồng đi qua một helper `VectorSearch` (cosine, top-K, raw SQL có tham số). |
| R2 | Embedding sinh qua một queue BullMQ riêng, kế thừa `attempts: 3` từ `forRoot` (không truyền `defaultJobOptions` vào `registerQueue`). Sinh khi: `Skill` tạo/sửa (văn bản = tên + `synonyms`); `CVParsedData` bóc tách xong; `InterviewQuestion` tạo/sửa. Có script backfill cho dòng cũ có `embedding` null. |
| R3 | `SkillMatcher`: mỗi kỹ năng của tin (`jobPostingSkills`) là khớp khi có ít nhất một kỹ năng kỹ thuật trong CV có cosine ≥ τ; ngược lại là thiếu. τ là cấu hình, chốt bằng probe và bằng script đo. |
| R4 | Kỹ năng trong CV không khớp `Skill` nào giữ dạng chữ trong `CVParsedData`; không tạo `Skill`. `CandidateSkill` chỉ nối các `Skill` đã khớp, `source` theo enum `CandidateSkillSource` hiện có. |
| R5 | Chế độ chấm `ragMode` ∈ {`none`, `skills`, `skills_anchors`}. Luồng thường: `skills_anchors` nếu tin có ≥ k lần chấm đã duyệt (trừ chính hồ sơ đang chấm), ngược lại `skills`. Script đo được ép chế độ theo từng lần gọi. k mặc định 3. |
| R6 | Mốc = lần chấm cùng tin có `reviewedAt` khác null; chọn k mốc có `CVParsedData.embedding` gần CV đang chấm nhất; đưa vào prompt điểm **sau duyệt** của ba điểm con. Mốc chỉ lấy trong cùng tin nên không thể lẫn tổ chức. |
| R7 | `matchedSkills`/`missingSkills` lưu kết quả của `SkillMatcher`, không lấy từ LLM. LLM vẫn trả `skills_score`, `experience_score`, `education_score`, `ai_reasoning`; điểm tổng do code tính bằng `calculateOverallScore` như hôm nay. |
| R8 | `CVScreening` lưu `ragMode` và danh sách id các mốc đã dùng. |
| R9 | Duyệt điểm: quyền giống `GET /cv-screenings/:applicationId` (`assertCanAccessJob`); chỉ khi `status = completed`; mỗi điểm con 0–100; "xác nhận" = giữ điểm AI, ghi chú tuỳ chọn; "sửa" = ít nhất một điểm khác điểm AI, ghi chú bắt buộc. Điểm tổng sau duyệt = `calculateOverallScore` với `AiConfig` của lần chấm. Chỉ lưu lần duyệt cuối. |
| R10 | Chấm lại một hồ sơ xoá toàn bộ trường duyệt của lần chấm đó. |
| R11 | Điểm hiệu lực = điểm sau duyệt nếu có, ngược lại điểm AI. Kanban, so sánh ứng viên (SP1), CSV (SP2) và trang ứng viên hiển thị điểm hiệu lực, kèm dấu "đã duyệt" ở phía nhân sự. CSV thêm cột điểm AI gốc. Ứng viên không thấy ghi chú duyệt và người duyệt. |
| R12 | Duyệt điểm không đổi `Application.status`, không đổi `aiRecommendation` (ADR 0002). Emit socket tới room của tin sau khi duyệt. |
| R13 | `InterviewQuestion` là bảng toàn hệ thống (không `organizationId`), gắn `InterviewTopic` + `DifficultyLevel`; chỉ admin tạo/sửa/ẩn; xoá là `isActive = false`. |
| R14 | Sinh câu hỏi: truy hồi top-25 câu `isActive`, đúng `topicId`, đúng độ khó của phiên, gần nhất với embedding của (tên topic + `candidateContext`). LLM chọn 10 câu, được viết lại nhẹ; chỉ sinh câu mới khi số câu đủ điều kiện < 10. |
| R15 | Code kiểm đầu ra LLM: `bankQuestionId` không thuộc tập vừa truy hồi → coi là `generated`, xoá id. `InterviewQnA` lưu `source` ∈ {`bank`, `generated`} và `bankQuestionId` (null khi `generated`). |
| R16 | Embedding thiếu hoặc lỗi (vector null, `OPENAI_API_KEY` thiếu): chấm CV chạy chế độ `none`, sinh câu hỏi chạy như hôm nay (LLM tự sinh), ghi log cảnh báo; không làm hỏng luồng. |

## Thiết kế

### Luồng chấm CV

```
kỹ năng kỹ thuật trong CV ──┐
                            ├─ SkillMatcher (cosine ≥ τ) → matched / missing     [phần 2, tất định, sửa B-01]
jobPostingSkills ───────────┘
          │
          ├─ tin có ≥ k lần chấm đã duyệt?  có → AnchorRetriever: k CV gần nhất CÙNG TIN → điểm sau duyệt  [3a]
          ▼
prompt = <cv_data> + <jd_data> + <skill_match> + <anchors>  →  LlmService.screeningCV  →  3 điểm con + lý do
          ▼
calculateOverallScore (giữ nguyên)  →  CVScreening (+ ragMode, id mốc, matched/missing từ SkillMatcher)
```

`CV_SCREENING_PROMPT` đổi: thêm mô tả hai khối `<skill_match>` (danh sách kỹ năng khớp/thiếu do hệ thống tính, LLM không
tự so lại) và `<anchors>` (ví dụ đã được người duyệt chấm, dùng để hiệu chỉnh thang điểm, không sao chép). Khối dữ liệu
vẫn là dữ liệu không tin cậy như quy tắc 1 của prompt hiện tại.

### Thành phần (API)

```
common/vector/
  vector-search.ts        VectorSearch — raw SQL cosine top-K, có tham số, lọc theo điều kiện truyền vào
common/external-apis/embedding/   (phần 0) + queue embedding + processor
app/cv-screenings/
  skill-matcher.ts        SkillMatcher (hàm thuần cho phần so ngưỡng; phần truy vector qua VectorSearch)
  anchor-retriever.ts     AnchorRetriever
  dto/review-screening.dto.ts, route PATCH /cv-screenings/:applicationId/review
app/interviews/questions/ CRUD InterviewQuestion (admin)
scripts/ (hoặc results/ của task)  backfill embedding; script đo nhất quán
```

### Dữ liệu

- Migration A: `CREATE EXTENSION IF NOT EXISTS vector`; cột `embedding vector(1536)` (nullable) trên `skills`,
  `cv_parsed_data`.
- Migration B: bảng `interview_questions` (`question_id`, `topic_id` FK, `difficulty`, `question_text`, `expected_points`
  Json, `embedding vector(1536)`, `is_active`, `created_by_id` FK User, `created_at`, `updated_at`); enum
  `QuestionSource` {`bank`, `generated`}; `interview_qnas.source` (mặc định `generated` cho dòng cũ),
  `interview_qnas.bank_question_id` FK nullable `ON DELETE SET NULL`.
- Migration C: `cv_screenings` thêm `reviewed_by_id` FK User, `reviewed_at`, `reviewed_skills_score`,
  `reviewed_experience_score`, `reviewed_education_score`, `reviewed_overall_score` (Decimal(5,1) như cột AI),
  `review_note`, `rag_mode` (enum `RagMode`, nullable cho dòng cũ), `anchor_screening_ids` Json.
- Enum mới chép tay sang `libs/shared/types/src/lib/enums.ts` trong cùng commit (brain §5).
- Hạ tầng: image Postgres có pgvector ở `docker-compose-dev.yml`, `docker-compose.test.yml`, `docker-compose.yml` (prod —
  cần người dùng đồng ý riêng, `CLAUDE.md` §7) và service DB của CI nếu có.

### Web

- Phía nhân sự: nút "Duyệt điểm" mở `AccessibleDialog` (điểm AI và điểm sau duyệt cạnh nhau, ba ô điểm, ghi chú); dấu "đã
  duyệt" ở Kanban, so sánh ứng viên, chi tiết chấm. Server Action mới trong `src/servers/cv-screenings/` gọi route review,
  `revalidatePath`.
- Admin: trang `(admin)/interview-topic-management` thêm quản lý câu hỏi của từng topic (thêm, sửa, ẩn).
- Phía ứng viên: hiển thị điểm hiệu lực; không hiện ghi chú hay người duyệt.
- Chuỗi hiển thị tiếng Việt.

### Script đo nhất quán

Bộ dữ liệu cố định: 10 cặp CV–tin trên 2 tin, mỗi tin thêm ≥ k lần chấm đã duyệt làm mốc (seed). Mỗi cặp chấm 5 lần ở
mỗi chế độ `none`, `skills`, `skills_anchors` (150 lời gọi). Ghi ra file trong `results/`: độ lệch chuẩn của ba điểm con
và điểm tổng theo từng chế độ, cùng τ và k đã dùng. Số liệu phụ: chênh lệch điểm AI và điểm sau duyệt trên các lần chấm đã
duyệt. Chỉ chạy khi người dùng cho phép (tốn tiền).

## Tiêu chí chấp nhận

| # | Tiêu chí | Cấp kiểm |
|---|---|---|
| C1 | Extension `vector` có trên Postgres của dev và test; ba cột/bảng vector tồn tại; `VectorSearch` trả top-K đúng thứ tự cosine trên dữ liệu biết trước | probe DB thật |
| C2 | Lưu `Skill`, bóc tách xong CV, lưu `InterviewQuestion` đều đưa một job vào queue embedding; job ghi vector đúng dòng; lỗi thì BullMQ thử lại | API unit |
| C3 | Backfill chỉ xử lý dòng `embedding` null, chạy lại không gọi API lần hai | API unit |
| C4 | `SkillMatcher`: danh sách rỗng (CV hoặc tin) → toàn bộ thiếu / không có gì; cosine đúng bằng τ → khớp; ngay dưới τ → thiếu; nhiều kỹ năng CV khớp một kỹ năng tin → khớp một lần; kỹ năng trùng trong CV không nhân đôi | API unit (bảng) |
| C5 | B-01: prompt chấm có khối `<skill_match>` lấy từ `jobPostingSkills`; `matchedSkills`/`missingSkills` lưu đúng kết quả `SkillMatcher` | API unit |
| C6 | `ragMode`: tin có k−1 mốc → `skills`; có k mốc → `skills_anchors` với đúng k id gần nhất; hồ sơ đang chấm không tự làm mốc của chính nó; mốc không bao giờ đến từ tin khác | API unit + probe DB |
| C7 | Duyệt: sai quyền → 403; `status` ≠ `completed` → 400; điểm ngoài 0–100 → 400; sửa điểm mà thiếu ghi chú → 400; xác nhận không ghi chú → 200; điểm tổng sau duyệt khớp `calculateOverallScore`; `Application.status` và `aiRecommendation` không đổi | API unit + walk API thật |
| C8 | Chấm lại xoá các trường duyệt | API unit |
| C9 | Điểm hiệu lực hiển thị đúng ở Kanban, so sánh, CSV (có thêm cột điểm AI), trang ứng viên; ứng viên không thấy ghi chú/người duyệt | Web unit + API unit (CSV) |
| C10 | `InterviewQuestion`: chỉ admin tạo/sửa/ẩn; câu ẩn không được truy hồi | API unit |
| C11 | Sinh câu hỏi: truy hồi đúng topic + độ khó, tối đa 25; ngân hàng ≥ 10 câu đủ điều kiện → 10 câu `bank`; có 6 câu → 6 `bank` + 4 `generated`; id ngoài tập truy hồi → `generated`, id bị xoá | API unit (bảng) |
| C12 | Embedding lỗi hoặc thiếu key → chấm chạy `none`, sinh câu hỏi chạy như hôm nay, có log cảnh báo | API unit |
| C13 | Dialog duyệt điểm và màn quản lý câu hỏi: hành vi theo role và chữ hiển thị | Web unit |
| C14 | E2E: recruiter duyệt một kết quả chấm (dữ liệu chấm seed sẵn) → Kanban hiện dấu "đã duyệt" và điểm hiệu lực | E2E |
| C15 | Probe thật (người dùng cho phép): τ tách "ReactJS"/"React.js" khỏi "PostgreSQL"; kỹ năng viết tiếng Việt được ghi nhận kết quả | probe API thật |
| C16 | Script đo chạy trọn bộ dữ liệu, ra file kết quả có độ lệch chuẩn của 3 chế độ | chạy script (người dùng cho phép, tốn tiền) |
| C17 | Kiểm tay trên dev với key thật: tải CV → chấm (`skills_anchors`) → duyệt → một phiên phỏng vấn thử lấy câu từ ngân hàng | kiểm tay |

### Edge case

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| E1 | Tin không có `jobPostingSkills` | `<skill_match>` rỗng; LLM chấm như hôm nay dựa trên `parsedRequirements` |
| E2 | CV chưa có embedding khi chấm (queue chưa chạy xong) | Không lấy mốc (chế độ `skills`); `SkillMatcher` vẫn chạy vì embed kỹ năng CV theo lô ngay lúc chấm |
| E3 | Mốc có `CVParsedData.embedding` null | Bị bỏ qua khi chọn mốc; nếu còn < k thì chạy `skills` |
| E4 | Admin ẩn một câu đang được phiên cũ dùng | Phiên cũ giữ nguyên câu; phiên mới không truy hồi câu đó |
| E5 | Duyệt đồng thời bởi hai người | Lần ghi sau thắng, `reviewedAt` và `reviewedById` là của lần sau |
| E6 | Topic không có câu nào trong ngân hàng | 10 câu `generated`, như hôm nay |

## Kiểm thử và quy trình

- Unit: mock `EmbeddingService`, `LlmService`, Prisma (`createPrismaMock`); phần so ngưỡng của `SkillMatcher` là hàm thuần
  để test hết biên.
- Raw SQL vector: probe trên PostgreSQL có pgvector dùng một lần (`docker run --rm`, cổng riêng) như SP1/SP3; có thêm lệnh
  `test:integration` hay không quyết khi lập plan.
- E2E: test stack không có AI thật; dùng dữ liệu chấm seed sẵn như GĐ2; không đi qua embedding.
- Kiểm toàn bộ: jest API, `nx lint api`, `nx build api` (`--skip-nx-cache`), `test:web`, `typecheck:web`, `lint:web`, E2E.
- Mỗi phần một plan riêng, chạy trong worktree riêng như GĐ2. Không commit, push, merge khi chưa được người dùng duyệt.

## Chưa xác minh (kiểm khi lập plan hoặc bằng probe)

- Có image chính thức pgvector cho PostgreSQL 18 (tag, bản alpine hay không) và CI dùng image nào cho DB.
- Prisma 7 với `Unsupported("vector(1536)")`: `migrate dev` sinh SQL đúng, client bỏ qua cột khi đọc/ghi thường.
- Chất lượng `text-embedding-3-small` với tiếng Việt và giá trị τ hợp lý (C15).
- Đổi prompt chấm có làm lệch thang điểm so với các lần chấm cũ hay không (chỉ thấy khi chạy thật).
- Khoảng chi phí của script đo (ước tính vài USD với `gpt-6.1-sol` là ASSUMPTION, chưa đo token).
- Tiền đã nạp bên OpenAI dùng được cho API key (phần 0, C11 của spec phần 0).

## File dự định sửa

API: `app/cv-screenings/processors/cv-screenings.processor.ts`, `app/cv-screenings/cv-screenings.service.ts`,
`cv-screenings.controller.ts` (+ dto review), `app/cvs/processors/cv-parsing.processor.ts` (đưa job embed),
`app/skills/skills.service.ts` (đưa job embed), `app/interviews/session/interview-generation.processor.ts`,
`app/applications/application-export.service.ts` (CSV), `common/constants/gemini-api.ts` (`CV_SCREENING_PROMPT`,
`MOCK_INTERVIEW_GENERATE_PROMPT`), file mới `common/vector/*`, `app/cv-screenings/skill-matcher.ts`,
`anchor-retriever.ts`, `app/interviews/questions/*`, script backfill và script đo, cùng spec của chúng.
DB: `schema.prisma`, 3 migration, `libs/shared/types/src/lib/enums.ts`.
Web: màn chấm CV/Kanban/so sánh phía nhân sự, trang ứng viên xem kết quả, `(admin)/interview-topic-management`, Server
Actions tương ứng (tên file chốt khi lập plan).
Hạ tầng: 3 file compose, `.github/workflows/ci.yml` nếu có service DB.
Tài liệu: `docs/migration-roadmap.md` (dòng `EmbeddingService — Google text-embedding-004` đã lỗi thời so với phần 0).
