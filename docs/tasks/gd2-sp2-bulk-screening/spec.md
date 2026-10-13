# Spec — GĐ2 SP2: chấm CV hàng loạt và xuất CSV

**Ngày:** 2026-10-13 · **Trạng thái:** coi là đã chấp nhận (người dùng bảo lập plan; lời bảo được chuyển qua phiên
"Kiểm tra tiến độ dự án", không phải câu duyệt trực tiếp trong phiên viết spec); plan ở [plan.md](plan.md) chờ người dùng
đọc · **Nguồn:** đề cương GĐ2 (A-05 "chấm CV hàng loạt, xuất
CSV"), `docs/migration-roadmap.md` mục *Recruiter flows* ("Bulk trigger AI screening", "Export candidate list to CSV"),
`docs/current-state.md` M4, các quyết định ở [decision.md](decision.md). Chưa có nhánh riêng và chưa commit (repo có một
worktree duy nhất, đang ở `dev` và có thay đổi của phiên khác).

## Mục tiêu

Recruiter đưa nhiều đơn của **một tin** vào hàng đợi sàng lọc AI bằng một thao tác, thay vì mở modal cho từng đơn trên
Kanban. Đơn nào không chấm được thì có lý do riêng. Recruiter tải danh sách ứng viên của tin đó ra một file CSV mở
được bằng Excel mà không lỗi tiếng Việt. Điểm và gợi ý AI không bao giờ tự đổi trạng thái đơn (ADR 0002).

## Vị trí trong GĐ2

| Spec | Gồm | Trạng thái |
|---|---|---|
| SP1 | Scorecard (A-01), ghi chú (A-07), so sánh ứng viên | đã có spec ([gd2-week2-evaluation](../gd2-week2-evaluation/spec.md)) |
| **SP2 (spec này)** | Chấm CV hàng loạt, xuất CSV (A-05) | đang viết |
| SP3 | Email thông báo tự động (A-02) | phiên riêng |

SP2 không phụ thuộc SP1 hay SP3 về dữ liệu: không dùng bảng của SP1, không có migration. Ba spec chỉ đụng nhau ở các
file chung (xem *Phối hợp*).

## Ngoài phạm vi SP2

Chấm lại đơn đã `completed` · trần chi phí theo tổ chức/ngày · thông báo tổng khi cả đợt xong · thanh tiến độ "x/50" ·
email, số điện thoại hay bất kỳ trường liên hệ nào trong CSV · cột trung bình scorecard (SP1) trong CSV · xuất theo
bộ lọc trạng thái hoặc theo đơn đang tick · xuất PDF/Excel · bulk trên Kanban · chấm đơn của nhiều tin trong một lần ·
mọi thao tác tự đổi trạng thái theo điểm · địa điểm dạng text cho tin tuyển dụng (việc khác).

## Quy tắc

| # | Quy tắc |
|---|---|
| R1 | Bulk và export đều theo **một tin** (`:jobId`). Quyền giống `POST /applications/:id/trigger-screening` và `GET /applications/job/:jobId`: recruiter cùng phòng ban với tin, org_admin cùng tổ chức, platform admin. Tin của tổ chức hoặc phòng ban khác → 403 (theo `assertCanAccessDepartment` hiện có); tin không tồn tại → 404; ứng viên → 403. |
| R2 | Bulk có hai chế độ. **Theo danh sách:** `applicationIds` gồm 1–50 UUID không trùng; sai thì 400. **Tự chọn:** không gửi `applicationIds`; server lấy các đơn của tin đủ điều kiện theo R4 (đơn `applied` chỉ tính khi bật cờ R5), nộp sớm nhất trước, tối đa 50, và trả `remaining` = số đơn đủ điều kiện chưa được lấy. Ở chế độ tự chọn, đơn không đủ điều kiện không được lấy nên không nằm trong `skipped`; `skipped` chỉ có `STATUS_CHANGED` hoặc `ENQUEUE_FAILED`. |
| R3 | Bulk bỏ qua từng đơn kèm mã lý do, không làm theo kiểu tất cả hoặc không. Chỉ hai lỗi chặn cả request, và cả hai được kiểm **trước khi động vào bất kỳ đơn nào**: body sai (400), không tìm thấy cấu hình AI (404). |
| R4 | Điều kiện chấm của một đơn nằm trong **một hàm thuần dùng chung** `checkScreeningEligibility`; `triggerScreening` (đơn lẻ) và bulk cùng gọi hàm này. Đơn lẻ giữ nguyên message và HTTP code hiện có. Mã lý do ở bảng *Mã lý do bỏ qua*. |
| R5 | Đơn `applied` chỉ được chấm khi request có `moveAppliedToScreening: true`. Khi đó bulk gọi `updateStatus` (public, không sửa thân hàm) để chuyển `applied → screening`, ghi `ApplicationHistory` với `changedBy` = người gọi, rồi mới đưa vào hàng đợi. Cờ tắt thì đơn bị bỏ qua với `APPLIED_NOT_MOVED` và trạng thái không đổi. Việc chuyển này do người bấm, xảy ra trước khi có điểm và không phụ thuộc điểm (ADR 0002). |
| R6 | Cấu hình AI được tìm **một lần** trong tổ chức của tin: `configId` nếu gửi, không thì cấu hình mặc định của tổ chức (`getActiveConfig`). Mọi đơn trong lần đó dùng cùng cấu hình. |
| R7 | Job do bulk đưa vào queue `cv-screening` mang `notify: false`. Processor bỏ bước tạo notification in-app cho job đó nhưng **vẫn phát** `cv-screening:completed`. Job không có trường `notify`, gồm job đơn lẻ và job cũ còn trong Redis, xử lý như hiện nay. |
| R8 | Chặn chi phí: tối đa 50 đơn mỗi request (R2); bulk endpoint giới hạn 3 request/phút bằng `ThrottlerGuard` + `@Throttle`, giống cách `auth.controller.ts` đang dùng, **đếm theo người dùng** (`req.user.userId`, không có thì dùng IP; bổ sung khi viết plan, xem decision.md); giữ `MAX_SCREENING_RETRIES = 3`. Không có hạn mức theo tổ chức/ngày. |
| R9 | Export gồm mọi đơn của tin trừ `cancelled`, mới nộp trước (cùng thứ tự `getApplicationsByJob`). Quá 5000 dòng → 400, không cắt bớt âm thầm. |
| R10 | Cột CSV cố định theo bảng *Cột CSV*. Query export dùng `select` chỉ các trường đó, **không** dùng `applicationIncludeOptions` (include này kéo theo `email` và `phoneNumber`), nên trường liên hệ không thể lọt vào file. |
| R11 | Định dạng CSV: UTF-8 có BOM, xuống dòng CRLF, mọi ô bọc `"…"`, dấu `"` bên trong nhân đôi. Ô bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR hoặc LF được thêm một ký tự tab ở đầu, bên trong ngoặc kép (OWASP, xem *Nguồn tham khảo*). |
| R12 | SP2 không thêm bảng, cột hay migration. Export không ghi gì vào DB. |

### Mã lý do bỏ qua

Mã là một enum dùng chung giữa API và web (`ScreeningSkipReason` trong `@ats-platform/types`). Web hiển thị nhãn tiếng
Việt theo mã, không hiển thị message của exception.

| Mã | Khi nào | Đơn lẻ (`trigger-screening`) hiện trả |
|---|---|---|
| `NOT_IN_JOB` | id không tồn tại, hoặc thuộc tin khác hay tổ chức khác (cùng một mã, không lộ việc đơn có tồn tại) | — (đơn lẻ không có khái niệm tin) |
| `APPLIED_NOT_MOVED` | đơn `applied` và cờ R5 tắt | 400 "Hãy chuyển đơn ứng tuyển sang trạng thái 'screening'…" |
| `FINAL_STATUS` | `hired`, `rejected`, `cancelled` | 400 "Không thể chạy sàng lọc AI khi đơn…" |
| `IN_QUEUE` | screening `pending` hoặc `processing` | 409 "…đã được đưa vào hàng đợi" / "…đang được xử lý" |
| `ALREADY_SCREENED` | screening `completed` | 409 "Sàng lọc AI đã hoàn tất…" |
| `RETRY_LIMIT` | screening `failed` và `retryCount ≥ 3` | 409 "Sàng lọc AI đã thất bại 3 lần…" |
| `STATUS_CHANGED` | `updateStatus` từ chối vì trạng thái vừa bị người khác đổi | — |
| `ENQUEUE_FAILED` | `createScreeningRecord` hoặc `queue.add` lỗi | — (đơn lẻ ném lỗi lên) |

## Thiết kế

### API — chấm hàng loạt

`POST /applications/job/:jobId/bulk-screening` · `@Roles(recruiter, admin)` (org_admin được nhận quyền recruiter qua
`grantedRoles`).

Body (DTO trong `applications/dtos/`): `{ applicationIds?: string[] /* UUID, 1–50, không trùng */,
moveAppliedToScreening?: boolean /* mặc định false */, configId?: string /* UUID */ }`.

```
1. Tìm tin → 404 nếu không có → assertCanAccessDepartment (R1)
2. getActiveConfig(tin.organizationId, configId) → 404 nếu không có (R3, R6)
3. Chọn đơn (R2):
     có ids     → các đơn có applicationId ∈ ids và jobId = :jobId; id còn lại → skipped NOT_IN_JOB
     không ids  → đơn của tin, lọc thô bằng query, lọc đúng bằng checkScreeningEligibility,
                  appliedAt tăng dần, lấy 50; remaining = số đủ điều kiện còn lại
4. Với từng đơn, tuần tự:
     checkScreeningEligibility(đơn, { allowApplied: moveAppliedToScreening })
       ├─ lỗi → skipped { applicationId, reason }
       └─ ok  → nếu applied: updateStatus(id, caller, { status: screening })   (lỗi → STATUS_CHANGED)
                createScreeningRecord(id, cvId, config.configId, { notify: false }) (lỗi → ENQUEUE_FAILED)
                → queued { applicationId, movedToScreening }
5. 200 { queued, skipped, remaining }
```

Kiểu trả về (thêm vào `@ats-platform/types`):

```ts
interface IBulkScreeningResult {
  queued: { applicationId: string; movedToScreening: boolean }[];
  skipped: { applicationId: string; reason: ScreeningSkipReason; movedToScreening: boolean }[];
  remaining: number; // luôn 0 ở chế độ theo danh sách
}
```

Đặt code:
- `checkScreeningEligibility` là hàm thuần trong file riêng của module `applications`. `triggerScreening` dùng hàm
  này rồi ném đúng exception đang có.
- `BulkScreeningService` (file mới, module `applications`) giữ luồng trên để `applications.service.ts` không phình
  thêm. Service này gọi `ApplicationsService.assertCanAccessDepartment`, hàm này được chuyển từ `private` sang public
  mà không đổi thân (*Phối hợp*). `ApplicationExportService` cũng gọi hàm này.
- `createScreeningRecord(applicationId, cvId, configId?, options?: { notify?: boolean })`; `notify` được chép vào
  `ProcessCvScreeningJobData`.
- Processor: chỉ gọi `createNotificationSafe` khi `job.data.notify !== false`.

### API — xuất CSV

`GET /applications/job/:jobId/export` · `@Roles(recruiter, admin)`.

- `ApplicationExportService` (file mới, module `applications`) truy vấn bằng `select` (R10), dựng dòng, gọi `toCsv`.
- `toCsv(headers, rows)` là hàm thuần ở `apps/api/src/common/utils/csv.util.ts`, không thêm dependency.
- Controller trả qua `@Res()`: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment;
  filename="ung-vien-<8 ký tự đầu jobId>-<yyyymmdd>.csv"`. Không trả `StreamableFile` vì `TransformInterceptor` bọc mọi
  giá trị handler trả về vào envelope (`apps/api/src/common/interceptors/transform.interceptor.ts`, đã đọc).

#### Cột CSV

| Cột | Nguồn | Ghi chú |
|---|---|---|
| Mã đơn | `applicationId` | để đối chiếu về hệ thống |
| Họ tên | `candidate.user.fullName` | |
| Trạng thái | `status` | nhãn tiếng Việt: Mới · Sàng lọc · Phỏng vấn · Offer · Đã tuyển · Từ chối |
| Ngày nộp | `appliedAt` | `yyyy-mm-dd HH:mm`, múi giờ `Asia/Ho_Chi_Minh` cố định |
| Chức danh hiện tại | `candidate.currentTitle` | trống nếu null |
| Số năm kinh nghiệm | `candidate.yearsOfExperience` | trống nếu null |
| Trạng thái sàng lọc | `screening.status` | Chưa chấm · Đang chờ · Đang xử lý · Hoàn tất · Lỗi |
| Điểm tổng (gợi ý AI) | `screening.overallScore` | trống nếu chưa có |
| Điểm kỹ năng · Điểm kinh nghiệm · Điểm học vấn | `skillsScore` · `experienceScore` · `educationScore` | |
| Gợi ý AI | `screening.aiRecommendation` | "Nên phỏng vấn" / "Không phù hợp"; tiêu đề cột ghi rõ đây là gợi ý |
| Kỹ năng khớp | `screening.matchedSkills.hardSkills` | nối bằng `; ` |
| Kỹ năng thiếu | `screening.missingSkills` | nối bằng `; ` |

### Giao diện web (tiếng Việt)

1. **`jobs/[jobId]/candidates/page.tsx`** tải thêm `getAIConfigAction()` (giống trang Kanban) và render
   `<InitSocketRoom jobId={jobId} />`.
2. **Bảng** (`CandidatesFilters` → `CandidateRow`) thêm cột checkbox và ô "chọn cả trang". SP1 cũng cần đúng state chọn
   này cho "So sánh", nên hai spec **dùng chung một state chọn**: một `Set<string>` các `applicationId` trong
   `CandidatesFilters` (chỉ trang hiện tại); `CandidateRow` nhận `selected: boolean` và
   `onToggle: (applicationId: string) => void` đúng như plan SP1 Task 11; **`CandidateRow` không đặt trần**. Trần nằm ở
   từng thanh hành động: `CompareBar` của SP1 bật khi chọn 2–4, thanh chấm của SP2 bật khi chọn 1–50.
3. **Thanh thao tác** trên bảng: "Chấm AI (N đã chọn)" (bật khi chọn 1–50 đơn) · "Chấm mọi đơn đủ điều kiện" ·
   "Xuất CSV".
4. **`BulkScreeningDialog`** (`AccessibleDialog`): chọn cấu hình AI (mặc định là cấu hình mặc định); checkbox
   "Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm", **mặc định tắt**. Ở chế độ theo danh sách, hộp thoại hiện số
   đơn `applied` trong phần đã chọn. Sau khi gửi, hộp thoại chuyển sang màn kết quả: số đã đưa vào hàng đợi, danh sách
   bỏ qua kèm nhãn lý do, và `remaining` nếu > 0. Không có đơn nào đủ điều kiện thì báo "Không có đơn nào cần chấm".
5. Mỗi khi nhận `cv-screening:completed`, trang tải lại dữ liệu danh sách, có debounce khoảng 1 giây.
6. **Xuất CSV** qua server action `exportCandidatesCsvAction(jobId)`: gọi `http.get(…, { responseType: 'text' })`, trả
   chuỗi và tên file; client dựng `Blob` (`text/csv;charset=utf-8`, thêm BOM nếu chuỗi nhận về đã mất BOM) rồi tải xuống.
7. Server action mới trong `servers/applications/applications.action.ts`: `bulkScreenApplicationsAction`,
   `exportCandidatesCsvAction`, mỗi action có test.
8. Kanban giữ nguyên.

### Lỗi (tiếng Việt)

400 danh sách đơn rỗng, quá 50, trùng hoặc không phải UUID · 400 tin có quá nhiều đơn để xuất (tối đa 5000) ·
403 không có quyền với tin (message hiện có của `assertCanAccessDepartment`) · 404 không tìm thấy tin ·
404 không tìm thấy cấu hình AI (message hiện có của `getActiveConfig`) · 429 gửi yêu cầu chấm hàng loạt quá nhanh
(message do `ThrottlerGuard` sinh; có cần đổi sang tiếng Việt hay không sẽ quyết ở plan sau khi xem các route auth đang
trả gì).

## Phối hợp với SP1 và SP3

| File SP2 sẽ sửa | Ai khác chạm | Ghi chú |
|---|---|---|
| `apps/api/src/app/applications/applications.service.ts` | SP1 (access helper cho `ApplicationComparisonService`), SP3 (luồng đổi trạng thái) | SP2 chỉ sửa `triggerScreening` và bỏ `private` của `assertCanAccessDepartment`; **không sửa thân `updateStatus`** |
| `applications.controller.ts`, `applications.module.ts` | SP1 (route so sánh) | thêm route và provider |
| `applications/dtos/` (DTO bulk) | — | file mới |
| `cv-screenings.service.ts`, `processors/cv-screenings.processor.ts` | — | thêm tham số `notify` |
| `apps/api/src/common/utils/csv.util.ts` | — | file mới |
| `libs/shared/types` (`ScreeningSkipReason`, `IBulkScreeningResult`) | — | enum TypeScript thuần, không phải enum Prisma, nên không có bước đồng bộ schema |
| `apps/web/.../jobs/[jobId]/candidates/page.tsx`, `CandidatesFilters.tsx`, `CandidateRow.tsx` | SP1 (checkbox so sánh) | dùng chung state chọn; nhánh merge trước tạo state |
| `apps/web/src/servers/applications/applications.action.ts` (+ test) | SP1 (`compareApplicationsAction`) | thêm hàm |

- **Access check:** SP2 kiểm quyền theo tin, không theo từng đơn (mọi đơn đều được lọc theo `jobId`), nên cần
  `ApplicationsService.assertCanAccessDepartment` (đang `private`, `applications.service.ts:147`). SP2 chỉ bỏ từ khoá
  `private`, không đổi thân hàm, giống thay đổi plan SP1 Task 3 làm với `assertCanAccessApplication`. Hai thay đổi nằm
  ở hai hàm khác nhau, nên khi merge chỉ có thể đụng ở các dòng gần nhau.
- **Module và controller:** SP1 thêm provider `ApplicationComparisonService` và route `GET job/:jobId/compare`; SP2 thêm
  `BulkScreeningService`, `ApplicationExportService` và hai route. Nếu xung đột thì chỉ ở các dòng thêm provider và route,
  giải khi merge.
- **Trần chọn ở `CandidateRow` (đã thống nhất với SP1 ngày 2026-10-13):** bản đầu của plan SP1 Task 11 khoá checkbox
  khi đã chọn đủ 4 đơn, nên SP2 không chọn được tới 50 đơn. Plan SP1 đã sửa (`docs/tasks/gd2-week2-evaluation/plan.md:191,193`,
  chưa commit; SP2 đọc lại sau khi sửa): checkbox không bao giờ bị khoá theo số lượng; `CompareBar` tắt khi chọn 5 đơn trở lên
  và hiện chú thích "Chọn tối đa 4 ứng viên để so sánh"; test cũ đổi thành `CandidateRow keeps its checkbox enabled with any
  number of other rows selected`. Khi lập plan SP2, đọc lại Task 11 vì plan SP1 có thể còn đổi trước khi commit.
- **Mở hàm access:** SP1 bỏ `private` của `assertCanAccessApplication`, SP2 bỏ `private` của `assertCanAccessDepartment`.
  Cả hai đều không sửa thân hàm. Plan SP2 ghi rõ điều này để hai nhánh không sửa đè lên nhau.
- **Migration:** không có.
- **Lưu ý cho SP3:** nếu SP3 gửi email khi đơn chuyển sang `screening`, một lần bulk có bật cờ R5 có thể gửi tới 50 email,
  mỗi ứng viên một email về đơn của chính họ. Hiện `screening` không có trong `NOTIFY_CANDIDATE_ON`
  (`applications.service.ts:68-73`).

## Tiêu chí chấp nhận

| # | Tiêu chí | Kiểm bằng |
|---|---|---|
| C1 | Chế độ theo danh sách, 3 đơn hợp lệ → `queued` 3; mỗi đơn có một `CVScreening` `pending` và một job `process-cv-screening` | API unit + probe |
| C2 | `applicationIds` rỗng, quá 50, trùng hoặc không phải UUID → 400 | API unit |
| C3 | Mỗi mã lý do ra đúng trong điều kiện của nó (8 mã) | API unit |
| C4 | `trigger-screening` trả đúng message và HTTP code như trước cho từng trường hợp; spec hiện có vẫn xanh | API unit |
| C5 | Chế độ tự chọn, 60 đơn đủ điều kiện → `queued` 50 đơn nộp sớm nhất, `remaining` 10; đơn không đủ điều kiện không bị lấy | API unit |
| C6 | Cờ bật: đơn `applied` sang `screening`, có đúng một dòng `ApplicationHistory` `applied→screening` với `changedBy` = người gọi, `movedToScreening: true`. Cờ tắt: `APPLIED_NOT_MOVED`, trạng thái không đổi, không có dòng history | API unit + probe |
| C7 | Không có cấu hình AI → 404; không đơn nào đổi trạng thái, không job nào vào queue | API unit |
| C8 | Tin của tổ chức khác hoặc phòng ban khác → 403; ứng viên → 403; tin không tồn tại → 404 (cả bulk và export) | API unit |
| C9 | Job của bulk có `notify: false`: processor không tạo notification nhưng vẫn phát `cv-screening:completed`. Job không có `notify` vẫn tạo notification | API unit |
| C10 | Request bulk thứ 4 trong một phút → 429 | smoke HTTP trên test stack |
| C11 | Export: tiêu đề đúng thứ tự; không có `email` hay `phoneNumber` trong file; không có đơn `cancelled` hay đơn của tin khác | API unit |
| C12 | `toCsv`: có BOM, CRLF, `"` được nhân đôi, ô bắt đầu bằng từng ký tự `= + - @ \t \r \n` có tab ở đầu, dấu phẩy và xuống dòng nằm trong một ô, tiếng Việt giữ nguyên | API unit |
| C13 | Quá 5000 đơn → 400 | API unit |
| C14 | Response export có `Content-Type: text/csv; charset=utf-8` và `Content-Disposition: attachment`, body không bị bọc envelope | smoke HTTP trên test stack |
| C15 | Web: chọn 1–50 đơn; nút tắt khi chọn 0 hoặc hơn 50; hộp thoại gửi đúng body ở hai chế độ; cờ mặc định tắt; màn kết quả hiện nhãn lý do; tải CSV dựng `Blob` có BOM; nhận sự kiện socket thì tải lại | Vitest |
| C16 | Hành trình thật: recruiter tick 2 đơn (1 `applied`, bật cờ; 1 đã có screening `completed`) → 1 queued + 1 skipped `ALREADY_SCREENED`; tải CSV, file có đúng tiêu đề và không có email | Playwright |

### Edge case

| # | Trường hợp | Hành vi |
|---|---|---|
| E1 | Đơn bị người khác đổi trạng thái giữa lúc chọn và lúc chuyển | `STATUS_CHANGED`, không đưa vào hàng đợi |
| E2 | Đã chuyển sang `screening` nhưng đưa vào hàng đợi lỗi | `ENQUEUE_FAILED` với `movedToScreening: true`; đơn nằm ở `screening` chưa có kết quả, giống khi đóng modal trên Kanban |
| E3 | Hai người bấm bulk trên cùng tin cùng lúc | Một đơn có thể vào hàng đợi hai lần. Đường đơn lẻ hiện cũng có race này (đọc rồi mới upsert). Chấp nhận, không thêm khoá |
| E4 | Gemini trả lỗi quota hoặc 429 khi 50 job chạy (processor `concurrency: 5`) | BullMQ retry 3 lần rồi `failed`; recruiter chấm lại được cho đến khi `retryCount ≥ 3` |
| E5 | Screening `failed` với `retryCount < 3` | Đủ điều kiện; lần chấm này tăng `retryCount` như đơn lẻ |
| E6 | Tự chọn nhưng không còn đơn nào đủ điều kiện | 200, `queued: []`, `remaining: 0` |
| E7 | `applicationIds` có id của tin khác hoặc tổ chức khác | `NOT_IN_JOB`, giống id không tồn tại |
| E8 | Tin không có đơn nào | CSV chỉ có dòng tiêu đề |
| E9 | Tên có dấu phẩy, ngoặc kép hoặc xuống dòng | Vẫn nằm trong một ô |
| E10 | Kỹ năng do Gemini trả bắt đầu bằng `=` (lấy từ nội dung CV) | Có tab ở đầu; Excel không chạy như công thức |
| E11 | Đơn chưa có screening | Cột điểm và gợi ý để trống; "Trạng thái sàng lọc" = Chưa chấm |
| E12 | Đóng trang khi đang chấm | Không nhận sự kiện; mở lại thì thấy dữ liệu đúng vì đọc từ DB |
| E13 | Platform admin gọi bulk hoặc export | Được, giống đơn lẻ hiện nay |
| E14 | Tin đang `draft` hoặc `closed` | Vẫn bulk và export được; đơn lẻ hiện cũng không kiểm trạng thái tin |

## Kiểm thử và quy trình

Theo khuôn tuần 1: test viết cùng tính năng; lỗi nào tìm thấy khi làm thì commit test đỏ trước, commit bản sửa sau.
Probe PostgreSQL thật trên test stack (`docker-compose.test.yml`, cổng 55000/55432/56379; stack dùng chung nên chỉ bật khi
cần và tắt sau khi chạy) cho C1, C6, C10, C14, vì mock không chứng minh được dòng history, job trong Redis, throttler hay
header thật. **Không kiểm được việc chấm xong** vì key Gemini đang `RESOURCE_EXHAUSTED`: mọi test dừng ở bước đã vào hàng
đợi, còn nhánh thành công của processor chỉ được phủ bằng spec có mock. Kết quả và log ghi vào thư mục này, như
`gd2-week1/results`.

## Nguồn tham khảo

- OWASP, *CSV Injection* — https://community.owasp.org/attacks/CSV_Injection (đọc 2026-10-13; URL cũ
  `owasp.org/www-community/attacks/CSV_Injection` trả 308 sang đây). Danh sách ký tự cần vô hiệu hoá; ghi chú rằng thêm `'`
  "not reliable in Microsoft Excel after saving and re-opening", còn thêm tab bên trong ô có ngoặc kép thì giữ được trên
  Excel, đổi lại tab nằm lại trong dữ liệu.

