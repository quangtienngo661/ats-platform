# Lát 2 — Timeline đơn ứng tuyển · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native, như lát 1). Steps dùng checkbox.

**Goal:** Ứng viên mở một đơn và thấy các bước đơn đã đi qua theo thời gian, chỉ nhận dữ liệu tối thiểu từ API.
**Architecture:** API thêm nhánh `candidate` cho dữ liệu lịch sử đơn (giống `candidateScheduleSelect` ở lát 1). Web có trang mới `/my-applications/[id]`: server page gọi một lần `GET /applications/:id` rồi render component timeline ở client (giờ hiển thị theo múi giờ trình duyệt).
**Tech Stack:** NestJS 11 + Prisma 7 + Jest · Next.js 16 + React 19 + Vitest · Playwright.
**Spec:** `docs/tasks/gd2-week1/spec.md` (R1 phần lịch sử, R2; C7–C9, C15 phần timeline, C20; E4, E5, E12, E13) · `decision.md` D1, D8.

## Context

Hiện tại ứng viên chỉ thấy một thanh 5 bước tĩnh trên thẻ đơn. Survey lại sau lát 1 cho thấy 4 điều:
- **Lộ dữ liệu nội bộ qua 3 route:**
  - `GET /applications/:id/history` và `GET /applications/:id` trả mọi cột lịch sử: `notes`, `rejectionReason`, `changedBy` và `user` của nhân sự (`applications.service.ts:508-526, 602-619`).
  - `GET /applications/my` trả nguyên dòng lịch sử mới nhất, qua `applicationIncludeOptions` (`include-options.util.ts:92`).
- **`rejectionReason` được ghi ở mọi lần đổi trạng thái**, kể cả khi hoàn tác (`applications.service.ts:586`). Vì vậy không thể dựa vào việc ô này có giá trị hay không để quyết định hiển thị.
- **Kiểu web `IApplicationHistoryItem` lệch API** (`historyId`/`status`), và `getApplicationHistoryAction` chưa có chỗ nào gọi.
- **Không có trang chi tiết đơn** cho ứng viên, và cũng chưa có UI timeline nào trong web.

**Đã chốt:**
- D1, D8: chỉ trả `id, fromStatus, toStatus, changedAt`. `rejectionReason` chỉ có ở dòng từ chối mới nhất, và chỉ khi đơn **đang** `rejected`.
- Vị trí hiển thị: **trang chi tiết** `/my-applications/[id]` (bạn chọn 2026-10-04).

**Hệ quả của D1, không phải quyết định mới:** `GET /applications/my` của ứng viên sẽ không còn trả `history`. Web không đọc trường này, vì `mapDtoToCard` đã bỏ nó.

## Global Constraints

- **Nhánh và commit:**
  - Làm trên nhánh `feat/gd2-candidate-flows`, chạy lệnh từ `projects/ats-platform`.
  - Commit theo từng task với đúng message trong plan. Duyệt plan này nghĩa là duyệt các commit đó.
  - **Không push**, không merge.
- **54 file đang sửa dở của phiên khác** (header refactor, `package.json`, `.claude/**`, các `CLAUDE.md`): không sửa, không stage, chỉ stage đúng file của task. Nếu suite đỏ vì các thay đổi đó thì dừng và báo bạn.
- Không thêm dependency. Không có migration: lát 2 không đổi schema.
- **Chữ cố định trên UI:**
  - Nhãn bước: `applied` "Đã nộp đơn" · `screening` "Đang sàng lọc" · `interview` "Vòng phỏng vấn" · `offer` "Nhận offer" · `hired` "Được tuyển" · `rejected` "Bị từ chối" · `cancelled` "Đã rút đơn".
  - Các chữ khác: tiêu đề khối "Tiến trình"; nhãn bước hiện tại "Hiện tại"; khung lý do "Lý do từ chối"; bước lùi "Được xem xét lại"; link trên thẻ "Xem tiến trình"; link quay lại "Đơn ứng tuyển".
- **Trang ứng viên theo hướng thiết kế mới:** không có khối tiêu đề và mô tả lớn ở đầu trang; `h1` là tên vị trí. Khung và màu lấy theo `my-applications` / `my-interviews`.
- **Giờ được định dạng ở client sau khi mount**, theo múi giờ trình duyệt: `toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })`.
- **Test:** web chọn phần tử bằng role và chữ hiển thị, không dùng `data-testid`. API qua `npx nx test api`, web qua `npm run test:web`. E2E chỉ chạy trên test stack với `TZ=UTC`.

