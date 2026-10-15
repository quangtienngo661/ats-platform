# GĐ2 SP2 — Chấm CV hàng loạt và xuất CSV: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recruiter đưa tối đa 50 đơn của một tin vào hàng đợi sàng lọc AI bằng một thao tác (có lý do cho từng đơn bị bỏ qua) và tải danh sách ứng viên của tin ra CSV mở được bằng Excel; điểm AI không bao giờ tự đổi trạng thái đơn.

**Architecture:** Hàm thuần `checkScreeningEligibility` là nguồn duy nhất cho điều kiện chấm, dùng chung giữa `triggerScreening` (đơn lẻ) và `BulkScreeningService` mới. Xuất CSV là `ApplicationExportService` mới cùng hàm thuần `toCsv`. Job BullMQ của bulk mang cờ `notify: false`. Web thêm ô chọn trên danh sách ứng viên của tin, thanh chấm hàng loạt, hộp thoại kết quả, nút xuất CSV, và tự tải lại khi có sự kiện socket sẵn có. Không có migration.

**Tech Stack:** NestJS 11, Prisma 7 + PostgreSQL 15, BullMQ (`@nestjs/bullmq`), `@nestjs/throttler` 6.5.0 (lưu trong Redis), Jest; Next.js 16.3.3 / React 19 server actions, axios 1.16.0, Vitest + Testing Library, Playwright.

**Spec:** [spec.md](spec.md) · quyết định: [decision.md](decision.md). Người thực thi đọc cả ba file; người thực thi **không thấy** cuộc trò chuyện đã tạo ra chúng, nên mọi quyết định nằm trong ba file này.

## Global Constraints

- **Nhánh và worktree:** thực thi trên `feat/gd2-sp2-bulk-screening`, cắt từ `origin/dev`, trong một git worktree riêng (người dùng tạo; người thực thi không tạo nhánh). Thứ tự merge của GĐ2: SP1 → SP2 → SP3.
- **Git:** không push, không merge, không rebase, không `git add -A`/`git add .`; chỉ `git add` đúng các file mà task liệt kê. Commit chỉ khi người dùng đã cho phép (`docs/tasks/gd2-parallel-execution/README.md` §4.2): khi được phép, Codex (do phiên `stage-2-sp2-impl` gọi) commit trên nhánh worktree theo đúng message ở bước "Commit" của task. Chưa được phép thì báo branch, `git status --short`, message và chờ duyệt. Dòng `Co-Authored-By` cuối message do người dùng chốt (README điều phối §4.2); không tự ghi tên model không tham gia.
- **Khả năng phải merge `dev` (đã có SP1) trước khi xong:** người thực thi **không** tự merge. Các file có khả năng xung đột với SP1: `applications.module.ts`, `applications.controller.ts` (cùng `applications.controller.spec.ts`, vì constructor của controller nhận thêm service), `applications.service.ts` (SP1 bỏ `private` ở `assertCanAccessApplication`, SP2 bỏ `private` ở `assertCanAccessDepartment`, hai hàm khác nhau, không cùng dòng), `CandidatesFilters.tsx`, `CandidateRow.tsx`, `servers/applications/applications.action.ts` (+ test), `apps/api/src/main.ts` (`VALIDATION_MESSAGES`, nếu SP1 cũng thêm khoá mảng), `libs/shared/types/src/lib/enums.ts`. Quy tắc giải khi người dùng merge: giữ cả hai phía; với state chọn ở danh sách, giữ bản của SP1 và đặt thanh của SP2 cạnh `CompareBar`.
- **State chọn dùng chung với SP1:** một `selectedIds: Set<string>` (các `applicationId`, chỉ trang hiện tại) nằm trong `CandidatesFilters`; `CandidateRow` có props `selected: boolean` và `onToggle: (applicationId: string) => void`; `CandidateRow` **không** có trần và không bao giờ khoá checkbox; mỗi thanh hành động tự đặt trần (SP1 `CompareBar` 2–4, SP2 thanh chấm 1–50).
- **Mở hàm kiểm quyền:** SP2 chỉ xoá từ khoá `private` của `ApplicationsService.assertCanAccessDepartment` (`applications.service.ts:147`), không đổi thân hàm. Không sửa thân `updateStatus`.
- **Migration và schema:** SP2 không có migration và không chạm `schema.prisma`. Nếu cuối cùng buộc phải có: DỪNG và báo trước; tên dự kiến `20261014500000_*`; với `schema.prisma`, chỉ thêm dòng ở **cuối** danh sách quan hệ của model.
- **Gemini:** key thật đã hết (`RESOURCE_EXHAUSTED`); test stack dùng `GOOGLE_API_KEY: local-verification-no-external-ai`. Mọi unit test mock `GeminiService` (hoặc không chạm processor thật). **Không kiểm được việc gọi Gemini thật**; trên test stack các job đã vào hàng đợi sẽ `failed` sau 3 lần BullMQ retry. Probe chỉ kiểm trạng thái ngay sau response, không chờ kết quả chấm.
- **Test stack:** `docker-compose.test.yml` (API `55000`, PostgreSQL `55432`, Redis `56379`) là một bộ duy nhất cho cả máy, SP1 và SP3 cũng dùng. Chỉ bật trong **Task 5b** (khung ngắn để A3–A5 lộ sớm, trước phần web) và **Task 11**. Mỗi task tự giữ khoá trước khi bật và luôn nhả khoá khi xong (xem Task 5b).
- **Giá trị cố định từ spec:** trần 50 đơn/request (`BULK_SCREENING_LIMIT = 50`); `MAX_SCREENING_RETRIES = 3`; rate limit 3 request/60 000 ms cho bulk; trần export 5000 dòng (`EXPORT_ROW_LIMIT = 5000`); múi giờ ngày nộp `Asia/Ho_Chi_Minh`; CSV UTF-8 có BOM, CRLF, mọi ô trong ngoặc kép.
- **Chuỗi:** thông báo cho người dùng bằng tiếng Việt, log bằng tiếng Anh. Controller trả dữ liệu thô (interceptor toàn cục tạo envelope), **trừ** route export trả qua `@Res()`.
- **Lệnh kiểm:** API `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="<mẫu>"` (spec phải nằm dưới `apps/api/src/app/**` hoặc `apps/api/src/common/**`, chỗ khác bị bỏ qua âm thầm), `rm -rf dist .nx/cache && npx nx build api`, `npx nx lint api`. Web `npm run test:web -- <đường dẫn>`, `npm run typecheck:web`, `npm run lint:web`.
- **Khi kết quả kiểm chứng khác giả định:** DỪNG, ghi kết quả vào `docs/tasks/gd2-sp2-bulk-screening/results/` và báo. Không tự đổi thiết kế. Sửa một lỗi cài đặt (code sai so với spec) thì được, theo thứ tự test đỏ trước, sửa sau.

## Đã kiểm chứng khi viết plan (2026-10-13, đọc mã nguồn đã cài trên `dev` tại `93ad69b`)

