# Lát 1 — Lịch phỏng vấn của ứng viên: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ứng viên xem được lịch phỏng vấn của mình ở `/my-interviews` với đúng giờ, link hoặc địa điểm, chỉ nhận dữ liệu tối thiểu; lịch tự hủy khi đơn bị từ chối/rút; recruiter chọn được hình thức phỏng vấn.

**Architecture:** API thêm cột `location`, một select riêng cho ứng viên (`candidateScheduleSelect`), tham số `order`, và hủy lịch trong transaction đổi trạng thái đơn. Web sửa defect múi giờ (trình duyệt quy đổi giờ, server action chỉ kiểm ISO), mở rộng form recruiter, thêm trang ứng viên chia nhóm theo R10 ở client.

**Tech Stack:** NestJS 11 + Prisma 7 (PostgreSQL), Jest qua `nx`; Next.js 16 App Router + React 19, Vitest + Testing Library; Playwright trên `docker-compose.test.yml`.

**Spec:** [`spec.md`](spec.md) — mục "Cách triển khai", "Thiết kế lát 1", R1–R3, R7–R10, C1–C6, C15 (phần lịch), C16–C19, E1–E3, E7–E11, E14, E18. Bằng chứng: [`survey.md`](survey.md); lựa chọn: [`decision.md`](decision.md) D1, D2, D5–D7.

## Global Constraints

- Không commit/push khi người dùng chưa duyệt. Mỗi bước "Commit" là **đề xuất** theo giao thức 4 bước (`rules/git-conventions.md`): báo nhánh, `git status --short`, kế hoạch commit, chờ duyệt. Task 1 là defect: commit RED **phải** vào trước commit fix — dừng sau Step 1.3 để xin duyệt.
- Nhánh: `feat/gd2-candidate-flows`. Lệnh chạy từ `projects/ats-platform`.
- Không thêm dependency. Dùng sẵn `class-validator`, `class-transformer`, `pg`, `bcrypt`.
- Thông báo cho người dùng bằng tiếng Việt, log bằng tiếng Anh. Chuỗi cố định: `Phỏng vấn trực tiếp cần địa điểm` · `Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ` · `Địa điểm tối đa 255 ký tự` · `Ngày hoặc giờ phỏng vấn không hợp lệ` (đã có).
- Payload của staff không đổi (R1). Candidate/CV dùng chung giữa tổ chức; mọi đọc phía ứng viên lọc theo chính ứng viên.
- Migration viết tay, chỉ thêm cột. **Không** chạy `prisma migrate deploy/reset` vào DB dev (`ats-postgres`) khi chưa hỏi; test stack tự migrate khi API khởi động (`apps/api/Dockerfile:51`).
- Test web dùng role và chữ hiển thị, không `data-testid`. Test API qua `npx nx test api`; web qua `npm run test:web`.
- E2E chỉ dùng test stack (API `localhost:55000`, DB `ats_test`), chạy với `TZ=UTC` cho tiến trình Playwright/Next (đã kiểm: Node trên Windows tôn trọng `TZ`) và `timezoneId: 'Asia/Ho_Chi_Minh'` cho trình duyệt.
- Chữ trên UI (cố định): nhóm "Sắp tới", "Đã qua & đã hủy"; nhãn "Đang diễn ra", "Đã diễn ra", "Đã hủy", "Hoàn thành"; hình thức "Trực tuyến", "Trực tiếp"; fallback "Nhà tuyển dụng sẽ gửi địa điểm"; trống "Bạn chưa có lịch phỏng vấn nào"; menu "Lịch phỏng vấn"; link thẻ đơn "Xem lịch phỏng vấn"; nút link "Tham gia phòng họp"; phân trang "Xem thêm"; trường form "Địa điểm", "Đường dẫn phòng họp".

## Review Focus

1. Địa điểm chỉ toàn khoảng trắng phải bị từ chối như thiếu địa điểm — test ở Task 2.
2. Link có khoảng trắng hai đầu hoặc scheme viết hoa (`  HTTPS://meet.x/y  `) được cắt khoảng trắng và chấp nhận — test ở Task 2.
3. Lịch onsite cũ (`location = null`) chỉ đổi thời lượng vẫn lưu được, địa điểm vẫn `null` — test ở Task 2.
4. Ứng viên có lịch ở hai tổ chức nhận đủ cả hai: điều kiện lọc không được có `organizationId` — test ở Task 3.
5. Buổi có `startAt + durationMinutes` **bằng đúng** `now` thuộc "Đã qua & đã hủy" (so sánh `>` nghiêm ngặt) — test ở Task 6.

