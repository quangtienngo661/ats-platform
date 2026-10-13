# Lát 3 — Lọc tìm việc (lương, kỹ năng, hình thức ở trang chủ) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native, như lát 1–2). Steps dùng checkbox.

**Goal:** Ứng viên (kể cả khách) lọc tin tuyển dụng theo khoảng lương và kỹ năng, và chọn hình thức làm việc ngay ở trang chủ.
**Architecture:** API thêm `salaryMin`/`salaryMax`/`skillIds` vào query của `GET /job-postings` và một endpoint công khai `GET /job-postings/filter-options`. Web thêm hai nhóm lọc vào panel "Bộ lọc" sẵn có, đọc/ghi qua URL như `locationType` hiện nay; ô "Địa điểm" bị khóa ở trang chủ đổi thành chọn hình thức làm việc.
**Tech Stack:** NestJS 11 + Prisma 7 + Jest · Next.js 16 + React 19 + Vitest · Playwright.
**Spec:** `docs/tasks/gd2-week1/spec.md` (R4, R5, R6; C10–C14; E6, E15–E17, E19) · `decision.md` D3, D4 · `survey.md` §S3.

## Context

Hiện tại trang việc làm chỉ lọc được theo ngành nghề, hình thức và từ khóa trong tiêu đề. Khảo sát lại code hôm nay (2026-10-04):
- **Dữ liệu đã có sẵn:** `JobPosting.salaryMin/salaryMax` (`Decimal?`, không có cột đơn vị) và `JobPostingSkill`. Không cần migration.
- **Chưa có tiền lệ cho tham số mảng ở query.** `main.ts:75-101` dùng `ValidationPipe` với `whitelist` + `forbidNonWhitelisted` và không bật `transform`, nên `@Transform` chạy **hai lần** (phải idempotent). Express 5 biến `?skillIds=a` thành chuỗi và `?skillIds=a&skillIds=b` thành mảng; `skillIds[]=a` bị `forbidNonWhitelisted` từ chối.
- **axios mặc định gửi mảng thành `skillIds[]=a&skillIds[]=b`** → API sẽ trả 400. Phải đặt `paramsSerializer: { indexes: null }` (đọc từ source axios 1.16; **ASSUMPTION** cho tới khi test ở Task 4 chạy thật).
- `Number('')` là 0 → `salaryMin=` rỗng trên URL sẽ thành "từ 0". Phải xử lý riêng.
- `GET /job-postings/:id` không có `ParseUUIDPipe`: nếu `filter-options` khai báo sau `:id` thì bị nuốt thành 404.
- `GET /skills` chỉ dành cho staff → trang công khai cần endpoint riêng (D3).
- Salary lưu dạng `Decimal`, tới web là **chuỗi** (`"15000000"`). Form recruiter chỉ có `placeholder="2000"`/`"4000"` không có nhãn đơn vị, còn phần hiển thị coi là VNĐ đầy đủ → dữ liệu cũ có thể lẫn đơn vị (xem Rủi ro).
- **Lỗi có sẵn, bạn đã chọn sửa luôn:** `JobCard`, `JobDetailHero`, `JobDetailSidebar` đọc `job.skills` nhưng API trả `jobPostingSkills[].skill` → chip kỹ năng chưa bao giờ hiện.

**Đã chốt:** D3 (lương + kỹ năng, endpoint công khai mới, kỹ năng khớp bất kỳ), D4 (bỏ ô địa điểm, chọn hình thức làm việc, không thêm cột), sửa chip kỹ năng trong lát này (bạn chọn 2026-10-04).

## Global Constraints