| # | Điều | Nguồn | Hệ quả cho plan |
|---|---|---|---|
| K1 | `ThrottlerModule` có `@Global()` | `node_modules/@nestjs/throttler/dist/throttler.module.js:61` (v6.5.0) | `ThrottlerGuard` dùng được trong `ApplicationsController` mà không import module |
| K2 | Tracker mặc định là `req.ip`; `@Throttle` nhận `getTracker` theo từng throttler | `throttler.guard.js:141-142`, `throttler.decorator.d.ts:6` | Bulk đếm theo `req.user.userId` (fallback `req.ip`), vì sau Nginx nhiều recruiter có thể chung một IP |
| K3 | Metadata của `@Throttle`: khoá `'THROTTLER:LIMIT' + name`, `'THROTTLER:TTL' + name`, `'THROTTLER:TRACKER' + name`; throttler của module tên `default` | `throttler.constants.js:4-6`, `throttler.decorator.js:9-12`, `auth.module.ts` | Test controller đọc đúng các khoá này |
| K4 | axios 1.16.0 (adapter Node) **luôn bỏ BOM** khi `responseType` không phải `arraybuffer` | `node_modules/axios/lib/adapters/http.js:1019-1022` | Web luôn tự thêm BOM khi dựng `Blob` |
| K5 | `router.refresh()` giữ state client (`useState`) | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md:46` (Next 16.3.3) | Tải lại sau sự kiện socket không xoá lựa chọn |
| K6 | `serverActions.bodySizeLimit` chỉ áp lên **request body** | `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:27-45` | Không có giới hạn response được ghi; xem A2 |
| K7 | `TransformInterceptor` bọc **mọi** giá trị handler trả về | `apps/api/src/common/interceptors/transform.interceptor.ts` | Export trả qua `@Res()` |
| K8 | Test hiện có khớp **chính xác** payload `queue.add('process-cv-screening', { screeningId, cvId, applicationId, configId })` | `cv-screenings.service.spec.ts` | Chỉ thêm khoá `notify` khi bằng `false` |
| K9 | `lib/http.ts` trả thẳng `response.data` (thân response), nên với `responseType: 'text'`, kết quả `http.get` là chuỗi CSV | `apps/web/src/lib/http.ts` | Server action export nhận chuỗi, không có header |

## ASSUMPTION (chưa kiểm được lúc viết plan)

| # | Giả định | Kiểm ở | Nếu sai |
|---|---|---|---|
| A1 | Excel trên máy đặt vùng Việt Nam mở CSV phân tách bằng `,` đúng cột | không kiểm được tự động; người dùng mở file của Task 11 bằng Excel | ghi vào README, **không** DỪNG; người dùng quyết |
| A2 | Server action trả được chuỗi khoảng 1–2 MB (5000 dòng) | Task 1 đọc tài liệu; Task 11 đo kích thước CSV thật của fixture | tài liệu nêu giới hạn response < 3 MB → DỪNG |
| A3 | Xử lý tuần tự 50 đơn mất ≤ 15 s trên test stack | Task 5b, probe P3 | > 15 s → DỪNG và báo số đo |
| A4 | Bộ lọc quan hệ 1–1 của Prisma (`screening: { is: null }` / `{ is: { … } }`) chọn đúng đơn trên PostgreSQL thật | Task 5b, probe P3 (unit test mock Prisma nên không thấy) | P3 FAIL → DỪNG và báo; khi được cho tiếp thì sửa query (test đỏ trước), không đổi thiết kế |
| A5 | Guard ở cấp class (`AuthGuard('jwt')`) chạy trước `ThrottlerGuard` ở cấp method, nên `req.user` có khi đếm | Task 5b, probe P5 | recruiter thứ hai cũng nhận 429 → DỪNG |

## Review Focus

1. Đi sau proxy, mọi recruiter chung một IP: một người bấm 3 lần không được chặn người khác. Tracker theo `userId`; test ở Task 5 (hàm tracker) và Task 5b (P5).
2. Ô CSV lấy từ Gemini hoặc tên ứng viên bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR, LF, hoặc chứa dấu phẩy, ngoặc kép, xuống dòng: vẫn là một ô văn bản, Excel không chạy công thức (E9, E10). Test ở Task 6.
3. Bấm "Bắt đầu chấm" hai lần liên tiếp: chỉ một request đi. Test ở Task 9.
4. `applicationIds` chứa id của tin khác hoặc tổ chức khác: trả `NOT_IN_JOB`, giống id không tồn tại, không lộ đơn có tồn tại hay không (E7). Test ở Task 4.
5. Chế độ tự chọn trên DB thật: đơn `completed`, đơn `failed` đã 3 lần và đơn `applied` (khi cờ tắt) không bị lấy; lấy đúng 50 đơn nộp sớm nhất. Unit test chỉ kiểm tham số query (Task 4); probe P3 kiểm trên PostgreSQL (Task 5b).

## File Structure

| File | Trách nhiệm |
|---|---|
| `libs/shared/types/src/lib/enums.ts` | `ScreeningSkipReason` (dùng chung API + web) |
| `libs/shared/types/src/lib/interfaces/applications/applications.interface.ts` | `IBulkScreeningResult` |
| `apps/api/src/app/applications/screening-eligibility.ts` | `checkScreeningEligibility`, `MAX_SCREENING_RETRIES` |
| `apps/api/src/app/applications/bulk-screening.service.ts` | luồng chấm hàng loạt |
| `apps/api/src/app/applications/application-export.service.ts` | dựng dòng CSV của một tin |
| `apps/api/src/app/applications/dtos/bulk-screening.dto.ts` | body của bulk |
| `apps/api/src/common/utils/csv.util.ts` | `toCsv` |
| `apps/api/src/app/cv-screenings/{cv-screenings.service.ts,processors/cv-screenings.processor.ts}` | cờ `notify` |
| `apps/web/src/types/constants/screening-skip-reasons.ts` | nhãn tiếng Việt của mã lý do |
| `apps/web/src/lib/download-csv.ts` | dựng `Blob` có BOM và tải xuống |
| `apps/web/src/components/candidates/ui/{BulkScreeningBar,BulkScreeningDialog,ExportCsvButton}.tsx` | UI |
| `apps/web/src/components/candidates/useScreeningLiveRefresh.ts` | nghe `cv-screening:completed`, tải lại |
| `apps/web/e2e/gd2-bulk-screening.e2e.ts`, `apps/web/e2e/support/gd2-bulk-fixtures.mjs` | hành trình thật (file fixture riêng để không đụng `gd2-fixtures.mjs` mà SP1 sửa) |
| `docs/tasks/gd2-sp2-bulk-screening/results/` | kết quả kiểm chứng, probe, log, `README.md` |

---

### Task 0: Chuẩn bị worktree

**Files:** không có.

**Interfaces:** Produces: worktree trên `feat/gd2-sp2-bulk-screening` có `node_modules` và Prisma client.

- [ ] **Step 1:** `git branch --show-current` in `feat/gd2-sp2-bulk-screening`; `git status --short` rỗng. Không đúng → DỪNG và báo.
- [ ] **Step 2:** `npm ci`, rồi `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`. Expected: cả hai exit 0. Không dùng `--config libs/backend/database/prisma.config.ts`: file đó gọi `env("DATABASE_URL")`, worktree mới không có `.env`, nên lệnh lỗi `PrismaConfigEnvError` (runbook của brain, mục "After a schema change"). Dạng `--schema` chạy offline, giống bước "Generate Prisma Client" trong `.github/workflows/ci.yml`.
- [ ] **Step 3:** Chạy nền: `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="applications|cv-screenings"` và `npm run test:web -- src/servers/applications src/components/candidates`. Expected: exit 0. Đỏ trước khi sửa gì → DỪNG và báo (lỗi sẵn có, không tự sửa).

---

### Task 1: Kiểm chứng sớm (không cần test stack)

**Files:** Create `docs/tasks/gd2-sp2-bulk-screening/results/early-checks.md`.

**Interfaces:** Produces: bảng K1–K6 chạy lại trong worktree, mỗi dòng `PASS`/`FAIL` kèm dòng trích. Các task sau dựa vào kết quả này.

- [ ] **Step 1:** Trong worktree, xác nhận lại K1–K6 bằng `grep -n` trên đúng các file ở bảng *Đã kiểm chứng*. Tiêu chí PASS: K1 có `common_1.Global` trong `throttler.module.js`; K2 `getTracker(req)` trả `req.ip` và `throttler.decorator.d.ts` có `getTracker?`; K3 ba hằng số đúng chuỗi; K4 `stripBOM` nằm trong nhánh `responseType !== 'arraybuffer'`; K5 câu "without losing unaffected client-side React (e.g. `useState`)" có trong `use-router.md`; K6 `bodySizeLimit` nói về "request body".
- [ ] **Step 2 (A2):** `grep -rn -i "response" node_modules/next/dist/docs/01-app/02-guides/server-actions.md node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`. PASS: không có giới hạn kích thước response nào nhỏ hơn 3 MB. Có → DỪNG.
- [ ] **Step 3:** Ghi bảng kết quả vào `early-checks.md`. Bất kỳ dòng nào FAIL → DỪNG và báo, không sang Task 2.
- [ ] **Step 4: Commit** `docs(tasks): record the sp2 early checks`

---

### Task 2: Điều kiện chấm dùng chung và mã lý do

**Files:** Modify `libs/shared/types/src/lib/enums.ts` (thêm ở cuối file), `libs/shared/types/src/lib/interfaces/applications/applications.interface.ts` (thêm ở cuối), `apps/api/src/app/applications/applications.service.ts` (`triggerScreening` và hằng `MAX_SCREENING_RETRIES` ở dòng 61-66); Create `apps/api/src/app/applications/screening-eligibility.ts`, `screening-eligibility.spec.ts`; Test `applications.service.spec.ts` (thêm).

**Interfaces:** Produces:
- `ScreeningSkipReason` (khuôn `as const` + type như `UserRole`): `NOT_IN_JOB`, `APPLIED_NOT_MOVED`, `FINAL_STATUS`, `IN_QUEUE`, `ALREADY_SCREENED`, `RETRY_LIMIT`, `STATUS_CHANGED`, `ENQUEUE_FAILED` (giá trị = tên).
- `IBulkScreeningResult { queued: { applicationId: string; movedToScreening: boolean }[]; skipped: { applicationId: string; reason: ScreeningSkipReason; movedToScreening: boolean }[]; remaining: number }`.
- `export const MAX_SCREENING_RETRIES = 3;` (chuyển từ `applications.service.ts` sang file mới; service import lại).
- `export interface ScreeningSubject { status: ApplicationStatus; screening: { status: ScreeningStatus; retryCount?: number } | null }`
- `export type EligibilityVerdict = { eligible: true; needsMove: boolean } | { eligible: false; reason: ScreeningSkipReason; httpStatus: 400 | 409; message: string }`
- `export function checkScreeningEligibility(subject: ScreeningSubject, options: { allowApplied: boolean }): EligibilityVerdict`. Thứ tự kiểm giữ đúng như `triggerScreening` hiện tại: `applied` (khi `!allowApplied`) → trạng thái cuối → `pending` → `processing` → `completed` → `failed` với `retryCount ≥ 3`. Đơn `applied` có cờ vẫn phải qua các kiểm screening; `needsMove = status === applied`.

- [ ] **Step 1: Test đỏ** `screening-eligibility.spec.ts`, một `it.each` với các dòng (trạng thái, screening, `allowApplied` → kết quả; message phải khớp **chính xác**):
  - `applied`, `null`, `false` → `APPLIED_NOT_MOVED`, 400, `Hãy chuyển đơn ứng tuyển sang trạng thái 'screening' trước khi chạy sàng lọc AI`
  - `applied`, `null`, `true` → `{ eligible: true, needsMove: true }`
  - `applied`, `completed`, `true` → `ALREADY_SCREENED`, 409
  - `hired` / `rejected` / `cancelled`, `null` → `FINAL_STATUS`, 400, `Không thể chạy sàng lọc AI khi đơn ứng tuyển đang ở trạng thái '<status>'`
  - `screening`, `pending` → `IN_QUEUE`, 409, `Sàng lọc AI đã được đưa vào hàng đợi`
  - `screening`, `processing` → `IN_QUEUE`, 409, `Sàng lọc AI đang được xử lý`
  - `interview`, `completed` → `ALREADY_SCREENED`, 409, `Sàng lọc AI đã hoàn tất. Vui lòng xem kết quả trong chi tiết đơn ứng tuyển`
  - `offer`, `failed` `retryCount: 3` → `RETRY_LIMIT`, 409, `Sàng lọc AI đã thất bại 3 lần. Vui lòng kiểm tra lại CV hoặc liên hệ quản trị viên`
  - `screening`, `failed` `retryCount: 2` → `{ eligible: true, needsMove: false }`
  - `screening`, `null` → `{ eligible: true, needsMove: false }`

  Trong `applications.service.spec.ts` thêm `it.each` "triggerScreening keeps its message and HTTP class for <reason>" cho 6 verdict không hợp lệ: assert `BadRequestException` (400) hoặc `ConflictException` (409) và đúng message (C4).
- [ ] **Step 2:** Run `--testPathPatterns="screening-eligibility|applications.service"` → FAIL (file chưa có).
- [ ] **Step 3:** Cài enum, interface, `screening-eligibility.ts`; trong `triggerScreening`, thay chuỗi `if` bằng `checkScreeningEligibility(application, { allowApplied: false })` rồi ném `BadRequestException(message)` (400) hoặc `ConflictException(message)` (409). Không đổi phần còn lại của hàm.
- [ ] **Step 4:** Run lại → PASS, mọi test cũ của `triggerScreening` không sửa vẫn xanh; `npx tsc --build libs/shared/types` và `rm -rf dist .nx/cache && npx nx build api` exit 0.
- [ ] **Step 5: Commit** `test(api): pin the screening eligibility rules` (spec mới + test service) rồi `refactor(api): share the screening eligibility rules`

---

### Task 3: Cờ `notify` cho job sàng lọc

**Files:** Modify `apps/api/src/app/cv-screenings/cv-screenings.service.ts` (`createScreeningRecord`), `processors/cv-screenings.processor.ts`; Test `cv-screenings.service.spec.ts`, `processors/cv-screenings.processor.spec.ts`.

**Interfaces:** Produces:
- `ProcessCvScreeningJobData` thêm `notify?: boolean`.
- `createScreeningRecord(applicationId: string, cvId: string, configId?: string, options: { notify?: boolean } = {})`. Payload job chỉ có thêm `notify: false` khi `options.notify === false`; mọi trường hợp khác payload giữ nguyên như cũ (K8).
- Processor chỉ gọi `createNotificationSafe` khi `job.data.notify !== false`; luôn gọi `socketIoService.handleEmit('cv-screening:completed', …)`.

- [ ] **Step 1: Test đỏ:** service `it('marks a bulk job as silent')`: gọi với `{ notify: false }`, assert `queue.add` nhận `{ screeningId, cvId, applicationId, configId, notify: false }`. Test cũ `creates or resets a screening record and queues processing` giữ nguyên làm control. Processor (theo khuôn `buildJob`/`primeContext`, Gemini mock resolve kết quả hợp lệ): `it('skips the in-app notification for a silent job but still emits the socket event')`; `it('still notifies for a job without the flag')`.
- [ ] **Step 2:** Run `--testPathPatterns="cv-screenings"` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS; `rm -rf dist .nx/cache && npx nx build api` exit 0.
- [ ] **Step 5: Commit** `test(api): pin silent screening jobs` rồi `feat(api): let a screening job skip the in-app notification`

---

### Task 4: `BulkScreeningService`

**Files:** Create `apps/api/src/app/applications/bulk-screening.service.ts`, `bulk-screening.service.spec.ts`, `dtos/bulk-screening.dto.ts` (chỉ class, validator ở Task 5); Modify `applications.service.ts` (chỉ xoá `private` của `assertCanAccessDepartment`).

**Interfaces:** Consumes: Task 2 (`checkScreeningEligibility`, `MAX_SCREENING_RETRIES`, `ScreeningSkipReason`, `IBulkScreeningResult`), Task 3 (`createScreeningRecord(…, { notify: false })`), `CvScreeningsService.getActiveConfig(organizationId, configId?)`, `ApplicationsService.updateStatus(id, caller, dto)`. Produces:
- `export const BULK_SCREENING_LIMIT = 50;`
- `export class BulkScreeningDto { applicationIds?: string[]; moveAppliedToScreening?: boolean; configId?: string }`
- `BulkScreeningService.bulkScreen(caller: TenantCaller, jobId: string, dto: BulkScreeningDto): Promise<IBulkScreeningResult>`. Constructor `(prisma: PrismaService, applicationsService: ApplicationsService, cvScreeningsService: CvScreeningsService)`.
- Trình tự (spec §API — chấm hàng loạt): `jobPosting.findUnique({ where: { jobId }, select: { jobId, departmentId, organizationId } })` → 404 `'Không tìm thấy tin tuyển dụng'` → `assertCanAccessDepartment` → `getActiveConfig(job.organizationId, dto.configId)` (lỗi 404 đi thẳng ra) → chọn đơn → xử lý **tuần tự** từng đơn. Select đơn: `{ applicationId, status, cvId, appliedAt, screening: { select: { status, retryCount } } }`.
- Chế độ theo danh sách: `findMany({ where: { applicationId: { in: ids }, jobId } })`; kết quả theo **thứ tự của `applicationIds`**; id không có trong kết quả → `NOT_IN_JOB`.
- Chế độ tự chọn: `where: { jobId, status: { in: allowApplied ? [applied, screening, interview, offer] : [screening, interview, offer] }, OR: [{ screening: { is: null } }, { screening: { is: { status: failed, retryCount: { lt: MAX_SCREENING_RETRIES } } } }] }`, `orderBy: { appliedAt: 'asc' }`; lọc lại bằng `checkScreeningEligibility`; lấy 50 đơn đầu; `remaining = max(0, số đủ điều kiện − 50)`.
- Mỗi đơn: verdict không hợp lệ → `skipped` (reason, `movedToScreening: false`); `needsMove` → `updateStatus(id, caller, { status: ApplicationStatus.screening })`, lỗi → `STATUS_CHANGED`; rồi `createScreeningRecord(id, cvId, config.configId, { notify: false })`, lỗi → `ENQUEUE_FAILED` với `movedToScreening` theo thực tế, kèm `Logger.warn` bằng tiếng Anh.

- [ ] **Step 1: Test đỏ** (`createPrismaMock`, `callerOf`; `applicationsService` và `cvScreeningsService` là object `jest.fn()`):
  - `queues three eligible applications in the order given` (C1): `createScreeningRecord` gọi với `(id, cvId, 'cfg-1', { notify: false })` ba lần; kết quả `{ queued: [3 phần tử, movedToScreening false], skipped: [], remaining: 0 }`.
  - `reports an id of another job or organization exactly like an unknown id` (E7, Review Focus 4): assert `findMany` có `jobId` trong `where`, cả hai id đều `NOT_IN_JOB`.
  - `skips an applied application while the flag is off` và `moves it with updateStatus, then queues it, when the flag is on` (C6): assert thứ tự gọi bằng `mock.invocationCallOrder`.
  - `it.each` `FINAL_STATUS`, `IN_QUEUE`, `ALREADY_SCREENED`, `RETRY_LIMIT` → đúng mã trong `skipped`, không enqueue.
  - `reports STATUS_CHANGED when the move is refused and queues nothing for it` (E1).
  - `reports ENQUEUE_FAILED with movedToScreening true when queueing fails after the move` (E2).
  - `stops with the 404 of the missing AI config before reading or changing any application` (C7): `application.findMany`, `updateStatus`, `createScreeningRecord` không được gọi.
  - `answers 404 for an unknown job and lets the 403 of the access check through` (C8).
  - `auto mode takes the 50 oldest eligible and counts the rest as remaining` (C5): mock 60 đơn → 50 `queued` đúng 50 id đầu, `remaining: 10`; assert `orderBy: { appliedAt: 'asc' }` và mệnh đề `OR` đúng như Interfaces.
  - `auto mode only considers applied applications when the flag is on`.
  - `auto mode with nothing eligible returns empty lists` (E6).
- [ ] **Step 2:** Run `--testPathPatterns="bulk-screening"` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS; `--testPathPatterns="applications.service"` vẫn xanh; `rm -rf dist .nx/cache && npx nx build api` exit 0.
- [ ] **Step 5: Commit** `test(api): add the bulk screening rules` rồi `feat(api): screen up to 50 applications of a job in one call`

---

### Task 5: Route bulk, validation và rate limit

**Files:** Modify `dtos/bulk-screening.dto.ts` (validator), `applications.controller.ts`, `applications.module.ts`, `apps/api/src/main.ts` (`VALIDATION_MESSAGES`); Create `dtos/bulk-screening.dto.spec.ts`; Test `applications.controller.spec.ts`.

**Interfaces:** Consumes: Task 4. Produces:
- DTO: `applicationIds` `@IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ArrayUnique() @IsUUID('all', { each: true })`; `moveAppliedToScreening` `@IsOptional() @IsBoolean()`; `configId` `@IsOptional() @IsUUID()`.
- `VALIDATION_MESSAGES` thêm (bỏ qua khoá nào đã có, vì SP1 có thể đã thêm): `isArray: 'phải là mảng'`, `arrayMinSize: 'chưa đủ số phần tử tối thiểu'`, `arrayMaxSize: 'vượt quá số phần tử tối đa cho phép'`, `arrayUnique: 'không được chứa phần tử trùng nhau'`.
- `export const bulkScreeningTracker = (req: { user?: { userId?: string }; ip?: string }) => req.user?.userId ?? req.ip ?? ''` (export để test).
- Handler `bulkScreening(@Param('jobId') jobId, @CurrentCaller() caller, @Body() dto: BulkScreeningDto)` → `bulkScreeningService.bulkScreen(caller, jobId, dto)`; decorator: `@Roles(UserRole.recruiter, UserRole.admin)`, `@Post('job/:jobId/bulk-screening')`, `@HttpCode(200)`, `@UseGuards(ThrottlerGuard)`, `@Throttle({ default: { limit: 3, ttl: 60000, getTracker: bulkScreeningTracker } })`, `@ApiOperation` tiếng Việt. Constructor controller nhận thêm `BulkScreeningService`; module thêm provider `BulkScreeningService`.

- [ ] **Step 1: Test đỏ:** DTO (`plainToInstance` + `validate`): `accepts an empty body (auto mode)`; `accepts 50 distinct UUIDs`; `rejects [], 51 ids, a duplicate and a non-UUID` (assert tên constraint `arrayMinSize`, `arrayMaxSize`, `arrayUnique`, `isUuid`); `rejects a non-boolean flag and a non-UUID configId`. Controller: `bulkScreening delegates to the service with caller, jobId and body`; `the bulk route answers 200, allows recruiter and admin, and is throttled 3 per 60000 ms` (đọc `HTTP_CODE_METADATA` = 200 và `GUARDS_METADATA` chứa `ThrottlerGuard`, hai hằng số này lấy từ `@nestjs/common/constants`; `ROLES_KEY` từ `roles.decorator.ts`; `'THROTTLER:LIMITdefault'` = 3, `'THROTTLER:TTLdefault'` = 60000); `the tracker counts per user and falls back to the IP` (`{ user: { userId: 'u1' }, ip: '10.0.0.1' }` → `'u1'`; `{ ip: '10.0.0.1' }` → `'10.0.0.1'`) (Review Focus 1).
- [ ] **Step 2:** Run `--testPathPatterns="bulk-screening.dto|applications.controller"` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS; `rm -rf dist .nx/cache && npx nx build api`, `npx nx lint api` exit 0.
- [ ] **Step 5: Commit** `test(api): pin the bulk screening route` rồi `feat(api): expose bulk screening with a per-user rate limit`

---

### Task 5b: Probe chấm hàng loạt trên PostgreSQL thật (khung test stack ngắn)

**Files:** Create `apps/web/e2e/support/gd2-bulk-fixtures.mjs`, `docs/tasks/gd2-sp2-bulk-screening/results/probe-bulk-screening.mjs`, `results/probe-bulk-screening.log`.

**Interfaces:** Consumes: route bulk của Task 5; `withDatabase` từ `apps/web/e2e/support/gd1-fixtures.mjs`; khuôn fixture và cleanup của `gd2-fixtures.mjs` (không sửa file đó); khuôn đăng nhập API của `check-runtime.mjs` (`POST /auth/login` → `data.accessToken`). Produces: `createGd2BulkFixtures(apiUrl)` và `cleanupGd2BulkFixtures(fixture)` (Task 11 dùng lại), bằng chứng C1, C5, C6, C10 và kết quả A3, A4, A5. Mục đích: A3–A5 lộ ra **trước** khi làm web.

- [ ] **Step 1: Giữ khoá test stack.** Bash: `mkdir "$LOCALAPPDATA/ats-e2e.lock"` (PowerShell: `New-Item -ItemType Directory "$env:LOCALAPPDATA\ats-e2e.lock"`, lệnh này lỗi nếu khoá đã có). Thất bại → DỪNG và báo; **không** xoá khoá của người khác. Từ đây đến Step 6, mọi lỗi đều phải đi qua Step 6.
- [ ] **Step 2:** `docker compose -f docker-compose.test.yml up -d --build --wait`, rồi `node apps/web/e2e/support/prepare-local.mjs`. Expected: exit 0, `GET http://localhost:55000/api/health` trả `up` (như `gd2-fixtures.mjs` đang gọi).
- [ ] **Step 3: Fixture** `createGd2BulkFixtures(apiUrl)` trong `gd2-bulk-fixtures.mjs` (chỉ chạy với cổng `55000`, như `createGd2ScheduleFixtures`): một tổ chức, một phòng ban, **hai** recruiter cùng phòng ban, một `ai_configs` `is_default = true` của tổ chức; tin A gồm 60 đơn `screening` chưa có screening (`applied_at` tăng dần, cách nhau 1 phút), 1 đơn `applied`, 1 đơn `interview` có `cv_screenings` `completed` (có điểm, `matched_skills`, `missing_skills`), 1 đơn `cancelled`; tin B gồm 1 đơn `applied` và 1 đơn có screening `completed` (dùng ở E2E của Task 11). Mỗi ứng viên có user, candidate, cv `completed`. `cleanupGd2BulkFixtures(fixture)` xoá theo `organization_id` như `cleanupGd2Fixtures`.
- [ ] **Step 4: Probe** `probe-bulk-screening.mjs`: tự gọi `createGd2BulkFixtures` ở đầu (in `organization_id` của fixture ở dòng đầu log) và `cleanupGd2BulkFixtures` trong `finally`; mỗi dòng in `PASS`/`FAIL`, có lỗi thì exit 1, ghi log `results/probe-bulk-screening.log`. Recruiter 1 trên tin A, đúng thứ tự:
  - **P3 (C5, A3, A4, Review Focus 5):** `POST /applications/job/A/bulk-screening` `{}` → 200, `queued` = 50 id nộp sớm nhất trong 60 đơn `screening`, `remaining` 10, không có đơn `applied`/`interview`/`cancelled`; đo thời gian. Sai tập đơn → FAIL (A4). > 15 000 ms → FAIL (A3).
  - **P1 (C1):** gửi 3 id trong 10 đơn còn lại → `queued` 3; DB có 3 dòng `cv_screenings` với `config_id` = cấu hình mặc định.
  - **P2 (C6):** `{ applicationIds: [đơn applied], moveAppliedToScreening: true }` → `movedToScreening: true`; `applications.status = 'screening'`; đúng một dòng `application_history` `applied → screening` có `changed_by` = recruiter 1.
  - **P4 (C10):** request thứ 4 của recruiter 1 trong 60 s → 429.
  - **P5 (A5, Review Focus 1):** recruiter 2 gọi ngay sau đó với 1 id còn lại → 200.