---

### Task 1: Defect — giờ phỏng vấn lệch theo múi giờ server (C17)

**Files:**
- Create: `apps/web/src/lib/interview-time.ts`, `apps/web/src/lib/interview-time.test.ts`
- Create: `apps/web/src/servers/interviews/interviews.action.test.ts`
- Modify: `apps/web/src/servers/interviews/interviews.action.ts:40-96` (bỏ `toLocalDateTimeIso`, `normalizeSchedulePayload` đọc `startAt`)
- Modify: `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx:183-209` (ngày/giờ thành state, thêm input ẩn `startAt`)

**Interfaces:**
- Produces: `localDateTimeToIso(date: string, time: string): string | null` và `isAbsoluteIso(value: string): boolean` trong `apps/web/src/lib/interview-time.ts`. FormData của form lịch có thêm trường `startAt` (ISO UTC). Task 5 dùng cả hai.

- [ ] **Step 1.1: Viết test RED cho server action** — file `// @vitest-environment node`, mock `@/lib/http` và `next/cache` theo khuôn `users.action.test.ts`; đặt `process.env.TZ = 'UTC'` ở đầu file, khôi phục trong `afterAll`.
  - `it('sends the browser-converted start time even when the server runs in UTC')`: form `{ applicationId: 'app-1', interviewerId: 'user-2', scheduledDate: '2026-10-05', scheduledTime: '09:00', startAt: '2026-10-05T02:00:00.000Z', durationMinutes: '60' }` → `createInterviewScheduleAction` gọi `post('/interviews/schedules', expect.objectContaining({ startAt: '2026-10-05T02:00:00.000Z' }))`.
  - `it('refuses a start time without an explicit offset')`: `startAt: '2026-10-05T09:00:00'` → `{ success: false, message: 'Ngày hoặc giờ phỏng vấn không hợp lệ' }`, `post` không được gọi.
  - `it('refuses a missing start time')`: không có `startAt` → cùng thông báo, `post` không được gọi.
- [ ] **Step 1.2: Chạy, thấy đỏ đúng lý do** — `npm run test:web -- src/servers/interviews/interviews.action.test.ts`. Expected: FAIL ở test 1 với received `startAt: '2026-10-05T09:00:00.000Z'`. Lưu output vào `docs/tasks/gd2-week1/results/slice1-tz-red.txt`.
- [ ] **Step 1.3: Đề xuất commit RED** — `test(web): reproduce interview start time shifted by the server timezone`. **Dừng, chờ duyệt.**
- [ ] **Step 1.4: Test cho helper** — `interview-time.test.ts`, đặt `process.env.TZ = 'Asia/Ho_Chi_Minh'` (khôi phục `afterAll`): `localDateTimeToIso('2026-10-05', '09:00') === '2026-10-05T02:00:00.000Z'`; `('2026-13-40','09:00')`, `('', '09:00')`, `('2026-10-05','')` → `null`; `isAbsoluteIso('2026-10-05T02:00:00.000Z') === true`, `isAbsoluteIso('2026-10-05T09:00:00+07:00') === true`, `isAbsoluteIso('2026-10-05T09:00:00') === false`, `isAbsoluteIso('abc') === false`.
- [ ] **Step 1.5: Implement helper** — `localDateTimeToIso` dựng `Date` từ `${date}T${time}` (hiểu theo múi giờ của môi trường chạy — ở trình duyệt là múi giờ người dùng), trả `null` nếu không hợp lệ; `isAbsoluteIso` = parse được và kết thúc bằng `Z` hoặc `±hh:mm`.
- [ ] **Step 1.6: Sửa action** — `normalizeSchedulePayload` đọc `startAt`, nếu `!isAbsoluteIso` trả lỗi `Ngày hoặc giờ phỏng vấn không hợp lệ`; gửi đúng chuỗi đó. Xóa `toLocalDateTimeIso`.
- [ ] **Step 1.7: Sửa modal** — `scheduledDate`/`scheduledTime` thành controlled state (giá trị đầu giữ `formatInputDate`/`formatInputTime` như cũ); thêm `<input type="hidden" name="startAt" value={localDateTimeToIso(date, time) ?? ''} />`.
- [ ] **Step 1.8: Test modal** — trong `MutateInterviewScheduleModal.test.tsx` (mới; mock action và `@/lib/toast` theo khuôn `AddUserModal.test.tsx`), `TZ = 'Asia/Ho_Chi_Minh'`: `it('carries the start time converted in the browser')` — đổi ngày `2026-10-05`, giờ `09:00` → input ẩn `startAt` có value `2026-10-05T02:00:00.000Z`; `it('prefills the local time when editing')` — `schedule.startAt = '2026-10-05T02:00:00.000Z'` → ô giờ hiện `09:00`, ô ngày `2026-10-05`.
- [ ] **Step 1.9: Chạy, thấy xanh** — `npm run test:web`. Expected: tất cả pass (130 cũ + test mới). Lưu `results/slice1-tz-green.txt`.
- [ ] **Step 1.10: Đề xuất commit fix** — `fix(web): convert the interview start time in the browser`.