## Chưa xác minh

- Excel trên máy đặt vùng Việt Nam có thể dùng `;` làm dấu phân cách và dồn cả dòng vào một cột (**ASSUMPTION**). Kiểm
  bằng cách mở file thật trong Excel ở bước E2E; dòng `sep=,` không được dùng vì có hại riêng, chưa kiểm.
- Hạn mức rate và chi phí thực của Gemini (model Pro) cho 50 job, mỗi lần 5 job song song.
- Server action trả chuỗi CSV khoảng 1–2 MB (5000 dòng): tài liệu chỉ nêu giới hạn cho request body, chưa chạy thật
  (plan A2).
- Thời gian xử lý tuần tự 50 đơn (mỗi đơn khoảng 10 query cộng một `queue.add`) chưa đo; đo trên test stack (plan A3).

Đã kiểm khi viết plan (2026-10-13, đọc mã nguồn và tài liệu đã cài; chi tiết ở [plan.md](plan.md), bảng K1–K9):
`ThrottlerModule` là `@Global()` nên dùng được ngoài `AuthModule`; tracker mặc định là `req.ip`, `@Throttle` cho đổi
tracker theo route; axios 1.16.0 luôn bỏ BOM khi đọc text (web luôn tự thêm lại); `router.refresh()` của Next 16.3.3 giữ
state client nên tải lại không mất lựa chọn.
- Chưa có bằng chứng người dùng thật cần hai tính năng này; spec bám đề cương và roadmap.