- [ ] **Step 5:** P3 hoặc P5 FAIL → sau Step 6 thì DỪNG và báo kèm log; không tự sửa query hay guard trong task này. P1, P2 hoặc P4 FAIL → cũng DỪNG và báo.
- [ ] **Step 6: Luôn chạy, kể cả khi bước trước đỏ:** nếu probe dừng trước `finally` thì xoá fixture còn sót theo `organization_id` đã in trong log; `docker compose -f docker-compose.test.yml stop`; `rmdir "$LOCALAPPDATA/ats-e2e.lock"` (PowerShell: `Remove-Item "$env:LOCALAPPDATA\ats-e2e.lock"`).
- [ ] **Step 7: Commit** (chỉ khi P1–P5 PASS) `test(api): probe bulk screening on the real database` (fixture, probe, log)

---

### Task 6: `toCsv`

**Files:** Create `apps/api/src/common/utils/csv.util.ts`, `csv.util.spec.ts`.

**Interfaces:** Produces: `export function toCsv(headers: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string`. File = `'﻿'` + các bản ghi, mỗi bản ghi kết thúc bằng `'\r\n'`. Ô: `null`/`undefined` → `""`; còn lại `String(value)`; ký tự đầu thuộc `= + - @ \t \r \n` → thêm `'\t'` ở đầu; nhân đôi `"`; bọc trong `"…"` (OWASP, spec R11).