### Task 2: Cột `location` và quy tắc hình thức phỏng vấn (R3, R9)

**Files:**
- Modify: `libs/backend/database/prisma/schema.prisma:607-626` — thêm `location String? @db.VarChar(255)`
- Create: `libs/backend/database/prisma/migrations/20261005000000_add_interview_schedule_location/migration.sql` — `ALTER TABLE "interview_schedules" ADD COLUMN "location" VARCHAR(255);`
- Modify: `apps/api/src/app/interviews/dto/create-interview.dto.ts`, `update-interview.dto.ts`
- Modify: `apps/api/src/app/interviews/interviews.service.ts:260-323` (`assertCanMutateSchedule` select thêm `interviewType`, `location`, `onlineMeetingLink`; `createSchedule` lưu `location`), `:403-459` (`updateSchedule`)
- Create: `apps/api/src/app/interviews/dto/interview-schedule.dto.spec.ts`
- Test: `apps/api/src/app/interviews/interviews.service.spec.ts`

**Interfaces:**
- Produces: `InterviewSchedule.location: string | null` (Prisma); `CreateInterviewScheduleDto.location?: string`, `UpdateInterviewScheduleDto.location?: string`. Task 3 chọn trường này; Task 5 gửi nó.

- [ ] **Step 2.1: Test DTO (đỏ)** — dùng `plainToInstance` + `validate`. Tạo: onsite thiếu `location` → lỗi ở `location`; onsite `location: '   '` → lỗi; `location` 256 ký tự → lỗi `Địa điểm tối đa 255 ký tự`; online thiếu link → lỗi ở `onlineMeetingLink`; online `'javascript:alert(1)'` → lỗi; online `'  HTTPS://meet.example.com/abc  '` → hợp lệ và sau transform bằng `'HTTPS://meet.example.com/abc'`; onsite `'Tầng 5, 123 Lê Lợi, Q.1'` → hợp lệ. Sửa: chỉ `{ durationMinutes: 90 }` → hợp lệ.
- [ ] **Step 2.2: Test service (đỏ)** — `describe('updateSchedule — interview type')`, schedule giả lập có `interviewType`, `location`, `onlineMeetingLink`:
  - `it('clears the meeting link when switching to onsite')`: dto `{ interviewType: onsite, location: 'Tầng 5' }` → `update` nhận `data` chứa `{ interviewType: 'onsite', location: 'Tầng 5', onlineMeetingLink: null }`.
  - `it('clears the location when switching to online')`: dto `{ interviewType: online, onlineMeetingLink: 'https://meet.example.com/x' }` → `data` chứa `location: null`.
  - `it('refuses switching to onsite without a location')`: schedule cũ `location: null` → `BadRequestException('Phỏng vấn trực tiếp cần địa điểm')`, `update` không được gọi.
  - `it('lets a legacy onsite schedule without location change only its duration')`: dto `{ durationMinutes: 90 }` → `update` được gọi, `data` không có khóa `location`.
  - `it('stores the location of a new onsite schedule')`: `createSchedule` với `location` → `create` nhận `data.location`.
