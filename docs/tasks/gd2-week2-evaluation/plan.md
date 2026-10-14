# GĐ2 SP1 — Đánh giá ứng viên: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recruiter nộp scorecard sau buổi phỏng vấn, ghi chú về ứng viên và so sánh 2–4 ứng viên của một tin; ứng viên không thấy gì trong số này.

**Architecture:** Hai bảng Prisma mới (`interview_scorecards`, `application_notes`) và hai NestJS module mới (`interview-scorecards`, `application-notes`); so sánh là `ApplicationComparisonService` trong module `applications`. Quyền đi qua `TenantCaller` và các helper có sẵn. Web thêm tab trên trang chi tiết ứng viên, chọn 2–4 ở danh sách và trang so sánh.

**Tech Stack:** NestJS 11 + Prisma 7 + PostgreSQL, BullMQ không dùng; Next.js 16 / React 19 server actions, Vitest, Playwright; Jest cho API.

**Spec:** [spec.md](spec.md) · quyết định: [decision.md](decision.md). Nhánh thực thi: `feat/gd2-sp1-evaluation` cắt từ `dev` (đang ở `93ad69b`).

## Global Constraints

- Điểm: số nguyên 1–5 cho `technicalSkills`, `problemSolving`, `communication`, `cultureFit` (DTO `@IsInt @Min(1) @Max(5)` **và** `CHECK` ở DB). `comment` và `body` tối đa **2000** ký tự; `body` được trim, không rỗng.
- Enum mới `ScorecardRecommendation`: `strong_no | no | yes | strong_yes` (không dùng lại `AiRecommendation`).
- `organizationId` của bản ghi mới lấy từ bản ghi cha (lịch hoặc đơn), không nhận từ client. Mọi bảng mới có cột `organizationId` và index.
- Chỉ interviewer của lịch nộp scorecard (R1), chỉ khi lịch `completed` (R2), chỉ khi đơn chưa ở `hired`/`rejected`/`cancelled` (R3), mỗi lịch một scorecard (R4, unique `interviewId`).
- So sánh nhận 2–4 `applicationId` khác nhau, thuộc cùng `jobId` (R10); chỉ hiển thị, không xếp hạng, không ghi (R11).
- Ứng viên không đọc được scorecard hay ghi chú: route trả 403 và payload ứng viên không có trường nào (R7).
- Thông báo lỗi bằng tiếng Việt; chuỗi nội bộ và log bằng tiếng Anh. Response theo envelope có sẵn (interceptor toàn cục, controller trả dữ liệu thô).
- Migration chỉ cộng thêm, không sửa bảng cũ. Tên migration dự kiến `20261014000000_add_interview_scorecards_and_application_notes` (SP2/SP3 có thể xin timestamp khác; chốt thứ tự khi merge).
- **Git:** không push hay merge. Commit chỉ khi người dùng đã cho phép (xem `docs/tasks/gd2-parallel-execution/README.md` §4.2): khi được phép, Codex (do phiên `stage-2-sp1-impl` gọi) commit trên nhánh worktree theo đúng message đề xuất ở các bước "Commit", chỉ `git add` file có trong plan, không `git add -A`; chưa được phép thì báo branch, `git status`, message và chờ duyệt. Thứ tự merge của GĐ2: SP1 → SP2 → SP3. Dòng `Co-Authored-By` cuối message do người dùng chốt (README điều phối §4.2); không tự ghi tên model không tham gia. Không đụng file không thuộc plan.
- Lệnh kiểm API: `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="<mẫu>"` (spec ngoài `src/app/**` và `src/common/**` bị bỏ qua âm thầm). Web: `npm run test:web -- <đường dẫn>`, `npm run typecheck:web`, `npm run lint:web`.

## Điều chỉnh spec (đã phát hiện khi đọc code, áp dụng ở Task 1)

- **R6 (404) và khuôn hiện có:** `assertOrganizationAccess` hiện trả **403** cho tổ chức khác. Với endpoint mới, spec yêu cầu 404 để không lộ sự tồn tại; plan thêm helper `assertInCallerOrganizationOr404` và dùng nó **trước** các helper cũ.
- **R8 (đọc "mọi" scorecard/ghi chú) và ranh giới khoa:** recruiter hiện chỉ truy cập đơn thuộc khoa của tin (`assertCanAccessDepartment`). Plan sửa R8: quyền đọc/ghi ghi chú, đọc scorecard và so sánh = quyền xem đơn đó (org_admin và platform admin theo tổ chức, recruiter theo khoa của tin). Interviewer của lịch vẫn nộp được dù khác khoa (R1).

## Review Focus