- Nhánh `feat/gd2-candidate-flows`, chạy lệnh từ `projects/ats-platform`. Commit theo từng task với đúng message trong plan; duyệt plan = duyệt các commit đó. **Không push, không merge.**
- Chỉ stage đúng file của task. Các thay đổi chưa commit của phiên khác (refactor header, `package.json`, `.claude/**`, các `CLAUDE.md`) giữ nguyên.
- **Không đụng `jobPostingIncludeOptions` và `sanitizeJobPosting`.** Việc "tin công khai lộ danh sách ứng viên và liên hệ recruiter" nằm ở task riêng đã tạo (chip "Stop public job postings leaking applicants…"); lát này chỉ sửa phần `where`.
- Không thêm dependency, không migration.
- **Quy tắc lương R4:** khoảng của ứng viên `[min, max]` (mỗi đầu tùy chọn) giao với khoảng của tin, biên tính cả hai đầu; tin chỉ có một đầu coi như khoảng một giá trị; tin không có lương bị loại khi đang lọc lương; `min > max` hoặc số âm → 400. **R5:** `skillIds` tối đa 20 UUID, khớp bất kỳ. **R6:** người không phải staff chỉ thấy tin `active` dù lọc gì.
- **Chữ cố định:** nhóm "Mức lương (VNĐ)" với hai ô "Từ", "Đến"; nhóm "Kỹ năng" (ẩn khi không có kỹ năng); lỗi "Mức lương tối thiểu không thể lớn hơn mức lương tối đa" (đúng câu API đã dùng); nút "Xóa bộ lọc" (có sẵn); ô trang chủ `aria-label="Hình thức làm việc"` với "Tất cả", "Remote", "Văn phòng", "Hybrid" (nhãn đã có trong `JobSearchClient`).
- **URL:** `salaryMin`, `salaryMax` (số nguyên), `skillIds` lặp khóa (`skillIds=a&skillIds=b`). Mọi thay đổi bộ lọc về trang 1.
- **Test:** web chọn phần tử bằng role và chữ hiển thị, không `data-testid`. API qua `npx nx test api`, web qua `npm run test:web`. NULL-semantics của lương chỉ chứng minh được trên PostgreSQL thật (Task 3), không phải bằng Prisma mock.

## Review Focus

1. Tin chỉ ghi một đầu lương, và tin không ghi lương, trả đúng theo R4 trên DB thật (ví dụ C11) — Task 1 (hình dạng `where`) và Task 3 (DB thật).
2. Lọc không làm lộ tin `draft` cho khách (R6), kể cả khi gửi `status=draft` kèm lương/kỹ năng — Task 1.
3. `salaryMin=` rỗng hoặc `salaryMax=0` không bị hiểu nhầm (rỗng → bỏ lọc; 0 → hợp lệ) — Task 1 (DTO) và Task 5 (page).
4. `skillIds` một giá trị (chuỗi) và nhiều giá trị (lặp khóa) đều hiểu đúng; đi qua axios không thành `skillIds[]` — Task 1 và Task 4.
5. URL xấu (`salaryMin=abc`, `skillIds` không phải UUID, `min > max`) không làm cả trang văng sang trang lỗi — Task 5.
6. `GET /job-postings/filter-options` không bị `:id` nuốt — Task 3 (stack thật).

---

### Task 0: Ghi thiết kế và plan vào repo
- [ ] Thêm "Thiết kế lát 3 (duyệt 2026-10-04)" vào `spec.md`, sau "Thiết kế lát 2": nội dung là các mục Context và Global Constraints ở trên.
- [ ] Thêm **D10 — Sửa chip kỹ năng trên thẻ việc làm công khai trong lát 3** vào `decision.md` (hai phương án: sửa luôn có test đỏ trước / chỉ ghi nhận; người dùng chọn sửa luôn).
- [ ] Lưu plan này thành `docs/tasks/gd2-week1/plan-slice3-job-filter.md`.
- [ ] Commit `docs(tasks): add GĐ2 slice 3 job filter design and plan`.

### Task 1: API — lọc lương và kỹ năng (C10, R4, R5, R6, E15, E16)
**Files:**
- Modify: `apps/api/src/app/job-postings/dto/job-posting.dto.ts` (`FindJobPostingsQueryDto`), `job-postings.service.ts` (`findAll`)
- Create: `apps/api/src/app/job-postings/job-posting-filters.ts` (+ `.spec.ts`)
- Test: `dto/job-posting.dto.spec.ts`, `job-postings.service.spec.ts`