- [ ] **Step 2.3: Chạy, thấy đỏ** — `npx nx test api --testFile=interviews` . Expected: các test mới FAIL.
- [ ] **Step 2.4: Schema + migration** — sửa schema, viết `migration.sql`, chạy `npx prisma generate --config libs/backend/database/prisma.config.ts`, `npx prisma validate --config libs/backend/database/prisma.config.ts`. Expected: generate thành công, validate không lỗi.
- [ ] **Step 2.5: DTO** — `location`: `@Transform` cắt khoảng trắng, `@ValidateIf(o => o.interviewType === InterviewType.onsite)` + `@IsNotEmpty({ message: 'Phỏng vấn trực tiếp cần địa điểm' })` ở DTO tạo, `@MaxLength(255, { message: 'Địa điểm tối đa 255 ký tự' })`. `onlineMeetingLink`: `@Transform` cắt khoảng trắng, `@IsUrl({ protocols: ['http','https'], require_protocol: true }, { message: 'Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ' })`, bắt buộc khi `online` ở DTO tạo. DTO sửa: cả hai `@IsOptional`, cùng ràng buộc định dạng.
- [ ] **Step 2.6: Service** — `updateSchedule`: nếu dto có một trong `interviewType`/`location`/`onlineMeetingLink` thì tính bộ ba sau khi gộp, áp R9 (đổi sang onsite → `onlineMeetingLink = null`; sang online → `location = null`) rồi kiểm R3 bằng hai thông báo cố định; không đụng tới khi dto không có ba trường đó.
- [ ] **Step 2.7: Chạy, thấy xanh** — `npx nx test api`. Expected: 462 cũ + mới đều pass.
- [ ] **Step 2.8: Đề xuất commit** — `feat(api,db): add interview location and require it per interview type`.

### Task 3: Payload tối thiểu cho ứng viên và tham số `order` (C1, C2, C19)

**Files:**
- Modify: `apps/api/src/common/utils/include-options.util.ts:119-143` — thêm `candidateScheduleSelect`
- Modify: `apps/api/src/app/interviews/dto/get-interview-schedules-query.dto.ts` — thêm `order`
- Modify: `apps/api/src/app/interviews/interviews.service.ts:325-401` (`getMySchedules`, `getScheduleById`)
- Test: `apps/api/src/app/interviews/interviews.service.spec.ts`

**Interfaces:**
- Consumes: `location` từ Task 2.
- Produces: `candidateScheduleSelect satisfies Prisma.InterviewScheduleSelect`, đúng các khóa: `interviewId`, `startAt`, `durationMinutes`, `interviewType`, `onlineMeetingLink`, `location`, `status`, `interviewer: { select: { fullName: true } }`, `application: { select: { applicationId: true, jobPosting: { select: { jobId: true, title: true, organization: { select: { name: true } } } } } }`. `GetInterviewSchedulesQueryDto.order?: 'asc' | 'desc'` (mặc định `asc`). Task 5 mô phỏng đúng dạng này ở web.

- [ ] **Step 3.1: Test (đỏ)**:
  - `it('returns only the candidate-safe fields of my schedules')`: candidate gọi `getMySchedules` → `findMany` nhận `select: candidateScheduleSelect` và **không** có `include`; `where` là `{ application: { candidateId: 'cand-1' } }` không có `organizationId` (Review Focus 4).
  - `it('describes the candidate payload exactly')`: `candidateScheduleSelect.interviewer` bằng `{ select: { fullName: true } }`; `candidateScheduleSelect` không có `scheduler`; `application.select` chỉ có `applicationId` và `jobPosting`.
  - `it('keeps the full schedule payload for staff')`: platform admin → `findMany` nhận `include: scheduleIncludeOptions`.
  - `it('gives a candidate the minimal payload of its own schedule')`: `getScheduleById` (chủ sở hữu) → `findUnique` nhận `select: candidateScheduleSelect`.
  - `it('sorts my schedules descending when order is desc')`: `order: 'desc'` → `orderBy: { startAt: 'desc' }`; không truyền → `{ startAt: 'asc' }`.
  - `it('refuses a candidate the schedule of another candidate')` (C2): `application.candidate.userId` khác người gọi → `ForbiddenException`, `findUnique` lấy dữ liệu lịch không được gọi lần hai. *(Hành vi đã có; test giữ nó khi rẽ nhánh mới.)*
  - `it('still answers 404 for a candidate account without a profile')` (E7): `candidate.findUnique` trả `null` → `NotFoundException('Không tìm thấy hồ sơ ứng viên')`.