- [ ] **Step 1: Test đỏ:** `starts with a UTF-8 BOM and ends every record with CRLF`; `quotes every cell and doubles inner quotes` (`Nguyễn "Tí"` → `"Nguyễn ""Tí"""`); `keeps a comma and a line break inside one cell` (E9); `it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '\rx', '\nx'])('neutralises %j with a leading tab inside the quotes')` (C12, E10, Review Focus 2), ví dụ `=1+1` → `"\t=1+1"`; `writes null and undefined as empty cells`; `keeps Vietnamese text unchanged`.
- [ ] **Step 2:** Run `--testPathPatterns="csv.util"` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `test(api): pin the csv format` rồi `feat(api): add a csv writer with formula neutralisation`

---

### Task 7: Xuất CSV của một tin

**Files:** Create `apps/api/src/app/applications/application-export.service.ts`, `application-export.service.spec.ts`; Modify `applications.controller.ts`, `applications.module.ts`; Test `applications.controller.spec.ts`.

**Interfaces:** Consumes: Task 6, `assertCanAccessDepartment` (Task 4). Produces:
- `export const EXPORT_ROW_LIMIT = 5000;` `export const EXPORT_HEADERS = ['Mã đơn', 'Họ tên', 'Trạng thái', 'Ngày nộp', 'Chức danh hiện tại', 'Số năm kinh nghiệm', 'Trạng thái sàng lọc', 'Điểm tổng (gợi ý AI)', 'Điểm kỹ năng', 'Điểm kinh nghiệm', 'Điểm học vấn', 'Gợi ý AI', 'Kỹ năng khớp', 'Kỹ năng thiếu'] as const;`
- `ApplicationExportService.exportJobCsv(caller: TenantCaller, jobId: string): Promise<{ filename: string; content: string }>`; constructor `(prisma: PrismaService, applicationsService: ApplicationsService)`.
- Trình tự: tìm tin (404 `'Không tìm thấy tin tuyển dụng'`) → `assertCanAccessDepartment` → `count({ where: { jobId, status: { not: cancelled } } })` > 5000 → `BadRequestException('Tin có quá nhiều đơn để xuất CSV (tối đa 5000)')` → `findMany` cùng `where`, `orderBy: { appliedAt: 'desc' }`, **`select`** đúng: `applicationId, status, appliedAt, candidate: { select: { currentTitle, yearsOfExperience, user: { select: { fullName } } } }, screening: { select: { status, overallScore, skillsScore, experienceScore, educationScore, aiRecommendation, matchedSkills, missingSkills } }`.
- Nhãn: trạng thái `applied` Mới · `screening` Sàng lọc · `interview` Phỏng vấn · `offer` Offer · `hired` Đã tuyển · `rejected` Từ chối; sàng lọc: không có → Chưa chấm · `pending` Đang chờ · `processing` Đang xử lý · `completed` Hoàn tất · `failed` Lỗi; gợi ý: `interview` Nên phỏng vấn · `reject` Không phù hợp. Điểm `Number(x).toFixed(1)`; ngày `yyyy-mm-dd HH:mm` theo `Asia/Ho_Chi_Minh`; kỹ năng khớp = `matchedSkills.hardSkills`, kỹ năng thiếu = `missingSkills`, nối bằng `'; '`, sai dạng thì để trống.
- `filename = \`ung-vien-${jobId.slice(0, 8)}-${yyyymmdd theo Asia/Ho_Chi_Minh}.csv\``.
- Route `@Roles(UserRole.recruiter, UserRole.admin) @Get('job/:jobId/export') exportJobCsv(@Param('jobId') jobId, @CurrentCaller() caller, @Res() res: Response): Promise<void>`: `res.setHeader('Content-Type', 'text/csv; charset=utf-8')`, `res.setHeader('Content-Disposition', \`attachment; filename="${filename}"\`)`, `res.send(content)`.

