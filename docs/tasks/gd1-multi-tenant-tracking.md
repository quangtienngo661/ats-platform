# GĐ1 Multi-tenant — bảng theo dõi

## Cập nhật 2026-09-29 — tuần cuối GĐ1 (21–27/09)

Nhánh `feat/org-admin-enforcement`, HEAD baseline `8ec4751`. Git hiện có commit schema/enforcement/FE organization picker/AI default theo org; câu “chưa commit” trong snapshot 19/09 bên dưới đã cũ. PR #60 và merge/deploy hiện **chưa xác minh**; không dùng trạng thái PR ghi ngày 19/09 như trạng thái hôm nay.

Gói tiếp theo đã được người dùng duyệt “OK triển khai đi bạn”: [spec + coverage](gd1-week3/spec.md). Code local mới nối portal org_admin, account binding, recruiter accounts nguyên tử, owner job, interview/profile, nhãn tổ chức và thu hồi socket/session. Bằng chứng mới: [BE](gd1-week3/results/be-test-review.md), [FE](gd1-week3/results/fe-test-coverage.md); browser/Docker/live probe được ghi trong README của gói sau khi chạy.

## Snapshot lịch sử ngày 2026-09-19 — Tuần 1 & Tuần 2

> Checklist để keep track. Tuần 1 xong, chờ merge. Tuần 2 **đã chạy thật trên DB + API + trình duyệt (19/09)**
> — chỉ còn commit / push khi bạn bảo.
>
> Nguồn: `docs/tasks/organization-schema/` (Tuần 1) · `docs/tasks/org-admin-enforcement/` (Tuần 2) ·
> `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` (spec cả module) · Cập nhật 2026-09-19.

---

## TUẦN 1 — Nền dữ liệu (✅ XONG, PR #60 vẫn OPEN ngày 2026-09-19, chờ merge vào `dev`)

Mục tiêu: đặt cột `organizationId` khắp nơi mà **không đổi hành vi nào**. Schema và thực thi tách làm 2 deploy.

- [x] `model Organization` — ranh giới tenant, nằm trên `Department`
- [x] `organizationId` NOT NULL trên **9 bảng** org-scoped (denormalize thẳng, kể cả bảng con)
- [x] `model CandidateSkill` — bảng global mới, gỡ enum `candidate_skill_source` mồ côi
- [x] Migration `20260913042256_add_organization_tenant` — expand→backfill→contract, viết tay
- [x] Backfill mọi row hiện có vào seed org `ats-demo` (*Công ty TNHH Tuyển dụng ATS*)
- [x] Sửa 12 chỗ `create()` cấp `organizationId` (9 suy từ cha, 3 dùng `resolveSoleOrganizationId`)
- [x] Cập nhật `seed_departments.sql` (sẽ gãy nếu không thêm cột)
- [x] Verify trên DB thật: 0 null · 0 lệch cha-con (7 join) · NOT NULL chặn · CandidateSkill chạy · replay no-op
- [x] Gate: test **182/182** · lint 0 error · build **4/4**
- [x] 4 commit trên `feat/organization-tenant-schema`, PR #60, CI pass
- [ ] **Merge #60 vào `dev`** ← việc của bạn, chưa xong

---

## TUẦN 2 — Bật thực thi (🟢 ĐÃ CHẠY THẬT: DB + API + TRÌNH DUYỆT — còn commit)