- [ ] **Step 3.2: Chạy, thấy đỏ** — `npx nx test api --testFile=interviews.service.spec.ts`. Expected: 5 test đầu FAIL; hai test hành vi cũ pass ngay (đó là ý định — chúng chống hồi quy).
- [ ] **Step 3.3: Implement** — thêm select; `order` với `@IsOptional() @IsIn(['asc','desc'])`; hai method rẽ nhánh `caller.role === UserRole.candidate` dùng `select`, nhánh staff giữ `include`.
- [ ] **Step 3.4: Chạy, thấy xanh** — `npx nx test api`. Expected: tất cả pass.
- [ ] **Step 3.5: Đề xuất commit** — `feat(api): return a minimal schedule payload to candidates`.

### Task 4: Đơn đóng thì lịch tương lai tự hủy (R7, C16, E14)

**Files:**
- Modify: `apps/api/src/test-utils/unit-test-helpers.ts:66-74` — thêm `'updateMany'` vào `interviewSchedule`
- Modify: `apps/api/src/app/applications/applications.service.ts:287-339` (`withdraw`), `:505-573` (`updateStatus`)
- Test: `apps/api/src/app/applications/applications.service.spec.ts`

**Interfaces:**
- Produces: `private async cancelUpcomingSchedules(tx: Prisma.TransactionClient, applicationId: string): Promise<void>` — `tx.interviewSchedule.updateMany({ where: { applicationId, status: ScheduleStatus.scheduled, startAt: { gt: new Date() } }, data: { status: ScheduleStatus.cancelled } })`.

- [ ] **Step 4.1: Test (đỏ)** — theo khuôn test `updateStatus` hiện có (`createPrismaTransactionMock`):
  - `it('cancels the upcoming interviews when an application is rejected')`: `interview → rejected` → `tx.interviewSchedule.updateMany` được gọi với `{ where: { applicationId: 'app-1', status: 'scheduled', startAt: { gt: expect.any(Date) } }, data: { status: 'cancelled' } }`; `prisma.interviewSchedule.updateMany` **không** được gọi (chứng minh nằm trong transaction).
  - `it('leaves interviews alone when an application moves to offer')`: `interview → offer` → `tx.interviewSchedule.updateMany` không được gọi.
  - `it('cancels the upcoming interviews when the candidate withdraws')`: `withdraw` → `tx.interviewSchedule.updateMany` với cùng điều kiện.
  - `it('does not reopen interviews when a rejection is reverted')` (E14): revert `rejected → interview` → `updateMany` không được gọi và không có lệnh nào đổi lịch về `scheduled`.
- [ ] **Step 4.2: Chạy, thấy đỏ** — `npx nx test api --testFile=applications.service.spec.ts`. Expected: test 1 và 3 FAIL.
- [ ] **Step 4.3: Implement** — gọi `cancelUpcomingSchedules(tx, applicationId)` trong transaction của `withdraw`, và của `updateStatus` khi `dto.status === ApplicationStatus.rejected`.
- [ ] **Step 4.4: Chạy, thấy xanh** — `npx nx test api`. Expected: tất cả pass.
- [ ] **Step 4.5: Đề xuất commit** — `feat(api): cancel upcoming interviews when an application closes`.

### Task 5: Web — kiểu dữ liệu, action và form recruiter (C4)

**Files:**
- Modify: `apps/web/src/types/interfaces/interview.interface.ts:12-37`
- Modify: `apps/web/src/servers/interviews/interviews.action.ts:40-96, 174-191, 193-232`
- Modify: `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.tsx:227-230` (thay khối "Hình thức" tĩnh)
- Test: `apps/web/src/servers/interviews/interviews.action.test.ts`, `apps/web/src/components/interview-schedule/ui/MutateInterviewScheduleModal.test.tsx`