1. Recruiter **cùng tổ chức nhưng khác khoa** gọi đọc ghi chú / scorecard / so sánh của đơn → 403 (không phải 200). Test ở Task 4, 6, 7.
2. `applicationIds` chứa chuỗi không phải UUID, trùng nhau hoặc quá 4 phần tử → 400, không văng 500 (E7). Test ở Task 7.
3. Ranh giới độ dài: `comment`/`body` đúng 2000 ký tự được nhận, 2001 → 400; `body` chỉ toàn khoảng trắng → 400. Test ở Task 4 và 6.
4. Hai `PUT` scorecard đồng thời cho cùng lịch chỉ tạo một bản ghi (E3). Test ở Task 4 (upsert theo khoá unique) và Task 2 (probe).
5. So sánh với đơn chưa có screening hoặc chưa có scorecard → `screening: null`, `scorecards.average` toàn `null`, không lỗi (E6). Test ở Task 7.

## File Structure

| File | Trách nhiệm |
|---|---|
| `libs/backend/database/prisma/schema.prisma` | Thêm enum, 2 model, quan hệ ngược |
| `libs/backend/database/prisma/migrations/20261014000000_…/migration.sql` | Bảng, FK, `CHECK`, index |
| `libs/shared/types/src/lib/enums.ts` | `ScorecardRecommendation` cho web |
| `apps/api/src/common/tenancy/tenant-caller.ts` | `assertInCallerOrganizationOr404` |
| `apps/api/src/app/interview-scorecards/` | module, controller, service, DTO, spec |
| `apps/api/src/app/application-notes/` | module, controller, service, DTO, spec |
| `apps/api/src/app/applications/application-comparison.service.ts` | đọc so sánh |
| `apps/web/src/servers/{scorecards,notes}/`, `servers/applications/applications.action.ts` | server actions |
| `apps/web/src/components/candidates/…`, `app/(recruiter)/jobs/[jobId]/compare/page.tsx` | UI |
| `apps/web/e2e/gd2-evaluation.e2e.ts` | hành trình thật |

---

### Task 0: Chuẩn bị worktree

**Files:** không có.

**Interfaces:** Produces: một worktree sạch trên nhánh `feat/gd2-sp1-evaluation` cắt từ `origin/dev`, có `node_modules` và Prisma client.

- [ ] **Step 1:** Trong worktree, `git branch --show-current` in `feat/gd2-sp1-evaluation` và `git status --short` rỗng (nếu không, DỪNG và báo).
- [ ] **Step 2:** `npm ci`, rồi `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma` (dạng CI dùng, chạy offline). **Không** dùng `--config libs/backend/database/prisma.config.ts` cho lệnh này: `prisma.config.ts` đòi `DATABASE_URL`, và worktree mới không có `.env` (runbook `[V 2026-08-30]`, và `ci.yml:55` dùng đúng dạng `--schema`). Expected: cả hai exit 0. Mỗi lần trước `npx nx build api` chạy `rm -rf dist .nx/cache` (bản build cũ giữ Prisma client cũ).
- [ ] **Step 3:** Chạy nền chuẩn: `npx jest --config apps/api/jest.config.ts --runInBand --silent --testPathPatterns="tenant-caller"` và `npm run test:web -- src/lib`. Expected: exit 0. Nếu đỏ trước khi sửa gì, DỪNG và báo (đây là lỗi sẵn có, không tự sửa).

---

### Task 1: Chỉnh spec cho khớp khuôn truy cập hiện có

**Files:** Modify `docs/tasks/gd2-week2-evaluation/spec.md`, `decision.md`.

**Interfaces:** Produces: R6 = "tổ chức khác → 404 qua `assertInCallerOrganizationOr404`", R8 = "quyền xem đơn đó", R12 đã được người dùng duyệt (13/10).

- [ ] **Step 1:** Sửa R6, R8 và C7 trong `spec.md` đúng hai điều chỉnh ở trên; thêm edge case E11 "recruiter khác khoa cùng tổ chức → 403". Đổi trạng thái đầu spec thành "đã duyệt".
- [ ] **Step 2:** Trong `decision.md`, chuyển mục "Chờ xác nhận" của R12 thành "Đã duyệt 2026-10-13 (người dùng: spec không có vấn đề)" và thêm hai dòng vào bảng đề xuất kỹ thuật cho hai điều chỉnh, ghi rõ chúng do Claude đề xuất khi viết plan và chờ người dùng đọc plan.
- [ ] **Step 3: Commit** `docs(tasks): align the sp1 spec with the existing access model`

---

### Task 2: Schema, migration, enum chia sẻ và probe DB

**Files:** Modify `schema.prisma`, `libs/shared/types/src/lib/enums.ts`; Create migration `…/20261014000000_add_interview_scorecards_and_application_notes/migration.sql`, `docs/tasks/gd2-week2-evaluation/results/probe-scorecard-constraints.js` và `probe-scorecard-constraints.log`.