**Produces:**
- `FindJobPostingsQueryDto` thêm `salaryMin?: number`, `salaryMax?: number`, `skillIds?: string[]`.
  - Lương: `@Transform` bỏ `''`, còn lại `Number(value)`; `@IsNumber() @Min(0)`. Idempotent vì `@Transform` chạy hai lần.
  - `skillIds`: `@Transform` đưa chuỗi đơn thành mảng một phần tử (giữ nguyên nếu đã là mảng, bỏ qua khi `undefined`); `@IsArray() @ArrayMaxSize(20) @IsUUID(undefined, { each: true })`.
- `jobPostingFilters(query): Prisma.JobPostingWhereInput[]` trong `job-posting-filters.ts`, trả các điều kiện để service nối vào `AND`:
  - có `salaryMin`: `OR [{ salaryMax: { gte: min } }, { salaryMax: null, salaryMin: { gte: min } }]`;
  - có `salaryMax`: `OR [{ salaryMin: { lte: max } }, { salaryMin: null, salaryMax: { lte: max } }]`;
  - có `skillIds` (không rỗng): `{ jobPostingSkills: { some: { skillId: { in: skillIds } } } }`.
- `findAll`: nếu `salaryMin > salaryMax` → `BadRequestException('Mức lương tối thiểu không thể lớn hơn mức lương tối đa')` **trước** khi gọi Prisma; `where.AND` chứa các điều kiện trên; phần `status` (non-staff luôn `active`) giữ nguyên.

- [ ] **1.1 Test đỏ — `job-posting-filters.spec.ts`:** không có tham số → `[]`; chỉ `salaryMin` → đúng một điều kiện OR như trên; chỉ `salaryMax`; cả hai → hai điều kiện; `salaryMax: 0` vẫn tạo điều kiện (0 hợp lệ, RF3); `skillIds: []` → không tạo điều kiện; `skillIds: ['a','b']` → `in: ['a','b']`.
- [ ] **1.2 Test đỏ — `job-posting.dto.spec.ts`** (dùng `pipe.transform(query, { type: 'query', metatype })` như file đang có): `salaryMin: '15000000'` → số 15000000; `salaryMin: ''` → không có khóa (RF3); `salaryMin: '-1'` → lỗi; `salaryMin: 'abc'` → lỗi; `skillIds: uuid` (chuỗi đơn) → mảng một phần tử; `skillIds: [uuid1, uuid2]` giữ nguyên; `skillIds: 'khong-phai-uuid'` → lỗi; 21 UUID → lỗi (E16); đúng 20 → hợp lệ; chạy `transform` hai lần liên tiếp không đổi kết quả.
- [ ] **1.3 Test đỏ — `job-postings.service.spec.ts`** (theo mẫu `it.each` locationType ở dòng 144-157): `salaryMin` → `where.AND` chứa điều kiện của `jobPostingFilters`; `count` nhận cùng `where`; khách + `status: 'draft'` + `salaryMin` → `where.status === 'active'` (RF2/R6); recruiter/admin giữ phạm vi tổ chức khi lọc; `salaryMin = salaryMax = 15000000` hợp lệ (E15); `salaryMin > salaryMax` → `BadRequestException` và `findMany` không được gọi.
- [ ] **1.4** Chạy `npx nx test api --runInBand --silent --testPathPatterns="job-postings"` → các test mới FAIL.
- [ ] **1.5** Implement theo **Produces**.
- [ ] **1.6** Test api xanh; `npx nx lint api` không vượt 300 warning.
- [ ] **1.7** Commit `feat(api): filter job postings by salary range and skills`.

### Task 2: API — `GET /job-postings/filter-options` (C12, E6)
**Files:** `apps/api/src/app/job-postings/job-postings.service.ts`, `job-postings.controller.ts`, `job-postings.service.spec.ts`, `job-postings.controller.spec.ts`