## Review Focus

1. `rejectionReason` nằm trên một dòng **không phải** từ chối (ví dụ khi hoàn tác) thì không bao giờ tới ứng viên — test ở Task 1.
2. Từ chối → hoàn tác → từ chối lần nữa: chỉ dòng từ chối **mới nhất** có lý do — test ở Task 1.
3. Ứng viên mở id đơn của người khác: 403, không lộ dữ liệu; trang rơi vào `error.tsx` — test ở Task 1 (service) và Task 3 (page).
4. Hai dòng có cùng `changedAt` (nộp đơn và sàng lọc tự động trong cùng một ms): giữ nguyên thứ tự API trả — test ở Task 2.
5. Đơn cũ không có dòng lịch sử nào: timeline chỉ có bước "Đã nộp đơn" dựng từ `appliedAt`, và bước đó là bước hiện tại — test ở Task 2.

---

### Task 0: Ghi thiết kế và plan vào repo
- [ ] Thêm mục "Thiết kế lát 2 (duyệt 2026-10-04)" vào `spec.md`, ngay sau "Thiết kế lát 1". Nội dung là các mục Context và Global Constraints ở trên.
- [ ] Thêm **D9 — Timeline ở trang chi tiết `/my-applications/[id]`** vào `decision.md`. Ba phương án: trang chi tiết, mở rộng trong thẻ, drawer.
- [ ] Lưu plan này thành `docs/tasks/gd2-week1/plan-slice2-timeline.md`.
- [ ] Commit `docs(tasks): add GĐ2 slice 2 timeline design and plan`.

### Task 1: API — lịch sử tối thiểu cho ứng viên (C7, C20, E12, R2)
**Files:**
- Create: `apps/api/src/app/applications/candidate-history.ts`, `candidate-history.spec.ts`
- Modify: `apps/api/src/common/utils/include-options.util.ts`, `apps/api/src/app/applications/applications.service.ts` (`getMyApplications`, `getApplicationById`, `getApplicationHistory`), `applications.service.spec.ts`

**Produces:**
- `candidateHistorySelect = { id, fromStatus, toStatus, changedAt, rejectionReason }` dạng `satisfies Prisma.ApplicationHistorySelect`.
- `toCandidateHistory(rows, currentStatus: ApplicationStatus): CandidateHistoryItem[]`, trong đó `CandidateHistoryItem = { id; fromStatus: ApplicationStatus|null; toStatus; changedAt: Date; rejectionReason?: string }`. Hàm giữ thứ tự đầu vào. Lý do được gắn vào dòng có `toStatus==='rejected'` và `changedAt` lớn nhất, chỉ khi `currentStatus==='rejected'`; lý do được cắt khoảng trắng và bỏ đi nếu rỗng.
- Cả hai route của ứng viên trả lịch sử theo `changedAt` tăng dần.

- [ ] **1.1 Test đỏ — `candidate-history.spec.ts`:**
  - chỉ còn 4 trường, không có `notes`/`changedBy`/`user`;
  - đang `rejected` có lý do → chỉ dòng từ chối mới nhất có lý do (RF2);
  - đã hoàn tác (đang `interview`) → không dòng nào có lý do (C20);
  - lý do nằm trên dòng `rejected → interview` → bị bỏ (RF1);
  - lý do `'   '` → không có khóa `rejectionReason` (E12);
  - lý do `'  Thiếu NestJS  '` → `'Thiếu NestJS'`.
- [ ] **1.2 Test đỏ — `applications.service.spec.ts`:**
  - Ứng viên gọi `getApplicationHistory`: `findMany` với `select: candidateHistorySelect`, `orderBy: { changedAt: 'asc' }`, không có `include`; kết quả đã qua `toCandidateHistory` với `status` hiện tại.
  - Recruiter gọi: giữ `include user` và `desc` như cũ (pin).
  - `getApplicationById` cho ứng viên: `history` đã map; cho staff: không đổi.
  - `getMyApplications`: `include.history === false`.
  - Ứng viên khác gọi → `ForbiddenException` (RF3).