**Interfaces:** Produces (Prisma delegates sau `prisma generate`): `prisma.interviewScorecard` (`id`, `organizationId`, `interviewId` unique, `authorId`, `technicalSkills`, `problemSolving`, `communication`, `cultureFit`, `recommendation`, `comment`, `submittedAt`, `updatedAt`) và `prisma.applicationNote` (`id`, `organizationId`, `applicationId`, `authorId`, `body`, `createdAt`, `updatedAt`). Quan hệ: `InterviewSchedule.scorecard InterviewScorecard?`, `Application.notes ApplicationNote[]`, `User.scorecards`, `User.applicationNotes`, `Organization.scorecards`, `Organization.applicationNotes`. Web: `ScorecardRecommendation` (`as const` + type) trong `enums.ts`.

- [ ] **Step 1: Viết probe trước** theo khuôn `docs/tasks/org-admin-enforcement/results/probe-org-admin-check.js` (mỗi probe trong SAVEPOINT rồi ROLLBACK, kết nối qua `DATABASE_URL`). Các probe: `CHECK` từ chối điểm 0 và 6 (code `23514`) và nhận 1 và 5; unique từ chối scorecard thứ hai cùng `interview_id` (`23505`); FK `Restrict` từ chối xoá `interview_schedules` có scorecard (`23503`); xoá `applications` kéo theo `application_notes` (cascade); enum `scorecard_recommendation` có đúng 4 giá trị.
- [ ] **Step 2: Đỏ, trên PostgreSQL dùng một lần (không dùng test stack dùng chung, nên không cần giữ khoá).** `docker run -d --rm --name ats-sp1-pg-probe -e POSTGRES_USER=probe -e POSTGRES_PASSWORD=probe-local -e POSTGRES_DB=probe -p 127.0.0.1:55532:5432 postgres:18.4-alpine`, chờ `docker exec ats-sp1-pg-probe pg_isready -U probe -d probe`. Rồi `DATABASE_URL=postgresql://probe:probe-local@localhost:55532/probe npx prisma migrate deploy --config libs/backend/database/prisma.config.ts` (chưa có migration SP1; ở đây `--config` dùng được vì đã đặt `DATABASE_URL`) và chạy probe với cùng `DATABASE_URL`. Expected: FAIL (bảng chưa có). Lưu log đỏ. (Cổng 55532 dành cho SP1, 55533 cho SP3, để hai worktree chạy cùng lúc không đụng nhau.)
- [ ] **Step 3:** Thêm enum và hai model vào `schema.prisma` theo spec (§Dữ liệu; `@@map` snake_case như các model khác, `onDelete: Restrict` cho `interviewId`, `Cascade` cho `applicationId`). **Viết tay** `migration.sql` (**không** dùng `prisma migrate diff`: nó không in gì trên máy này, brain `[V 2026-09-13]`) theo khuôn `20260913042256_add_organization_tenant/migration.sql`: `CREATE TYPE`, hai `CREATE TABLE`, các `CREATE INDEX`/`CREATE UNIQUE INDEX`, các `ADD CONSTRAINT … FOREIGN KEY`, rồi `CHECK (technical_skills BETWEEN 1 AND 5)` và ba cột còn lại kèm comment giải thích như migration `…add_org_admin_binding_check`. Thêm `ScorecardRecommendation` vào `enums.ts`. Probe ở Step 1 là bằng chứng SQL đúng.
- [ ] **Step 4: Xanh.** Chạy lại `migrate deploy` với cùng `DATABASE_URL` → báo đã áp migration mới; chạy probe → mọi dòng `PASS`, exit 0; lưu log xanh; `docker rm -f ats-sp1-pg-probe`. Rồi `npx prisma generate --schema=libs/backend/database/prisma/schema.prisma`, `rm -rf dist .nx/cache` và `npx nx build api` (exit 0).
- [ ] **Step 5: Commit** `test(db): add the scorecard and note constraint probe` (probe + log đỏ) rồi `feat(db): add interview scorecards and application notes` (schema, migration, enum, log xanh).

---

### Task 3: Helper truy cập dùng chung

**Files:** Modify `apps/api/src/common/tenancy/tenant-caller.ts`, `apps/api/src/app/applications/applications.service.ts`, `apps/api/src/app/interviews/interviews.service.ts`; Test `apps/api/src/common/tenancy/tenant-caller.spec.ts` (thêm), `applications.service.spec.ts`/`interviews.service.spec.ts` chỉ nếu đổi hành vi.

**Interfaces:** Produces: `assertInCallerOrganizationOr404(caller: TenantCaller, resourceOrganizationId: string, message: string): void`; `ApplicationsService.assertCanAccessApplication(caller: TenantCaller, applicationId: string): Promise<void>` (đổi `private` → public, không đổi thân); `InterviewsService.assertCanViewSchedule(caller: TenantCaller, interviewId: string): Promise<void>` (đổi `private` → public).