**Produces:** `JobPostingsService.getFilterOptions(): Promise<{ skills: { skillId: string; name: string }[] }>` — `prisma.skill.findMany({ where: { jobPostingSkills: { some: { jobPosting: { status: JobStatus.active } } } }, select: { skillId: true, name: true }, orderBy: { name: 'asc' } })`. Controller: `@UseGuards(OptionalJwtAuthGuard) @Get('filter-options')` khai báo **giữa `findAll` và `:id`**.

- [ ] **2.1 Test đỏ:** service gọi `skill.findMany` đúng `where`/`select`/`orderBy` và trả `{ skills }`; rỗng → `{ skills: [] }` (E6); controller `filterOptions()` ủy quyền cho service, không cần đăng nhập; cập nhật `createService()` trong controller spec (liệt kê method tường minh).
- [ ] **2.2** Chạy test → FAIL. **2.3** Implement. **2.4** Test api xanh; lint không vượt 300.
- [ ] **2.5** Commit `feat(api): add the public job filter options endpoint`.

### Task 3: Kiểm chứng trên PostgreSQL thật (C11, C12, RF1, RF6)
Không có file nào được commit ngoài log. Chạy trên test stack (`ats_test`, API cổng 55000), không đụng DB dev.
- [ ] `docker compose -f docker-compose.test.yml up -d --build --wait` (build lại API từ source hiện tại).
- [ ] Script tạm trong workspace `.superpowers/sdd/plan-slice3-job-filter/` (chạy dưới `TZ=UTC`, dọn sạch sau khi chạy): tạo 1 tổ chức + 4 tin `active` có `title` chứa `runId`: **[10tr–20tr]**, **[chỉ min 15tr]**, **[chỉ max 8tr]**, **[không lương]**; thêm 1 tin `draft` lương khớp và 2 kỹ năng (`runId` trong tên) gắn: kỹ năng A vào tin 1 và 3, kỹ năng B vào tin `draft`.
- [ ] Kiểm: `salaryMin=12000000` → tin 1, 2; `salaryMax=9000000` → chỉ tin 3; `[12tr, 16tr]` → tin 1, 2; tin `draft` không bao giờ hiện cho khách; `skillIds=A` → tin 1, 3; `skillIds=A&skillIds=B` → tin 1, 3 (tin `draft` vẫn không hiện); `GET /job-postings/filter-options` (không đăng nhập) → 200, có A, **không có B**, sắp theo tên, không trùng, và **không** là 404 do `:id` (RF6); `salaryMin=abc`, `salaryMin=-1`, `salaryMin=20&salaryMax=10`, 21 `skillIds` → 400; `salaryMin=` (rỗng) → 200 như không lọc (RF3).
- [ ] Nếu NULL-semantics sai → dừng, sửa Task 1 theo TDD (test đỏ trước) rồi chạy lại.
- [ ] Lưu log vào `docs/tasks/gd2-week1/results/slice3-api-smoke.log`; commit `test(api): record the job filter probe on the real database`.

### Task 4: Web — kiểu dữ liệu, action, helper nhập lương (E15, RF4)
**Files:** `apps/web/src/types/interfaces/job-posting.interface.ts`, `apps/web/src/servers/job-postings/job-postings.action.ts` (+ `.test.ts` có sẵn), `apps/web/src/lib/salary-input.ts` (+ test), `apps/web/src/lib/work-types.ts`