- [ ] **1.3** Chạy `npx nx test api --runInBand --silent` → các test mới FAIL.
- [ ] **1.4** Implement theo **Produces**. Nhánh rẽ theo `caller.role === UserRole.candidate`; `getApplicationHistory` select thêm `status` của đơn.
- [ ] **1.5** Test api xanh; `npx nx lint api` không tăng quá 300 warning.
- [ ] **1.6** Commit `feat(api): return a minimal application history to candidates`.

### Task 2: Web — kiểu dữ liệu, action, component timeline (C8, C9, E4, E5, E12, E13)
**Files:**
- Modify: `apps/web/src/types/interfaces/application.interface.ts`
- Create: `apps/web/src/servers/applications/applications.action.test.ts`, `apps/web/src/components/my-applications/timeline/build-timeline.ts` (+ `.test.ts`), `ApplicationTimeline.tsx` (+ `.test.tsx`)

**Produces:**
- `IApplicationHistoryItem = { id; fromStatus: string|null; toStatus: string; changedAt: string; rejectionReason?: string }`; `IApplicationDto.history?: IApplicationHistoryItem[]`.
- `buildTimeline(history, { status, appliedAt }): TimelineStep[]`, với `TimelineStep = { key; status; label; at: string; isCurrent; isRevert; rejectionReason? }`:
  - sắp tăng dần theo `changedAt`, ổn định khi trùng giờ;
  - nếu không có dòng nào có `fromStatus === null` thì thêm bước `applied` ở đầu, `at = appliedAt`;
  - `isRevert` = `fromStatus` là `rejected`/`cancelled`, hoặc chỉ số của `toStatus` nhỏ hơn của `fromStatus` trong `[applied, screening, interview, offer, hired]`;
  - bước cuối có `isCurrent`.
- `ApplicationTimeline({ history, status, appliedAt })` là client component; render `<ol aria-label="Tiến trình đơn ứng tuyển">`, bước hiện tại có `aria-current="step"`.

- [ ] **2.1 Test đỏ — `applications.action.test.ts` (C9):** fixture đúng dạng API `{ id, fromStatus, toStatus, changedAt }`. `getApplicationHistoryAction('app-1')` gọi `/applications/app-1/history` và trả nguyên các dòng đó; `getApplicationByIdAction` trả cả `history`. Kiểu cũ `historyId`/`status` bị xóa, typecheck bắt.
- [ ] **2.2 Test đỏ — `build-timeline.test.ts`:**
  - đầu vào giảm dần → đầu ra tăng dần;
  - trùng `changedAt` → giữ thứ tự (RF4);
  - không có dòng nào → một bước "Đã nộp đơn", là bước hiện tại (RF5, E13);
  - thiếu dòng `applied` đầu → dựng từ `appliedAt` (E13);
  - `rejected → interview` có `isRevert` (E4);
  - rút đơn → bước cuối "Đã rút đơn" (E5).
- [ ] **2.3 Test đỏ — `ApplicationTimeline.test.tsx`** (TZ `Asia/Ho_Chi_Minh`):
  - thứ tự các `listitem`, bước đầu "Đã nộp đơn";
  - bước cuối có "Hiện tại" và `aria-current="step"`;
  - lý do có → hiện "Lý do từ chối" kèm chữ lý do; không có lý do → không có khung (E12);
  - bước lùi có "Được xem xét lại";
  - giờ `2026-10-01T02:12:00Z` hiện thành "01/10/2026 09:12".
- [ ] **2.4** Chạy `npm run test:web` → FAIL. **2.5** Implement. **2.6** Chạy test web, typecheck web, lint web → xanh, 0 warning.
- [ ] **2.7** Commit `feat(web): add the application timeline component`.

### Task 3: Web — trang chi tiết đơn và link từ thẻ (C8, RF3)
**Files:**
- Create: `apps/web/src/app/(candidate)/my-applications/[id]/page.tsx` (+ `page.test.tsx`), `apps/web/src/components/my-applications/status-config.ts`
- Modify: `ui/ApplicationCard.tsx` (+ test), `apps/web/src/proxy.test.ts`