- [ ] **Step 1: Test đỏ** trong `tenant-caller.spec.ts`: `it('lets a platform admin through')`, `it('answers 404 with the given message for staff of another organization')` (assert `NotFoundException` và `message`), `it('passes staff of the same organization')`, `it('refuses a candidate with 403')`. Run → FAIL (hàm chưa có).
- [ ] **Step 2:** Cài hàm: admin nền tảng qua; `isOrganizationStaff` mà `requireCallerOrganization(caller) !== resourceOrganizationId` → `NotFoundException(message)`; vai khác → `ForbiddenException`.
- [ ] **Step 3:** Đổi hai helper `private` thành public (chỉ bỏ từ khoá `private`); chạy `--testPathPatterns="tenant-caller|applications.service|interviews.service"` → PASS, không test cũ nào đổi.
- [ ] **Step 4: Commit** `test(api): reproduce cross-organization lookups answering 403 instead of 404` rồi `feat(api): share the access checks with the evaluation modules`

---

### Task 4: API scorecard (module `interview-scorecards`)

**Files:** Create `apps/api/src/app/interview-scorecards/{interview-scorecards.module.ts,interview-scorecards.controller.ts,interview-scorecards.service.ts,dto/upsert-scorecard.dto.ts,interview-scorecards.service.spec.ts,dto/upsert-scorecard.dto.spec.ts}`; Modify `apps/api/src/app/app.module.ts`, `apps/api/src/test-utils/unit-test-helpers.ts` (thêm `interviewScorecard`, `applicationNote` vào `createPrismaMock`).

**Interfaces:** Consumes: Task 2 delegates, Task 3 helpers. Produces:
- `UpsertScorecardDto { technicalSkills: number; problemSolving: number; communication: number; cultureFit: number; recommendation: ScorecardRecommendation; comment?: string }`
- `InterviewScorecardsService.upsert(caller: TenantCaller, interviewId: string, dto: UpsertScorecardDto): Promise<ScorecardView>`; `.getForSchedule(caller, interviewId): Promise<ScorecardView>` (404 `'Chưa có đánh giá cho buổi phỏng vấn này'`); `.listForApplication(caller, applicationId): Promise<ScorecardListItem[]>`
- `ScorecardView = { id, interviewId, technicalSkills, problemSolving, communication, cultureFit, recommendation, comment: string | null, submittedAt, updatedAt, author: { userId, fullName } }`; `ScorecardListItem = ScorecardView & { interview: { interviewId, startAt, interviewType, status } }`
- Routes (`@Roles(UserRole.recruiter, UserRole.admin)`): `PUT interviews/schedules/:id/scorecard`, `GET interviews/schedules/:id/scorecard`, `GET interview-scorecards/application/:applicationId`.
- Lỗi: 403 `'Chỉ người phỏng vấn của lịch này được nộp đánh giá'`; 409 `'Chỉ nộp đánh giá khi buổi phỏng vấn đã hoàn tất'`; 409 `'Đơn đã chốt, không thể sửa đánh giá'`; 404 `'Không tìm thấy lịch phỏng vấn'`.

- [ ] **Step 1: Test đỏ (service)**, mỗi `it` một quy tắc, dùng `createPrismaMock` và `callerOf` như `interviews.service.spec.ts`: `creates a scorecard for the interviewer of a completed schedule` (assert `upsert` gọi với `where: { interviewId }` và `organizationId` lấy từ lịch); `updates the same row on a second submit`; `refuses the scheduler who is not the interviewer` (R1, 403); `refuses a platform admin who is not the interviewer`; `accepts an org_admin who is the interviewer`; `refuses a scheduled or cancelled schedule` (409); `refuses an application that is hired, rejected or cancelled` (it.each, 409); `answers 404 for a schedule of another organization`; `refuses a recruiter of another department for reads` (403, Review Focus 1); `reads still work once the application is closed`. Test DTO: `accepts 1 and 5`, `rejects 0, 6, 3.5 and missing`, `accepts a 2000-character comment and rejects 2001` (Review Focus 3).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Cài DTO, service, controller, module (imports `PrismaModule`, `InterviewsModule`, `ApplicationsModule`), đăng ký trong `app.module.ts`. `upsert` dùng `prisma.interviewScorecard.upsert({ where: { interviewId }, … })` để hai PUT đồng thời chỉ ra một bản ghi (Review Focus 4); trình tự kiểm: tìm lịch → `assertInCallerOrganizationOr404` → R1 → R2 → R3.
- [ ] **Step 4:** Run `--testPathPatterns="interview-scorecards"` → PASS; `npx nx build api` exit 0.
- [ ] **Step 5: Commit** `test(api): add the scorecard rules` rồi `feat(api): add interview scorecards`

---

### Task 5: Xoá lịch đã có scorecard (R12)