**Interfaces:**
- Consumes: `localDateTimeToIso`, trường `startAt` (Task 1); dạng payload ứng viên (Task 3).
- Produces:
  - `IInterviewSchedule.location?: string | null`; `IInterviewScheduleQuery.order?: 'asc' | 'desc'`.
  - `ICandidateInterviewSchedule = { interviewId: string; startAt: string; durationMinutes: number; interviewType: InterviewType; onlineMeetingLink: string | null; location: string | null; status: ScheduleStatus; interviewer: { fullName: string }; application: { applicationId: string; jobPosting: { jobId: string; title: string; organization: { name: string } } } }`; `IPaginatedCandidateInterviewSchedules = IPaginatedResponse<ICandidateInterviewSchedule>`.
  - `getCandidateInterviewSchedulesAction(query?: IInterviewScheduleQuery): Promise<IPaginatedCandidateInterviewSchedules>` (cùng endpoint `/interviews/schedules/my`, truyền `order`).
  - FormData: `interviewType` (`online` | `onsite`), `onlineMeetingLink`, `location`.

- [ ] **Step 5.1: Test (đỏ)** — action: `it('sends the chosen online type with its meeting link')` → payload có `interviewType: 'online'`, `onlineMeetingLink: 'https://meet.example.com/x'`, không có `location`; `it('sends the onsite location')`; `it('refuses an online interview without a link')` → `Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ`, không gọi `post`; `it('refuses an onsite interview without a location')` → `Phỏng vấn trực tiếp cần địa điểm`. Modal: `it('asks for a location when the interview is onsite')` — mặc định "Trực tiếp" được chọn, textbox "Địa điểm" bắt buộc, không có "Đường dẫn phòng họp"; `it('asks for a meeting link when the interview is online')` — chọn radio "Trực tuyến" → textbox "Đường dẫn phòng họp" bắt buộc, "Địa điểm" biến mất; `it('prefills the type and link when editing an online interview')`.
- [ ] **Step 5.2: Chạy, thấy đỏ** — `npm run test:web -- src/servers/interviews src/components/interview-schedule`. Expected: test mới FAIL.
- [ ] **Step 5.3: Implement** — mở rộng types; `normalizeSchedulePayload` đọc ba trường, kiểm bằng cùng hai thông báo cố định (http(s) qua `new URL` + kiểm `protocol`); `getCandidateInterviewSchedulesAction`; modal dùng radio group "Hình thức" (`name="interviewType"`), hiện ô tương ứng có `required`.
- [ ] **Step 5.4: Chạy, thấy xanh** — `npm run test:web`. Expected: tất cả pass.
- [ ] **Step 5.5: Đề xuất commit** — `feat(web): let recruiters choose online or onsite with link or location`.

### Task 6: Trang `/my-interviews` của ứng viên (C5, C6, C19, E1–E3, E8–E11, E18)

**Files:**
- Create: `apps/web/src/app/(candidate)/my-interviews/page.tsx`
- Create: `apps/web/src/components/my-interviews/group-schedules.ts`, `group-schedules.test.ts`
- Create: `apps/web/src/components/my-interviews/MyInterviewsClient.tsx`, `MyInterviewsClient.test.tsx`
- Modify: `apps/web/src/lib/role-policy.ts:10-12` (thêm `/my-interviews` vào `roleProtectedPaths.candidate` và `privatePaths`)
- Modify: `apps/web/src/components/public/layout/PublicHeader.tsx:30-36` (mục "Lịch phỏng vấn")
- Modify: `apps/web/src/components/my-applications/ui/ApplicationCard.tsx` (link "Xem lịch phỏng vấn" khi `status === 'interview'`)
- Test: `apps/web/src/proxy.test.ts`

**Interfaces:**
- Consumes: `ICandidateInterviewSchedule`, `getCandidateInterviewSchedulesAction` (Task 5).
- Produces: `groupCandidateSchedules(items: ICandidateInterviewSchedule[], now: Date): { upcoming: ICandidateInterviewSchedule[]; past: ICandidateInterviewSchedule[] }` (bỏ trùng theo `interviewId`; upcoming tăng dần, past giảm dần theo `startAt`); `isSafeMeetingLink(link: string | null | undefined): boolean`; `MyInterviewsClient(props: { upcoming: ICandidateInterviewSchedule[]; history: ICandidateInterviewSchedule[]; historyPage: number; historyTotalPages: number })`.