- [ ] **Step 1: Test đỏ:** `writes EXPORT_HEADERS as the first record`; `selects no contact field at any depth` (assert `JSON.stringify(findMany.mock.calls[0][0])` không chứa `email`, `phoneNumber`, `include`) (C11); `excludes cancelled and orders newest first`; `maps labels, Vietnam time, scores and skills` (`appliedAt` `2026-10-13T02:05:00.000Z` → `2026-10-13 09:05`; `overallScore` 82.5 → `82.5`, `skillsScore` 80 → `80.0`; `interview` → `Nên phỏng vấn`; `{ hardSkills: ['NestJS', 'SQL'] }` → `NestJS; SQL`; `['Docker']` → `Docker`); `leaves the AI columns empty and says Chưa chấm without a screening` (E11); `writes only the header record for a job without applications` (E8); `refuses more than 5000 with 400 before reading rows` (C13); `answers 404 for an unknown job and lets the 403 through` (C8); `names the file from the job id and the Vietnam date` (fake timer `2026-10-13T20:00:00.000Z` → `ung-vien-<8 ký tự>-20261014.csv`). Controller: `exportJobCsv sets text/csv and an attachment header and sends the content` (res giả có `setHeader`, `send` là `jest.fn()`).
- [ ] **Step 2:** Run `--testPathPatterns="application-export|applications.controller"` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS; `rm -rf dist .nx/cache && npx nx build api`, `npx nx lint api` exit 0.
- [ ] **Step 5: Commit** `test(api): add the csv export rules` rồi `feat(api): export the candidates of a job as csv`