**Files:** Modify `apps/api/src/app/interviews/interviews.service.ts:499-505` (`removeSchedule`); Test `interviews.service.spec.ts`.

**Interfaces:** Consumes: `prisma.interviewScorecard.count`. Produces: `removeSchedule` ném `ConflictException('Buổi phỏng vấn đã có đánh giá, không thể xoá')` khi `count({ where: { interviewId } }) > 0`; lịch chưa có scorecard xoá như cũ; id không tồn tại vẫn 404.

- [ ] **Step 1: Test đỏ:** `it('refuses to delete a schedule that has a scorecard')`, `it('still deletes a schedule without one')`, `it('still answers 404 for an unknown schedule')`. Run → FAIL.
- [ ] **Step 2:** Thêm kiểm `count` sau `assertCanMutateSchedule` và trước `delete`. Run → PASS; thêm vào probe Task 2 đã có dòng FK `Restrict` (không đổi).
- [ ] **Step 3: Commit** `test(api): reproduce deleting a schedule that has a scorecard` rồi `fix(api): refuse to delete a schedule that has a scorecard`

---

### Task 6: API ghi chú (module `application-notes`)

**Files:** Create `apps/api/src/app/application-notes/{application-notes.module.ts,application-notes.controller.ts,application-notes.service.ts,dto/note.dto.ts,application-notes.service.spec.ts,dto/note.dto.spec.ts}`; Modify `app.module.ts`.

**Interfaces:** Produces: `NoteDto { body: string }` (`@Transform` trim, `@IsString @IsNotEmpty @MaxLength(2000)`), `ListNotesQueryDto { page?: number; limit?: number }`; `ApplicationNotesService.create(caller, applicationId, dto): Promise<NoteView>`; `.list(caller, applicationId, query): Promise<{ items: NoteView[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>` (mới nhất trước, mặc định 20); `.update(caller, noteId, dto): Promise<NoteView>`; `.remove(caller, noteId): Promise<{ id: string }>`; `NoteView = { id, applicationId, body, createdAt, updatedAt, author: { userId, fullName } }`. Routes `@Roles(UserRole.recruiter, UserRole.admin)`: `POST|GET applications/:applicationId/notes`, `PATCH|DELETE application-notes/:id`. Lỗi: 403 `'Chỉ tác giả được sửa hoặc xoá ghi chú'`, 403 `'Quản trị viên nền tảng chỉ được đọc ghi chú'`, 404 `'Không tìm thấy ghi chú'`.

- [ ] **Step 1: Test đỏ:** `creates a note with the organization of the application`; `lists newest first with pagination`; `lets only the author edit` và `…delete` (403 cho người khác, kể cả org_admin); `refuses a platform admin to write` (đọc thì được); `answers 404 for a note of another organization`; `refuses a recruiter of another department` (Review Focus 1); `rejects a whitespace-only body` và `accepts 2000 / rejects 2001 characters` (Review Focus 3, DTO spec); `answers 404 when the note was deleted meanwhile` (E8).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Cài theo Interfaces; `create/list` gọi `assertInCallerOrganizationOr404` rồi `ApplicationsService.assertCanAccessApplication`; `organizationId` lấy từ đơn; `update/remove` đọc ghi chú, kiểm tổ chức (404) rồi `authorId === caller.userId`.
- [ ] **Step 4:** Run `--testPathPatterns="application-notes"` → PASS; `npx nx build api`.
- [ ] **Step 5: Commit** `test(api): add the note rules` rồi `feat(api): add application notes`

---

### Task 7: API so sánh ứng viên

**Files:** Create `apps/api/src/app/applications/application-comparison.service.ts`, `dto/compare-applications-query.dto.ts`, `application-comparison.service.spec.ts`; Modify `applications.module.ts` (provider), `applications.controller.ts` (route).

**Interfaces:** Produces: `CompareApplicationsQueryDto { applicationIds: string[] }` (chuỗi `a,b,c` được tách; `@ArrayMinSize(2) @ArrayMaxSize(4) @ArrayUnique @IsUUID('all', { each: true })`); `ApplicationComparisonService.compare(caller: TenantCaller, jobId: string, applicationIds: string[]): Promise<ComparisonItem[]>`; `ComparisonItem = { applicationId, candidateName: string, status: ApplicationStatus, appliedAt: Date, screening: { overallScore, skillsScore, experienceScore, educationScore, aiRecommendation, matchedSkills, missingSkills } | null, scorecards: { count: number; average: { technicalSkills, problemSolving, communication, cultureFit }; recommendations: { interviewerName: string; recommendation: ScorecardRecommendation }[] }, noteCount: number }` (điểm trung bình `number | null`, làm tròn 1 chữ số). Route `@Get('job/:jobId/compare')` trong `ApplicationsController`, `@Roles(UserRole.recruiter, UserRole.admin)`. Lỗi: 400 `'Chỉ so sánh 2–4 ứng viên của cùng một tin'`.