**Produces:**
- `IFindJobPostingsQuery` thêm `salaryMin?: number; salaryMax?: number; skillIds?: string[]`; `IJobFilterOptions = { skills: { skillId: string; name: string }[] }`.
- `getJobPostingsAction` đưa `salaryMin`/`salaryMax` (kể cả `0`) và `skillIds` vào `params`; luôn kèm `paramsSerializer: { indexes: null }` để mảng đi thành khóa lặp. Cập nhật assertion cũ ở `job-postings.action.test.ts:47` cho khớp cấu hình mới (đổi hợp đồng, không phải sửa test cho xanh).
- `getJobFilterOptionsAction(): Promise<IJobFilterOptions>` — `GET /job-postings/filter-options`; khi lỗi (không phải điều hướng của Next) trả `{ skills: [] }` để trang vẫn tìm được (gọi `unstable_rethrow` trước).
- `parseSalaryInput(text: string): number | null | 'invalid'` — bỏ dấu chấm, phẩy, khoảng trắng; `''` → `null`; `'15.000.000'` → `15000000` (E15); chữ, số âm, số thập phân → `'invalid'`. `formatSalaryInput(value: number): string` → `'15.000.000'`.
- `WORK_TYPES` và nhãn (`remote`/`onsite`/`hybrid` → "Remote"/"Văn phòng"/"Hybrid") chuyển từ `JobSearchClient` sang `lib/work-types.ts` để trang chủ dùng chung.

- [ ] **4.1 Test đỏ:** `salary-input.test.ts` (các ca trên, thêm `'0'` → 0, `'  12 000 000 '` → 12000000); `job-postings.action.test.ts`: params có `salaryMin: 0`, `skillIds`, `paramsSerializer`; tạo URL thật bằng `axios.getUri` với cấu hình đó → `skillIds=a&skillIds=b` và **không** có `[]` (xác nhận ASSUMPTION axios, RF4); `getJobFilterOptionsAction` gọi đúng đường dẫn, trả `{ skills }`; lỗi → `{ skills: [] }`.
- [ ] **4.2** Chạy `npm run test:web` → FAIL. **4.3** Implement. **4.4** Test web, `typecheck:web`, `lint:web` xanh (0 warning).
- [ ] **4.5** Commit `feat(web): send job salary and skill filters and read the filter options`.

### Task 5: Web — trang việc làm và panel bộ lọc (C13, E6, E15, E17, RF3, RF5)
**Files:** `apps/web/src/app/(public)/job-postings/page.tsx` (+ `page.test.tsx`), `apps/web/src/components/public/jobs/JobSearchClient.tsx` (+ `JobSearchClient.test.tsx`)

**Produces:**
- `page.tsx`: `searchParams` gồm thêm `salaryMin`, `salaryMax`, `skillIds` (`string | string[]`). Phân tích rồi bỏ giá trị xấu thay vì để API trả 400: lương chỉ nhận số nguyên không âm; `skillIds` chỉ nhận UUID, tối đa 20; nếu `salaryMin > salaryMax` thì bỏ cả hai. Gọi song song `getJobPostingsAction`, `getViewerJobCategoriesAction` và `getJobFilterOptionsAction`.
- `JobSearchClient` props thêm `skills` và `initialQuery.salaryMin/salaryMax/skillIds`. Trong panel "Bộ lọc": nhóm "Mức lương (VNĐ)" với hai ô "Từ"/"Đến" (hiển thị có dấu chấm ngăn nghìn), nhóm "Kỹ năng" là các nút bật/tắt (cuộn khi dài; ẩn cả nhóm nếu `skills` rỗng). `applyFilters` ghi `salaryMin`, `salaryMax`, `skillIds` lặp khóa; luôn về trang 1; `clearFilters` xóa cả ba và đi về `/job-postings`. `min > max` → hiện câu lỗi cố định, không điều hướng.