---

### Task 8: Nhãn lý do và server actions (web)

**Files:** Create `apps/web/src/types/constants/screening-skip-reasons.ts`, `screening-skip-reasons.test.ts`; Modify `apps/web/src/servers/applications/applications.action.ts`, `applications.action.test.ts`.

**Interfaces:** Consumes: `ScreeningSkipReason`, `IBulkScreeningResult` từ `@ats-platform/types`. Produces:
- `SCREENING_SKIP_REASON_LABELS: Record<ScreeningSkipReason, string>`: `NOT_IN_JOB` Không thuộc tin này · `APPLIED_NOT_MOVED` Đơn đang ở 'Mới', chưa đồng ý chuyển sang 'Sàng lọc' · `FINAL_STATUS` Đơn đã kết thúc (đã tuyển, từ chối hoặc đã hủy) · `IN_QUEUE` Đang chờ hoặc đang chấm · `ALREADY_SCREENED` Đã có kết quả sàng lọc · `RETRY_LIMIT` Đã thất bại 3 lần · `STATUS_CHANGED` Trạng thái vừa bị người khác thay đổi · `ENQUEUE_FAILED` Không đưa được vào hàng đợi.
- `export type BulkScreeningActionState = { success: boolean; message: string; data?: IBulkScreeningResult }`; `bulkScreenApplicationsAction(jobId: string, input: { applicationIds?: string[]; moveAppliedToScreening: boolean; configId?: string }): Promise<BulkScreeningActionState>`: `http.post(\`/applications/job/${jobId}/bulk-screening\`, body)`, trong đó body chỉ có `applicationIds`/`configId` khi được truyền; thành công → `revalidatePath(\`/jobs/${jobId}/candidates\`)`, message `Đã đưa ${queued.length} đơn vào hàng đợi`; 429 → `Bạn vừa gửi quá nhiều yêu cầu chấm hàng loạt. Vui lòng thử lại sau một phút.`; lỗi khác → `actionErrorMessage(err, 'Chấm CV hàng loạt thất bại')`.
- `export type ExportCsvActionState = { success: true; filename: string; csv: string } | { success: false; message: string }`; `exportCandidatesCsvAction(jobId: string): Promise<ExportCsvActionState>`: `http.get(\`/applications/job/${jobId}/export\`, { responseType: 'text' })` trả thẳng chuỗi (K9); `filename` dựng theo cùng quy tắc với API (`ung-vien-<8 ký tự>-<yyyymmdd Asia/Ho_Chi_Minh>.csv`). Lỗi: `response.data` có thể là object hoặc chuỗi JSON (vì `responseType: 'text'`) → lấy `message` từ cả hai dạng, mặc định `Xuất CSV thất bại`; vẫn gọi `unstable_rethrow` như `actionErrorMessage`.