- [ ] **Step 1: Test đỏ:** `returns the shape of the spec for 2 applications of the job`; `rejects 1 and 5 ids, duplicate ids and non-UUID ids` (DTO, Review Focus 2); `rejects an id that belongs to another job` (400); `answers 404 for a job of another organization`; `refuses a recruiter of another department` (403); `gives screening null and null averages when there is neither` (Review Focus 5); `averages two scorecards and rounds to one decimal`; `has no ranking field and performs no write` (assert mọi `prisma.*.update/create/delete` không được gọi, và kết quả không có khoá `rank`/`best`).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Cài; đọc bằng ít truy vấn (một `findMany` đơn kèm `screening`, `user` của ứng viên, một `findMany` scorecard theo `interview.applicationId in`, một `groupBy`/`count` ghi chú); `assertCanAccessApplication` cho từng id. Không đổi `applications.service.ts`.
- [ ] **Step 4:** Run `--testPathPatterns="application-comparison"` → PASS; `npx nx build api`.
- [ ] **Step 5: Commit** `test(api): add the comparison rules` rồi `feat(api): compare 2-4 applications of a job`

---

### Task 8: Rào chống rò rỉ cho ứng viên (R7, C8)

**Files:** Create `apps/api/src/app/interview-scorecards/no-candidate-access.spec.ts`; Test mở rộng `applications/candidate-history.spec.ts` hoặc file mới `applications/candidate-payload-no-evaluation.spec.ts`.

**Interfaces:** Consumes: `Reflect.getMetadata('roles', …)` theo cách `RolesGuard` đọc vai (xem `roles.guard.ts`), `candidateScheduleSelect` và include dành cho ứng viên trong `include-options.util.ts`.

- [ ] **Step 1: Test:** `no route of the scorecard, note and comparison controllers allows the candidate role` (duyệt mọi handler, assert `candidate` không nằm trong `@Roles`); `the candidate schedule select and application select carry neither scorecard nor notes` (assert không có khoá `scorecard`, `notes`, `scorecards`). Run: PASS ngay nếu Task 4–7 đúng; nếu FAIL thì sửa chỗ rò, không sửa test.
- [ ] **Step 2: Commit** `test(api): pin that candidates never receive evaluation data`

---

### Task 9: Kiểu và server actions (web)

**Files:** Create `apps/web/src/types/interfaces/evaluation.interface.ts`, `apps/web/src/servers/scorecards/scorecards.action.ts`, `servers/notes/notes.action.ts` (+ `.test.ts` mỗi file); Modify `servers/applications/applications.action.ts`.

**Interfaces:** Produces: `IScorecard`, `IScorecardListItem`, `IScorecardInput`, `IApplicationNote`, `IComparisonItem` (khớp `ScorecardView`, `ScorecardListItem`, `NoteView`, `ComparisonItem` của API); `getApplicationScorecardsAction(applicationId: string): Promise<IScorecardListItem[]>`; `submitScorecardAction(interviewId: string, input: IScorecardInput): Promise<ScorecardActionState>`; `getNotesAction(applicationId: string, page?: number): Promise<{ items: IApplicationNote[]; pagination: … }>`; `createNoteAction`, `updateNoteAction`, `deleteNoteAction` (mỗi hàm trả `{ success: boolean; message: string; data?: IApplicationNote }`); `compareApplicationsAction(jobId: string, applicationIds: string[]): Promise<IComparisonItem[]>`. Khuôn: `'use server'`, `http` từ `@/lib/http`, lỗi qua `actionErrorMessage` / `rethrowReadError`, `revalidatePath` sau ghi như `interviews.action.ts`.

- [ ] **Step 1: Test đỏ** (mock `http`, theo `interviews.action.test.ts`): `submitScorecardAction sends a PUT to /interviews/schedules/:id/scorecard with the five fields`; `shows the API's Vietnamese message on a 409`; `createNoteAction trims and refuses an empty body before calling the API`; `compareApplicationsAction joins the ids with commas`; `read actions rethrow with the standard message`. Run → FAIL.
- [ ] **Step 2:** Cài. **Step 3:** Run `npm run test:web -- src/servers` → PASS; `npm run typecheck:web` exit 0.
- [ ] **Step 4: Commit** `test(web): add the evaluation server actions` rồi `feat(web): add the evaluation server actions`

---

### Task 10: Tab đánh giá và ghi chú trên trang chi tiết ứng viên

**Files:** Modify `apps/web/src/components/candidates/CandidateDetailClient.tsx`, `apps/web/src/app/(recruiter)/jobs/[jobId]/candidates/[id]/page.tsx`; Create `components/candidates/ui/{CandidateTabs.tsx,ScorecardPanel.tsx,ScorecardForm.tsx,NotesPanel.tsx}` + test cho mỗi file.