- [ ] **5.1 Test đỏ — `page.test.tsx`:** `salaryMin=12000000&skillIds=<uuid>` → action nhận số 12000000 và `['<uuid>']`; `skillIds` lặp khóa → mảng; `salaryMin=abc`, `salaryMin=` (rỗng), `skillIds=khong-phai-uuid` → bị bỏ, trang vẫn render (RF5, RF3); `salaryMin=20&salaryMax=10` → bỏ cả hai; 21 UUID → chỉ giữ 20.
- [ ] **5.2 Test đỏ — `JobSearchClient.test.tsx`** (mock `next/navigation` với `push` kiểm được; render có `motion/react` như `MutateInterviewScheduleModal.test.tsx`): nhập "15.000.000" vào "Từ" rồi tìm → `push` với `salaryMin=15000000`; "Từ" > "Đến" → thấy câu lỗi, `push` không được gọi; bấm hai kỹ năng → URL có hai `skillIds`; đang ở `page=3` rồi đổi bộ lọc → URL không còn `page` (E17); "Xóa bộ lọc" → `push('/job-postings')`; `skills: []` → không có nhóm "Kỹ năng" (E6); `initialQuery` điền sẵn hai ô lương và nút kỹ năng đã chọn có `aria-pressed="true"`.
- [ ] **5.3** Chạy test → FAIL. **5.4** Implement. **5.5** Test web, `typecheck:web`, `lint:web` xanh.
- [ ] **5.6 Xem trên trình duyệt:** dùng cấu hình `ats-web-test-stack` và dữ liệu seed tạm (như lát 2), ở 1280 và 390px: panel lọc không tràn ngang, chip không cắt chữ; chụp vào `docs/tasks/gd2-week1/media/slice3-*.jpg`, rồi dọn seed. Nếu `apps/web` vẫn bị một `next dev` khác giữ thì **không tự tắt**, ghi là chưa xem.
- [ ] **5.7** Commit `feat(web): add salary and skill filters to the job search`.

### Task 6: Web — trang chủ chọn hình thức làm việc (C14, D4)
**Files:** `apps/web/src/components/public/home/HomeHero.tsx` (+ `HomeHero.test.tsx`)

**Bước:**
- [ ] **6.1 Test đỏ:** không còn ô "Địa điểm (chưa hỗ trợ)"; có `combobox` "Hình thức làm việc" (mặc định "Tất cả"); chọn "Remote" rồi bấm "Tìm" kèm từ khóa "react" → `push('/job-postings?q=react&locationType=remote')`; để "Tất cả" → URL không có `locationType`; chip từ khóa phổ biến vẫn đi `?q=`.
- [ ] **6.2** Implement: thay ô khóa bằng `<select aria-label="Hình thức làm việc">` dùng `WORK_TYPES` từ `lib/work-types.ts`; bỏ import `MapPin` nếu không còn dùng.
- [ ] **6.3** Test/typecheck/lint web xanh. **6.4** Commit `feat(web): pick the work type on the home search`.

### Task 7: Sửa chip kỹ năng trên thẻ việc làm (D10, lỗi có sẵn — hai commit)
**Files:** `apps/web/src/lib/job-skills.ts`, `components/public/jobs/JobCard.tsx`, `detail/JobDetailHero.tsx`, `detail/JobDetailSidebar.tsx` (+ test cho từng component)

**Produces:** `jobSkillsOf(job: IJobPostingDto): { skillId: string; name: string }[]` đọc `jobPostingSkills[].skill`.

- [ ] **7.1 Test đỏ (commit riêng):** `JobCard` với tin có `jobPostingSkills` ["React", "NestJS", "SQL", "Docker"] hiện 3 tên đầu và "+1"; tin không có kỹ năng → không có khối chip; hai component chi tiết hiện đủ tên. Chạy thấy fail đúng lý do (chip không hiện).
- [ ] **7.2** Commit `test(web): reproduce public job cards never showing their skills`.
- [ ] **7.3** Implement `jobSkillsOf` và đổi ba component đọc qua nó. Test/typecheck/lint xanh.
- [ ] **7.4** Commit `fix(web): show the skills of a job on its public cards`.

### Task 8: E2E — hành trình lọc (C11–C14)
**Files:** `apps/web/e2e/support/gd2-fixtures.mjs` (hàm mới `createGd2JobFilterFixtures`, `cleanupGd2JobFilterFixtures`), `apps/web/e2e/gd2-job-filter.e2e.ts`