- [ ] **Step 1: Test đỏ** (đưa `post` vào `vi.hoisted` cạnh `get`): `every ScreeningSkipReason has a Vietnamese label`; `bulkScreenApplicationsAction posts the ids, the flag and the config`; `sends no applicationIds in auto mode` (body đúng bằng `{ moveAppliedToScreening: false }`); `explains a 429 in Vietnamese`; `exportCandidatesCsvAction reads the CSV as text and names the file` (assert `get` nhận `{ responseType: 'text' }`, `filename` khớp `/^ung-vien-[0-9a-f-]{8}-\d{8}\.csv$/`); `shows the API message of a 400 whose body arrived as text`.
- [ ] **Step 2:** Run `npm run test:web -- src/servers/applications src/types/constants` → FAIL. **Step 3:** Cài. **Step 4:** Run → PASS; `npm run typecheck:web` exit 0.
- [ ] **Step 5: Commit** `test(web): add the bulk screening and export actions` rồi `feat(web): add the bulk screening and export actions`

---

### Task 9: Chọn đơn, thanh chấm và hộp thoại

**Files:** Modify `apps/web/src/components/candidates/ui/CandidatesFilters.tsx`, `CandidateRow.tsx`; Create `components/candidates/ui/BulkScreeningBar.tsx`, `BulkScreeningDialog.tsx`, và test `.test.tsx` cho `BulkScreeningBar`, `BulkScreeningDialog`, `CandidatesFilters`.

**Interfaces:** Consumes: Task 8, `ConfigProfile` (`@/types/interfaces/configProfile.interface`), `AccessibleDialog`. Produces:
- **Bước rẽ nhánh trước khi viết:** `grep -n "onToggle" apps/web/src/components/candidates/ui/CandidateRow.tsx`. **(a)** Có (SP1 đã vào nhánh này): dùng nguyên `selectedIds`/`selected`/`onToggle` có sẵn, không định nghĩa lại, chỉ thêm thanh SP2 cạnh `CompareBar`. **(b)** Chưa có: thêm đúng `CandidateRow` props `selected: boolean`, `onToggle: (applicationId: string) => void` (checkbox ở cột đầu, `aria-label={\`Chọn ${tên}\`}`, không bao giờ `disabled`) và state `selectedIds: Set<string>` trong `CandidatesFilters`, kèm ô tiêu đề `aria-label="Chọn tất cả"` để chọn hoặc bỏ mọi dòng đang hiển thị (`filtered`); `colSpan` của dòng rỗng tăng 1. Ghi rõ nhánh nào đã đi trong message commit.
- `CandidatesFilters` nhận thêm `aiProfiles: ConfigProfile[]`.
- `BulkScreeningBar({ jobId: string; selectedApplications: IApplicationDto[]; applications: IApplicationDto[]; aiProfiles: ConfigProfile[] })`: nút `Chấm AI (${n} đã chọn)` bật khi 1 ≤ n ≤ 50, tắt khi n = 0 hoặc n > 50, kèm chú thích `Chọn tối đa 50 đơn để chấm cùng lúc` khi n > 50; nút `Chấm mọi đơn đủ điều kiện` luôn bật. Mỗi nút mở `BulkScreeningDialog`.
- `BulkScreeningDialog({ jobId: string; mode: { kind: 'selected'; applications: IApplicationDto[] } | { kind: 'auto' }; applications: IApplicationDto[]; aiProfiles: ConfigProfile[]; onClose: () => void })`: chọn cấu hình (mặc định profile có `isDefault`); checkbox `Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm`, **mặc định không tick**; ở chế độ `selected`, khi có đơn `applied` thì hiện `${k} đơn đang ở 'Mới'`; nút `Bắt đầu chấm` gọi `bulkScreenApplicationsAction` và `disabled` khi request đang chạy; màn kết quả: `Đã đưa ${q} đơn vào hàng đợi`, `Bỏ qua ${s} đơn` với từng dòng `${tên hoặc 'Mã đơn ' + 8 ký tự}: ${SCREENING_SKIP_REASON_LABELS[reason]}`, và `Còn ${r} đơn đủ điều kiện chưa chấm, bấm lại để chấm tiếp` khi r > 0; chạy tự chọn ra rỗng → `Không có đơn nào cần chấm`; lỗi → hiện message, hộp thoại không đóng.

- [ ] **Step 1: Test đỏ** (Testing Library, mock action): `CandidateRow keeps its checkbox enabled with any number of other rows selected` (chỉ thêm ở nhánh (b)); `"Chọn tất cả" selects every visible row and clears them again`; `BulkScreeningBar enables "Chấm AI (n đã chọn)" from 1 to 50 and disables it at 0 and 51 with the note`; `"Chấm mọi đơn đủ điều kiện" is always enabled`; `the dialog leaves the move box unticked and sends moveAppliedToScreening false`; `counts the applied applications in the selection`; `sends the chosen config and the selected ids`; `sends no ids in auto mode`; `a second click while the request runs sends nothing` (Review Focus 3); `shows queued, skipped with Vietnamese labels, and remaining`; `says "Không có đơn nào cần chấm" for an empty auto run`; `shows the action's error and stays open`.
- [ ] **Step 2:** Run `npm run test:web -- src/components/candidates` → FAIL. **Step 3:** Cài (Tailwind cùng khuôn style với `CandidatesFilters`; chuỗi tiếng Việt như trên). **Step 4:** Run → PASS; `npm run typecheck:web`, `npm run lint:web` exit 0.
- [ ] **Step 5: Commit** `test(web): add the selection and bulk screening dialog behaviour` rồi `feat(web): screen selected or all eligible candidates of a job`

---

### Task 10: Nút xuất CSV, tự tải lại và nối trang

**Files:** Create `apps/web/src/lib/download-csv.ts`, `download-csv.test.ts`, `components/candidates/ui/ExportCsvButton.tsx`, `ExportCsvButton.test.tsx`, `components/candidates/useScreeningLiveRefresh.ts`, `useScreeningLiveRefresh.test.ts`; Modify `app/(recruiter)/jobs/[jobId]/candidates/page.tsx`, `components/candidates/ui/CandidatesFilters.tsx`.

**Interfaces:** Consumes: Task 8, `useSocketStore` (`status`, `onEvent`, `offEvent`), `useRouter` của `next/navigation`, `toast` của `src/lib/toast.ts`, `InitSocketRoom`, `getAIConfigAction`. Produces:
- `downloadCsv(filename: string, csv: string): void`: bỏ BOM đầu chuỗi nếu có, rồi dựng `new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })`, tải qua thẻ `<a download>` tạm, sau đó `URL.revokeObjectURL` (K4).
- `ExportCsvButton({ jobId: string })`: nút `Xuất CSV`, `disabled` khi đang chạy; thành công → `downloadCsv`; lỗi → `toast.error('Lỗi', message)`.
- `useScreeningLiveRefresh(): void`: khi `status === 'connected'` đăng ký `onEvent('cv-screening:completed', …)`; mỗi chuỗi sự kiện trong 1000 ms gọi `router.refresh()` một lần; gỡ đăng ký khi unmount. Không lọc theo `jobId` vì payload lỗi là `null`, và room đã giới hạn theo tin.
- `page.tsx`: `Promise.all([getApplicationsByJobAction(jobId, { includeCancelled: false }), getAIConfigAction()])`, render `<InitSocketRoom jobId={jobId} />`, truyền `aiProfiles` vào `CandidatesFilters`. `CandidatesFilters` gọi `useScreeningLiveRefresh()` và đặt `ExportCsvButton` cùng `BulkScreeningBar` trên bảng.