**Interfaces:** Consumes: Task 9 actions, `getMeAction()`. Produces: `CandidateDetailClient` nhận thêm `currentUserId: string` và `isClosed: boolean` (suy ra từ `application.status ∈ {hired, rejected, cancelled}`); `CandidateTabs({ tabs: { id: 'overview' | 'evaluation' | 'notes'; label: string }[]; active; onChange })`; `ScorecardPanel({ applicationId: string; currentUserId: string; isClosed: boolean })`; `ScorecardForm({ interviewId: string; initial?: IScorecardInput; disabled: boolean; onSaved(): void })`; `NotesPanel({ applicationId: string; currentUserId: string })`. Tab đọc từ `?tab=evaluation` để drawer liên kết tới được (Task 11).

- [ ] **Step 1: Test đỏ (Vitest/Testing Library):** `ScorecardForm blocks submit until all four ratings and a recommendation are chosen`; `ScorecardForm shows the API message when the submit is refused and keeps the typed values` (bài học tuần 1); `ScorecardPanel offers "Nộp đánh giá" only on a completed interview where I am the interviewer and none exists yet`; `ScorecardPanel is read-only when the application is closed`; `NotesPanel shows edit and delete only on my own notes`; `NotesPanel adds a note and clears the box`; `CandidateTabs switches the content and honours ?tab=evaluation`. Run → FAIL.
- [ ] **Step 2:** Cài component (tiếng Việt, khuôn style hiện có: Tailwind class như `CandidateDetailClient`); `page.tsx` lấy `getMeAction()` truyền `currentUserId`.
- [ ] **Step 3:** Run `npm run test:web -- src/components/candidates` → PASS; `npm run typecheck:web` và `npm run lint:web` exit 0.
- [ ] **Step 4: Commit** `test(web): add the evaluation tabs behaviour` rồi `feat(web): add the evaluation and notes tabs to the candidate page`

---

### Task 11: Liên kết ở drawer lịch, chọn 2–4 và trang so sánh

**Files:** Modify `components/interview-schedule/ui/ScheduleDetailDrawer.tsx`, `components/candidates/ui/{CandidatesFilters.tsx,CandidateRow.tsx}`; Create `components/candidates/ui/CompareBar.tsx`, `components/candidates/CompareTable.tsx`, `app/(recruiter)/jobs/[jobId]/compare/page.tsx` + test; Modify `lib/role-policy.test.ts` hoặc `proxy.test.ts`.

**Interfaces:** Produces: `CandidateRow` nhận thêm `selected: boolean` và `onToggle: (applicationId: string) => void` (checkbox **không bao giờ** bị khoá bởi trần số lượng: trạng thái chọn là một `Set<string>` dùng chung trong `CandidatesFilters`, và các thanh hành động tự đặt trần, ví dụ thanh chấm hàng loạt của SP2 cho phép tới 50); `CompareBar({ jobId: string; selectedIds: string[] })` (nút "So sánh" chỉ bật khi chọn 2–4; khi chọn hơn 4 nút tắt kèm chú thích "Chọn tối đa 4 ứng viên để so sánh"; **trần 2–4 nằm ở đây, không ở `CandidateRow`**); `CompareTable({ items: IComparisonItem[]; jobId: string })`; trang `compare/page.tsx` đọc `ids` từ `searchParams`, gọi `compareApplicationsAction`, lỗi → thông báo kèm liên kết "Quay lại danh sách". `ScheduleDetailDrawer` hiện liên kết `/jobs/${schedule.application.jobPosting.jobId}/candidates/${schedule.applicationId}?tab=evaluation` khi `status === 'completed'` và `schedule.interviewerId === currentUserId`.

- [ ] **Step 1: Test đỏ:** `CompareBar enables at 2 to 4 selections, and at 5 it is disabled with the note "Chọn tối đa 4 ứng viên để so sánh"`; `CandidateRow keeps its checkbox enabled with any number of other rows selected (the limit belongs to CompareBar)`; `CompareTable shows AI scores labelled as suggestions, scorecard averages and no ranking`; `compare page shows the error and a back link for a bad ids list`; `drawer shows the evaluation link only to the interviewer of a completed interview`; `a candidate is blocked from /jobs/:id/compare` (đọc `mayVisit('candidate', '/jobs/j/compare')` → false). Run → FAIL.
- [ ] **Step 2:** Cài. Tên và hình dạng của state chọn **phải đúng từng ký tự** như sau, vì plan SP2 (nhánh (b) của Task 9) định nghĩa y hệt để hai nhánh merge không xung đột: trong `CandidatesFilters` có `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())` (chỉ các dòng của trang hiện tại), `onToggle` đảo một `applicationId` trong tập; `CandidateRow` có checkbox ở cột đầu với `aria-label={\`Chọn ${tên}\`}`, không bao giờ `disabled`; ô tiêu đề cột đầu có `aria-label="Chọn tất cả"` để chọn hoặc bỏ mọi dòng đang hiển thị (`filtered`); `colSpan` của dòng rỗng tăng 1. `CompareBar` nhận `selectedIds` là `string[]` suy ra từ tập đó (`Array.from(selectedIds)`). Thêm test `"Chọn tất cả" selects every visible row and clears them again`. **Step 3:** Run `npm run test:web` (toàn bộ), `typecheck:web`, `lint:web` → exit 0.
- [ ] **Step 4: Commit** `test(web): add the selection, comparison and drawer link behaviour` rồi `feat(web): compare candidates and link the interviewer to the evaluation tab`