- [ ] **Step 6.1: Test helper (đỏ)** — `now = 2026-10-05T03:00:00Z`: scheduled `startAt 02:30Z`, 60 phút → `upcoming` (đang diễn ra, E8); scheduled `02:00Z`, 60 phút → `past` (bằng đúng `now`, Review Focus 5); scheduled ngày hôm trước → `past` (E9); cancelled có giờ ngày mai → `past` (R10); completed → `past`; cùng `interviewId` ở cả hai đầu vào → chỉ một lần; thứ tự đúng chiều; C19: đầu vào upcoming 3 lịch tương lai + history 20 lịch đã qua → `upcoming` đủ 3, `past` đủ 20. `isSafeMeetingLink`: `https://…`, `http://…` → true; `javascript:alert(1)`, `meet.example.com`, `null` → false (E10).
- [ ] **Step 6.2: Test component (đỏ)** — `vi.setSystemTime` cố định giờ, `TZ = 'Asia/Ho_Chi_Minh'`: heading "Sắp tới" và "Đã qua & đã hủy"; thẻ hiện tên vị trí, tên tổ chức, tên người phỏng vấn, "09:00", "60 phút", "Trực tuyến"; online có link "Tham gia phòng họp" với `href` đúng và `target="_blank"`; onsite có địa điểm; onsite `location: null` → "Nhà tuyển dụng sẽ gửi địa điểm" (E2); cancelled → "Đã hủy" và không có link (E3); quá giờ vẫn scheduled → "Đã diễn ra" (E9); đang diễn ra → "Đang diễn ra" (E8); link `javascript:` → hiện dạng chữ, không có role `link` (E10); hai lịch trùng giờ của hai tổ chức đều hiện (E11); không có lịch → "Bạn chưa có lịch phỏng vấn nào" (E1); `historyPage < historyTotalPages` → link "Xem thêm" tới `?page=historyPage+1`.
- [ ] **Step 6.3: Test proxy (đỏ)** — `it('sends a guest from /my-interviews to the candidate sign-in with a callback')` → `location` bằng `http://localhost:3000/sign-in?callbackUrl=%2Fmy-interviews` (E18); `it('lets a signed-in candidate open /my-interviews')` → `x-middleware-next = '1'`; `it('keeps staff out of /my-interviews')` (recruiter) → `x-middleware-next` là `null`.
- [ ] **Step 6.4: Chạy, thấy đỏ** — `npm run test:web`. Expected: test mới FAIL.
- [ ] **Step 6.5: Implement** — page server gọi `getCandidateInterviewSchedulesAction` hai lần: `{ status: 'scheduled', fromDate: <hôm qua YYYY-MM-DD>, order: 'asc', limit: 50 }` và `{ order: 'desc', limit: 20, page }` (`page` từ `searchParams`), chuyển cho `MyInterviewsClient` (client component; định dạng giờ bằng `toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })` và `toLocaleDateString('vi-VN', …)` ở client). Khung trang và style theo `MyApplicationsClient`. Thêm route vào `role-policy`, mục menu, link trên thẻ đơn.
- [ ] **Step 6.6: Chạy, thấy xanh + kiểu + lint** — `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`. Expected: tất cả pass, lint 0 warning.
- [ ] **Step 6.7: Xem trên trình duyệt** — dev server, đăng nhập ứng viên có lịch, xem `/my-interviews` ở 390px và 1280px; chụp màn hình vào `docs/tasks/gd2-week1/media/`.
- [ ] **Step 6.8: Đề xuất commit** — `feat(web): add the candidate interview schedule page`.

### Task 7: E2E — hành trình lịch phỏng vấn trên test stack (C15 phần lịch, C17)

**Files:**
- Modify: `apps/web/e2e/support/gd1-fixtures.mjs:32` — `export` hàm `withDatabase`
- Create: `apps/web/e2e/support/gd2-fixtures.mjs`
- Create: `apps/web/e2e/gd2-candidate-schedules.e2e.ts`

**Interfaces:**
- Produces: `createGd2ScheduleFixtures(apiUrl: string): Promise<{ runId; password; org: { id; name }; department: { id }; recruiter: { userId; recruiterId; email; name; phone }; candidate: { userId; candidateId; cvId; email }; job: { id; title }; applicationId }>` — job `active`, đơn `interview`, recruiter cùng department với job, user recruiter có `phone_number`; `cleanupGd2Fixtures(fixture): Promise<void>`. Dùng `withDatabase` và `waitForAuthWindow` từ `gd1-fixtures.mjs`.