**Bước:**
- [ ] Fixture như Task 3 (4 tin lương, 1 tin draft, 2 kỹ năng với `runId` trong tên); dọn cả `skills` theo `runId` vì bảng này không có `organization_id`.
- [ ] Spec (khách, không đăng nhập; mọi tìm kiếm kèm `runId` để tách khỏi dữ liệu khác): mở `/job-postings?q=<runId>`, bấm "Bộ lọc", gõ "12.000.000" vào "Từ" → URL có `salaryMin=12000000`, thấy tin 1, 2, không thấy tin 3, 4, draft; "Đến" = "9.000.000" kèm "Từ" trống → chỉ tin 3; chọn kỹ năng A → tin 1, 3; "Xóa bộ lọc" → về `/job-postings`; kỹ năng của tin draft không có trong danh sách; trang chủ: chọn "Hybrid" rồi tìm → URL `locationType=hybrid`; viewport 390px không tràn ngang.
- [ ] Chạy `npm run typecheck:web` và `playwright test --list --grep "GĐ2"`.
- [ ] Máy này không có trình duyệt Playwright → phần API đã chạy ở Task 3; hành trình trình duyệt chạy ở job `web-e2e` của CI khi có PR.
- [ ] Commit `test(web): add the job search filter journey`.

### Task 9: Kiểm chứng toàn bộ và ghi kết quả
- [ ] Chạy `npx nx test api --runInBand`, `npm run test:web`, `typecheck:web`, `lint:web`, `npx nx lint api`, `npx nx build api`; lưu log `results/slice3-*.log`.
- [ ] `README.md` thêm mục "Lát 3": bảng tiêu chí → test → kết quả, mục chưa xác minh, rủi ro đơn vị lương; cập nhật dòng trạng thái đầu file ("cả ba lát đã code").
- [ ] Tick dòng roadmap "Job search: filter by category, location type, salary, skill".
- [ ] Brain (`.claude/knowledge-base/ats-platform/context.md`): tham số mảng ở query phải lặp khóa (axios `indexes: null`, Express 5 `simple` parser, `@Transform` chạy hai lần), `Number('')` là 0, salary đến web là chuỗi; cập nhật dòng trạng thái.
- [ ] Commit `docs: record GĐ2 slice 3 results`.
- [ ] Review cuối toàn lát bằng một reviewer mới trên model `opus`; sửa Critical/Important theo TDD (test đỏ commit trước), rồi báo bạn kèm danh sách ruling.

## Rủi ro đã biết (không phải việc của lát này)
- **Đơn vị lương không thống nhất.** Form recruiter không ghi đơn vị (`placeholder` 2000/4000) còn phần hiển thị coi là VNĐ đầy đủ. Bộ lọc coi số đã lưu là VNĐ (D3 "cùng đơn vị đang lưu"); tin do recruiter nhập theo đơn vị khác sẽ không khớp mức lương ứng viên gõ. Sửa phần nhập của recruiter là việc riêng.
- **Staff mở trang công khai** vẫn chỉ thấy tin của tổ chức mình (E19) — giữ nguyên.
- **Trùng file với task "tin công khai lộ dữ liệu":** hai việc cùng nằm trong `job-postings.service.ts`; lát này chỉ đụng `findAll` (phần `where`), task kia đụng `include`. Nếu chạy song song trên hai nhánh thì có thể phải giải quyết xung đột khi gộp.

## Verification
- **Unit:** api (Task 1–2) và web (Task 4–7) xanh; typecheck, lint, build exit 0.
- **PostgreSQL thật (Task 3):** bốn tin lương cho đúng tập kết quả của C11; `filter-options` trả đúng và không bị `:id` nuốt; tin `draft` không bao giờ hiện cho khách; các giá trị xấu trả 400.
- **Trình duyệt:** panel lọc và trang chủ ở 1280 và 390px không tràn ngang; URL phản ánh bộ lọc.
- **E2E:** chạy ở CI (`web-e2e`) khi mở PR vào `dev`; ở máy này **chưa chạy được** vì không có trình duyệt Playwright.