---

### Task 12: Hành trình E2E và kiểm chứng toàn bộ

**Files:** Create `apps/web/e2e/gd2-evaluation.e2e.ts`; Modify `apps/web/e2e/support/gd2-fixtures.mjs` (seed lịch `completed` với interviewer và hai đơn có screening); Create `docs/tasks/gd2-week2-evaluation/results/*.log`, `README.md`.

**Interfaces:** Consumes: các endpoint Task 4–7. Produces: tiêu chí C15 và bằng chứng C1–C14 trong `README.md` theo khuôn `docs/tasks/gd2-week1/README.md` (bảng lệnh, bảng tiêu chí → bằng chứng, "Chưa xác minh").

- [ ] **Step 1: Viết journey** (`test.describe('GĐ2 SP1 — đánh giá ứng viên')`): recruiter A đăng nhập, mở đơn có lịch `completed` mình là interviewer, nộp scorecard và thấy nó hiện lại sau reload; recruiter B (cùng khoa) thấy scorecard, thêm ghi chú; B chọn 2 ứng viên và mở trang so sánh thấy điểm AI và trung bình scorecard; gọi API bằng token ứng viên và assert `GET /interview-scorecards/application/:id` và `GET /applications/:id/notes` đều **403** và `GET /applications/my` không có khoá `scorecard`/`notes`.
- [ ] **Step 2:** Test stack (`docker-compose.test.yml`, cổng 55000/55432/56379) dùng chung cả máy với SP2 và SP3. Giữ khoá trước: `mkdir "$LOCALAPPDATA/ats-e2e.lock"`; nếu thất bại thì DỪNG và báo, không xoá khoá của người khác. Rồi `TZ=UTC npm run test:e2e:web` (cần các biến `WEB_E2E_*` như `docs/tasks/test-defect-fixes/README.md`); expected: toàn bộ pass, không retry/skip. Lưu log. **Luôn** `rmdir "$LOCALAPPDATA/ats-e2e.lock"` và `docker compose -f docker-compose.test.yml stop` khi xong, kể cả khi test đỏ.
- [ ] **Step 3:** Chạy và lưu log: `npx jest --config apps/api/jest.config.ts --runInBand --silent`, `npx nx lint api`, `npx nx build api`, `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`. Expected: mọi lệnh exit 0.
- [ ] **Step 4:** Viết `README.md`: bảng kết quả, bảng C1–C15, mục "Chưa xác minh" (thật thà: gì chưa chạy, panel/UI chưa xem bằng mắt nếu vậy).
- [ ] **Step 5: Commit** `test(web): add the evaluation journey` rồi `docs(tasks): record the gđ2 sp1 results`

## Self-review

- **Phủ spec:** R1–R5, R9, R10 → Task 4, 6, 7; R6, R8 → Task 1, 3; R7 → Task 8; R11 → Task 7; R12 → Task 5; C5, C6, C10, C13 → probe Task 2; C14 → Task 9–11; C15 → Task 12; E1 (interviewer bị vô hiệu hoá) chỉ phủ gián tiếp: không có code mới cho nó, đọc vẫn đúng; E3 → Task 4 + 2; E4 → hành vi sẵn có của máy trạng thái lịch (`VALID_SCHEDULE_TRANSITIONS`), không cần task; E7 → Task 7; E8 → Task 6; E9 → Task 11.
- **Nhất quán tên:** `ScorecardView`, `ScorecardListItem`, `NoteView`, `ComparisonItem` định nghĩa ở Task 4/6/7 và được Task 9 ánh xạ sang `I…`; `assertInCallerOrganizationOr404` định nghĩa ở Task 3 và dùng ở Task 4, 6, 7.
- **Rủi ro còn mở:** migration SQL viết tay vì `prisma migrate diff` không in gì trên máy này (probe ở Task 2 là bằng chứng SQL đúng); chưa kiểm `IInterviewSchedule` ở phía staff có `interviewerId` (Task 11 phải kiểm trước khi dựa vào); thứ tự migration với SP2/SP3 chưa chốt.