Mục tiêu: biên giới bắt đầu **từ chối** request. Từ "cột có mặt" sang "cross-org bị chặn".
Branch `feat/org-admin-enforcement`, xếp chồng lên branch Tuần 1 (vì #60 chưa merge). **Chưa commit gì.**

### Hai quyết định đã chốt (`checkpoint-1.md`)

- [x] **Cơ chế lọc org** → **Manual qua helper tập trung** (`common/tenancy/tenant-caller.ts`)
- [x] **Cách truyền org của caller** → **Resolve trong JwtStrategy, truyền tường minh** (một object `TenantCaller`)

### L1 — Nền auth

- [x] Migration: `UserRole.org_admin` + `User.organizationId` — **tách 2 file** vì Postgres không cho dùng
      enum value mới trong cùng transaction: `…133839_add_org_admin_role` + `…133840_add_org_admin_binding_check`
- [x] **Apply 2 migration vào DB local** + thử CHECK: 3 trường hợp sai bị chặn, 2 control hợp lệ đi qua (19/09)
- [x] Mirror tay `libs/shared/types/src/lib/enums.ts`
- [x] Truyền org của caller: `JwtStrategy` + socket handshake cùng dùng `resolveTenantCaller`

### L2 — Cơ chế lọc

- [x] Áp helper lên các điểm enforcement Department hiện có (applications, candidates, cv-screenings, interviews…)
- [x] Bỏ hẳn `resolveSoleOrganizationId` — org giờ lấy từ caller (đã grep: 0 chỗ còn gọi)

### L3 — Bít lỗ + phân tầng admin

- [x] `roles.guard.ts`: chỉ `admin` (platform) được bypass · `org_admin` kế thừa quyền recruiter, bị lọc theo org
- [x] Duyệt **29 site** `@Roles(UserRole.admin)`: org_admin vào 11 (departments/recruiters/ai-config, có lọc) ·
      bị chặn 13 (skills, job-categories, interview topics, ai-usage-logs) · `users` 5 giữ platform-only
- [x] Đóng **4 gap surface**: job-postings browse · recruiters directory · departments CRUD · `canJoinJobRoom`

### Phát sinh trong lúc làm

- [x] **Lỗ leo quyền `PATCH /users/me`** — ai cũng gửi được `{"role":"admin"}`. Sửa theo đúng quy trình
      defect: test RED trước, rồi fix. **Đã thử trên API đang chạy**: `{"role":"admin"}` → 400, DB không đổi (19/09)
- [x] Module `organizations`: `POST/GET /organizations` (platform admin), `GET /organizations/me`; tổ chức mới
      tự có AI config mặc định riêng
- [x] **Lỗi tìm ra khi chạy thật:** index cũ trong DB chỉ cho **1 config mặc định toàn hệ thống** → không tạo được
      tổ chức thứ 2 (API còn báo nhầm "trùng slug"). Unit test không thấy được. Sửa bằng migration
      `20260919053000` (mỗi tổ chức 1 default), có probe RED → GREEN trên DB thật (`decision.md` D11)
- [x] **Ô chọn tổ chức** trong form tạo phòng ban + tạo cấu hình AI (chỉ platform admin thấy) — để admin
      không bị 400 trên web (`checkpoint-2.md`, `decision.md` D10). **Đã xem trên trình duyệt** (19/09)

### Chứng minh

- [x] Unit test cho mọi criterion 1 · 2 · 3 · 5 · 6a · 6b · 7 + E1 · E2 (bảng trong `spec.md`)
- [x] Teeth: cố tình phá 5 chỗ → test đỏ đúng chỗ → khôi phục
- [x] E2 **fail closed** (staff không có org → bị từ chối, không phải "thấy tất cả") — unit test
- [x] Gate 2026-09-18: test **314/314** (51 suite) · lint 0 error (api + web) · build **4/4** production
- [x] **Operation walk** với tổ chức thứ 2 (19/09): **43/43 PASS** — org B bị chặn ở dữ liệu org A (403/404 đúng
      lý do), platform admin thấy cả hai, socket: org B bị từ chối vào phòng job của A, admin + org_admin A vào được
      (script tự chấm socket từ log API; teeth: cố tình gây race → 4 FAIL, đảo kỳ vọng → đúng 1 FAIL)
      (`operation.md`, `results/`)
- [x] **Xem ô chọn tổ chức trên trình duyệt** (19/09): không chọn tổ chức → trình duyệt chặn, không gửi request;
      chọn Walk Org B → phòng ban + cấu hình AI + bản nhân bản đều nằm đúng tổ chức B trong DB; form sửa không có ô

### Còn lại sau khi chạy thật

- [ ] Commit theo thứ tự: RED `/users/me` → fix; RED probe default → migration sửa; rồi các commit feature ← khi bạn bảo
- [ ] Push + PR ← khi bạn bảo

### Lỗi có sẵn từ trước, tìm thấy khi chạy thật (tách task riêng, không sửa ngang)

- Socket: web xin vào phòng job ngay lúc `connect`, trước khi server xử lý xong handshake → đôi khi bị bỏ qua
  im lặng (kanban mất realtime)
- Docker image của web không build được: `npm ci` trên `node:24-alpine` báo file lock lệch
- Form "Thêm cấu hình AI": nút **Hủy** (và X) thiếu `type="button"` → bấm Hủy **vẫn tạo cấu hình** (đã xác nhận)

### Để sang Tuần 3 (không làm bây giờ)

- `proxy.ts` đang đẩy `org_admin` về `/403` — chưa có route/UI cho org_admin trên web
- Màn hình quản lý org_admin; nhãn tổ chức trên danh sách phòng ban / cấu hình AI của platform admin
- `org_admin` chưa có trong danh sách vai trò của form user (ô vai trò bị khoá hiện nhãn trống)

---

## Bức tranh before / after

```
TRƯỚC TUẦN 2                  SAU TUẦN 2 (code hiện tại)
─────────────────────         ─────────────────────
1 ranh giới: Department       2 ranh giới lồng: Organization ⊃ Department
1 admin (chìa vạn năng)       platform_admin (xuyên org) + org_admin (1 org)
organizationId có, không dùng mọi query org-scoped lọc theo org của caller
4 gap surface mở toang        4 gap đóng
```

Một câu: trước đây hệ thống trả lời *"phòng ban nào?"*; giờ nó trả lời *"công ty nào, rồi phòng ban nào?"* — và
phân biệt chủ nền tảng với quản trị của từng công ty. **Đã chứng minh trên DB + API + trình duyệt thật (19/09).**