- [ ] **Step 1: Test đỏ:** `downloadCsv prefixes exactly one BOM whether or not the input had one, uses the filename and revokes the URL`; `ExportCsvButton downloads what the action returns`; `ExportCsvButton shows the action's message on failure`; `useScreeningLiveRefresh refreshes once for a burst of events within one second` (fake timers, 3 sự kiện → `refresh` 1 lần); `does nothing until the socket is connected`; `unsubscribes on unmount`.
- [ ] **Step 2:** Run `npm run test:web -- src/lib/download-csv src/components/candidates` → FAIL. **Step 3:** Cài. **Step 4:** Run `npm run test:web` (toàn bộ), `npm run typecheck:web`, `npm run lint:web` → exit 0.
- [ ] **Step 5: Commit** `test(web): add the export button and live refresh behaviour` rồi `feat(web): export candidates as csv and refresh scores live`

---

### Task 11: Test stack: probe export, hành trình E2E và kiểm chứng toàn bộ

**Files:** Create `docs/tasks/gd2-sp2-bulk-screening/results/probe-export.mjs`, `results/*.log`, `results/README.md`, `apps/web/e2e/gd2-bulk-screening.e2e.ts`.

**Interfaces:** Consumes: route Task 5 và Task 7; `createGd2BulkFixtures`/`cleanupGd2BulkFixtures` của Task 5b (mỗi lần chạy tạo fixture mới, nên user và bộ đếm rate limit đều mới); `waitForAuthWindow` từ `gd1-fixtures.mjs`; khuôn đăng nhập UI của `gd2-candidate-schedules.e2e.ts`. Produces: bằng chứng C14, C16 và README theo khuôn `docs/tasks/gd2-week1/README.md`, gồm cả kết quả của Task 5b.

- [ ] **Step 1: Giữ khoá test stack** đúng như Task 5b Step 1. Thất bại → DỪNG và báo; không xoá khoá của người khác. Từ đây đến Step 6, mọi lỗi đều phải đi qua Step 6.
- [ ] **Step 2:** Bật stack đúng như Task 5b Step 2.
- [ ] **Step 3: Probe** `probe-export.mjs` (tự tạo fixture và dọn trong `finally`, in `organization_id` ở dòng đầu log, ghi `results/probe-export.log`). **P6 (C14):** `GET /applications/job/A/export` bằng token recruiter 1 → 200; `content-type` = `text/csv; charset=utf-8`; `content-disposition` bắt đầu bằng `attachment; filename="ung-vien-`; 3 byte đầu `EF BB BF`; dòng đầu là `EXPORT_HEADERS`; body không bắt đầu bằng `{"success"`; không chứa email nào của fixture; không có đơn `cancelled`; số bản ghi = 62 (60 `screening` + 1 `applied` + 1 `interview`). Ghi kích thước body (A2).
- [ ] **Step 4: E2E** `gd2-bulk-screening.e2e.ts` (`test.describe('GĐ2 SP2 — chấm hàng loạt và xuất CSV')`, serial; `beforeAll` gọi `createGd2BulkFixtures`, `afterAll` gọi `cleanupGd2BulkFixtures`; đăng nhập UI bằng recruiter 2 như `gd2-candidate-schedules.e2e.ts`): mở `/jobs/B/candidates`, tick 2 đơn của tin B, bấm `Chấm AI (2 đã chọn)`, tick `Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm`, bấm `Bắt đầu chấm` → thấy `Đã đưa 1 đơn vào hàng đợi` và `Đã có kết quả sàng lọc`; DB: đơn `applied` giờ là `screening`. Bấm `Xuất CSV` → `page.waitForEvent('download')`; file bắt đầu bằng BOM, dòng đầu là `EXPORT_HEADERS`, không chứa email ứng viên (C16). Chạy: `TZ=UTC npm run test:e2e:web -- gd2-bulk-screening` với các biến `WEB_E2E_*` như `docs/tasks/test-defect-fixes/README.md`. Expected: pass, không retry hay skip. Lưu log.
- [ ] **Step 5: Kiểm chứng toàn bộ**, lưu log từng lệnh: `npx jest --config apps/api/jest.config.ts --runInBand --silent`, `npx nx lint api`, `rm -rf dist .nx/cache && npx nx build api`, `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`. Expected: mọi lệnh exit 0.
- [ ] **Step 6: Luôn chạy, kể cả khi bước trước đỏ hoặc đã DỪNG:** dọn fixture còn sót theo `organization_id` trong log, `docker compose -f docker-compose.test.yml stop`, `rmdir "$LOCALAPPDATA/ats-e2e.lock"` (PowerShell: `Remove-Item "$env:LOCALAPPDATA\ats-e2e.lock"`).
- [ ] **Step 7:** `README.md`: bảng lệnh và kết quả; bảng C1–C16 → bằng chứng (unit test, probe Task 5b, probe P6, E2E); A1–A5 với kết quả đo; mục "Chưa xác minh": Gemini thật không chạy (job trên test stack kết thúc `failed`), CSV chưa mở bằng Excel (A1, người dùng kiểm), UI chưa xem bằng mắt nếu đúng như vậy, export 5000 dòng thật chưa chạy (chỉ có kích thước của fixture).
- [ ] **Step 8: Commit** `test(web): add the bulk screening journey and the export probe` rồi `docs(tasks): record the gđ2 sp2 results`

## Self-review

- **Probe trên DB thật:** P1–P5 chạy ở Task 5b, P6 ở Task 11 (Step 3). Task 5b được thêm sau khi phiên "Kiểm tra tiến độ dự án" review plan, để A3–A5 lộ ra trước phần web.
- **Phủ spec:** R1 → Task 4, 5, 7; R2, R3 → Task 4, 5; R4 → Task 2; R5 → Task 4 + P2; R6 → Task 4; R7 → Task 3; R8 → Task 5 + P4/P5; R9, R10 → Task 7; R11 → Task 6; R12 → không task nào thêm migration. C1 → Task 4 + P1; C2 → Task 5; C3 → Task 2, 4; C4 → Task 2; C5 → Task 4 + P3; C6 → Task 4 + P2; C7, C8 → Task 4, 7; C9 → Task 3; C10 → P4; C11, C13 → Task 7; C12 → Task 6; C14 → P6; C15 → Task 8–10; C16 → Task 11 Step 4. E1, E2, E6, E7 → Task 4; E3 chấp nhận theo spec, không có task; E4, E5 → hành vi sẵn có của BullMQ và `retryCount`, E5 phủ ở Task 2; E8, E11 → Task 7; E9, E10 → Task 6; E12 → K5 + Task 10; E13, E14 → giữ hành vi đơn lẻ, không có code mới.
- **Nhất quán tên:** `checkScreeningEligibility`, `ScreeningSkipReason`, `IBulkScreeningResult`, `BULK_SCREENING_LIMIT`, `BulkScreeningDto`, `bulkScreen`, `bulkScreeningTracker`, `EXPORT_HEADERS`, `EXPORT_ROW_LIMIT`, `exportJobCsv`, `toCsv`, `bulkScreenApplicationsAction`, `exportCandidatesCsvAction`, `SCREENING_SKIP_REASON_LABELS`, `downloadCsv`, `useScreeningLiveRefresh`, `selectedIds`/`selected`/`onToggle` được định nghĩa một lần và dùng đúng tên ở các task sau.
- **Quyết định thêm khi viết plan** (chờ người dùng đọc plan, đã ghi vào decision.md): rate limit đếm theo `userId` (K2); web tự thêm BOM vì axios bỏ BOM (K4); 429 được dịch sang tiếng Việt ở server action, không đổi message của `ThrottlerGuard`; fixture E2E nằm ở file riêng để không xung đột với SP1.