- [ ] **Step 7.1: Fixture** — chèn bằng `pg` trong một transaction (khuôn `createGd1Fixtures`), chỉ khi API ở cổng `55000`; dọn hết theo `runId` trong `cleanupGd2Fixtures`.
- [ ] **Step 7.2: Spec** — `test.use({ timezoneId: 'Asia/Ho_Chi_Minh' })`, `describe.configure({ mode: 'serial' })`; `D2` = ngày VN sau hôm nay 2 ngày, `D3` = sau 3 ngày:
  1. Recruiter đăng nhập `/sign-in/admin` (vai trò "Recruiter"), vào `/interviews`, đặt lịch **Trực tuyến** `D2 09:00`, link `https://meet.example.com/gd2-<runId>` → DB `start_at` = `<D2>T02:00:00.000Z` (C17).
  2. Đặt lịch **Trực tiếp** `D3 14:00`, địa điểm `Tầng 5, 123 Lê Lợi, Q.1` → DB `start_at` = `<D3>T07:00:00.000Z`, `location` đúng chuỗi.
  3. Ứng viên đăng nhập qua API rồi gắn cookie (khuôn `session-policy.e2e.ts`), mở `/my-interviews` → nhóm "Sắp tới" có hai thẻ, hiện "09:00" và "14:00", link "Tham gia phòng họp" đúng `href`, địa chỉ đúng.
  4. `page.content()` **không** chứa email và số điện thoại của recruiter; `GET <api>/interviews/schedules/my` bằng token ứng viên → JSON không chứa email/số điện thoại recruiter và không có khóa `scheduler` (C1, C15).
  5. Recruiter từ chối đơn qua `PATCH <api>/applications/<id>/status` `{ status: 'rejected' }` → ứng viên tải lại: cả hai thẻ nằm ở "Đã qua & đã hủy" với nhãn "Đã hủy", không còn link; DB cả hai `status = 'cancelled'` (C16). *(Spec C15 ghi "rút đơn"; rút đơn chỉ được khi đơn ở `applied` — `applications.service.ts:304-308` — còn lịch chỉ tạo cho đơn `interview`, nên hành trình dùng từ chối. Rút đơn được phủ ở unit Task 4.)*
- [ ] **Step 7.3: Chạy** — `docker compose -f docker-compose.test.yml up -d --build --wait`, `node apps/web/e2e/support/prepare-local.mjs`, rồi `TZ=UTC npm run test:e2e:web -- --grep "GĐ2"` (cùng biến `WEB_E2E_*` như các spec khác). Expected: pass; lưu output vào `results/slice1-e2e.log`. Chạy lại toàn bộ E2E (`TZ=UTC npm run test:e2e:web`) để chắc không vỡ spec cũ; lưu `results/slice1-e2e-full.log`.
- [ ] **Step 7.4: Đề xuất commit** — `test(web): add the candidate interview schedule journey`.

### Task 8: Kiểm chứng toàn bộ và ghi kết quả

**Files:**
- Create: `docs/tasks/gd2-week1/README.md` (mục "Lát 1")
- Modify: `docs/migration-roadmap.md` (Phase 1 › Candidate flows: tick dòng "Candidate view of their InterviewSchedule")
- Modify: `docs/tasks/gd2-week1/spec.md` (C15: ghi rõ hành trình E2E dùng từ chối, lý do như Task 7)

- [ ] **Step 8.1: Chạy toàn bộ** — `npx nx test api --runInBand`, `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`, `npx nx lint api`, `npx nx build api`. Expected: tất cả exit 0; lưu từng output vào `results/slice1-*.log`.
- [ ] **Step 8.2: Ghi README** — bảng tiêu chí của lát 1 → test chứng minh → kết quả thật; ghi rõ những gì chưa xác minh (PR, deploy, DB dev chưa áp migration nếu người dùng chưa cho phép).
- [ ] **Step 8.3: Cập nhật roadmap, spec C15 và brain dự án** (`.claude/knowledge-base/ats-platform/` ở harness: R7, defect múi giờ, `candidateScheduleSelect`).
- [ ] **Step 8.4: Đề xuất commit** — `docs: record GĐ2 slice 1 results`.