**Bước:**
- [ ] **3.1 Test đỏ:**
  - page (`params: Promise<{ id }>`) gọi `getApplicationByIdAction('app-1')`; render `h1` là tên vị trí, badge trạng thái, ngày nộp, link "Đơn ứng tuyển" về `/my-applications`, và timeline;
  - action ném lỗi (403/404) → page ném lại để `error.tsx` của `(candidate)` xử lý (RF3);
  - thẻ đơn có link "Xem tiến trình" tới `/my-applications/<id>` ở mọi trạng thái;
  - proxy (pin): guest mở `/my-applications/app-1` → `/sign-in?callbackUrl=%2Fmy-applications%2Fapp-1`; ứng viên được vào; recruiter bị chặn.
- [ ] **3.2** Implement:
  - tách `STATUS_CONFIG` ra `status-config.ts`, dùng chung cho thẻ và trang;
  - không cần sửa `role-policy`, vì `/my-applications` đã bao cả đường dẫn con.
- [ ] **3.3** Chạy test web, typecheck web, lint web → xanh.
- [ ] **3.4 Xem trên trình duyệt:** dùng test stack và cấu hình `ats-web-test-stack`, seed bằng script tạm trong workspace chạy dưới `TZ=UTC`. Ba đơn cần xem: đơn có bước lùi, đơn bị từ chối có lý do, đơn đã rút. Kiểm ở 1280 và 390px, chụp màn hình vào `docs/tasks/gd2-week1/media/slice2-*.jpg`, rồi dọn seed.
- [ ] **3.5** Commit `feat(web): add the candidate application page with its timeline`.

### Task 4: E2E — phần timeline của C15
**Files:** `apps/web/e2e/support/gd2-fixtures.mjs`, `apps/web/e2e/gd2-candidate-schedules.e2e.ts`

**Bước:**
- [ ] Fixture chèn thêm lịch sử:
  - `null → applied` (T−3 ngày);
  - `applied → screening` có `notes` nội bộ `GĐ2 ghi chú nội bộ <runId>` (T−2 ngày);
  - `screening → interview` (T−1 ngày).
- [ ] Bước C16 gửi kèm `rejectionReason: 'Chưa đủ kinh nghiệm NestJS'`.
- [ ] Thêm bước "C8/C15: ứng viên mở timeline":
  - `/my-applications/<id>` hiện 4 bước theo thứ tự, bước hiện tại "Bị từ chối" kèm lý do;
  - HTML trang không chứa ghi chú nội bộ;
  - `GET /applications/:id/history` bằng token ứng viên: không có khóa `notes`/`changedBy`/`user`, lý do chỉ ở dòng cuối.
- [ ] Chạy `npm run typecheck:web` và `playwright --list`.
- [ ] Máy này không có trình duyệt Playwright, nên chạy API smoke tạm trên test stack cho phần API (log vào `results/slice2-api-smoke.log`). Hành trình bằng trình duyệt chạy ở job `web-e2e` của CI khi có PR.
- [ ] Commit `test(web): extend the candidate journey with the application timeline`.

### Task 5: Kiểm chứng toàn bộ và ghi kết quả
- [ ] Chạy `npx nx test api --runInBand`, `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`, `npx nx lint api`, `npx nx build api`, lưu log vào `results/slice2-*.log`.
- [ ] `README.md` thêm mục "Lát 2": bảng tiêu chí → test → kết quả, và mục chưa xác minh.
- [ ] Tick dòng roadmap "Application timeline visualization".
- [ ] Brain: ghi rằng `rejectionReason` được ghi ở mọi lần đổi trạng thái, và nhánh lịch sử dành cho ứng viên.
- [ ] Commit `docs: record GĐ2 slice 2 results`.
- [ ] Review cuối toàn lát bằng một reviewer mới trên model `opus`. Sửa lỗi Critical/Important theo TDD (test đỏ commit trước), rồi báo bạn.

## Verification
- **Unit:** api (các test mới ở Task 1) và web (Task 2–3) xanh; typecheck, lint, build exit 0.
- **API smoke trên test stack:** ứng viên nhận đúng 4 trường; lý do chỉ ở dòng từ chối mới nhất; ứng viên khác nhận 403.
- **Trình duyệt:** trang `/my-applications/[id]` ở 1280 và 390px không tràn ngang; giờ hiển thị theo giờ VN.
- **E2E:** chạy ở CI (`web-e2e`) khi mở PR vào `dev`. Ở máy này **chưa chạy được** vì không có trình duyệt Playwright.
