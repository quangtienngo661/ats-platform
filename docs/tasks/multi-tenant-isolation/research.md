# Research — Multi-tenant row-level isolation (GĐ1 module spec)

> Stage 2. Only the claims that needed it: a design decision resting on unrun library behaviour
> (entry condition 1, `rules/working-expectations.md`), and one claim promoted from `ASSUMPTION` to
> `verified` because it was cheap to check directly.

**Date:** 2026-09-12

## Findings

| # | Claim | Marker | Source / command | Result |
|---|---|---|---|---|
| 1 | Prisma Client can auto-filter every query on a model by mutating `args.where` inside a `$extends({ query: { model: { async findMany(...) {...} } } })` block, model-by-model or via `$allModels`/`$allOperations`. | documented | https://github.com/prisma/web/blob/main/apps/docs/content/docs/orm/v7/prisma-client/client-extensions/query.mdx — fetched via context7 (`/prisma/web`) this session | Confirmed with the library's own example: `args.where = { ...args.where, age: { gt: 18 } }; return query(args);` inside a `findMany` override. This is the mechanism cited (never chosen) in the module spec's Constraints table. |
| 2 | Prisma also documents PostgreSQL Row-Level Security as a tenant-isolation pattern: `$extends` wraps a query in a `$transaction` that first runs `SELECT set_config('app.current_company_id', <id>, TRUE)`, and the database enforces `CREATE POLICY tenant_isolation_policy ON "<table>" USING ("companyId" = current_setting('app.current_company_id', TRUE)::uuid)`. | documented | https://github.com/prisma/web/blob/main/apps/blog/content/blog/client-extensions-preview-8t3w27xkrxxn/index.mdx — fetched via context7 (`/prisma/web`) this session | Confirmed with the library's own worked example (`bypassRLS()`/`forCompany()` extensions + the matching `CREATE POLICY` SQL). Cited as the second candidate mechanism, also not chosen here. |
| 3 | `notifications.service.ts` never lists a `Notification` row across users — every method filters by the caller's own `userId`. | verified | `Read apps/api/src/app/notifications/notifications.service.ts:30-97` this session | `findAll` (`:35`, `where: { userId, ... }`), `getUnreadCount` (`:62`), `markAllAsRead` (`:81-82`) all hard-scope to the caller's own `userId`; no method accepts or exposes another user's notifications. Used in the module spec to justify leaving `Notification` outside the org-scoped table list (edge case E4). |
| 4 | This project's own established Use Case documentation (`important-notes/mo_ta_use_case_ATS.md`) already models several use cases this module touches, using `<<extend>>`/`<<include>>`/generalization relationships as its convention for an optional or constrained variant of an existing use case — a new module should extend that inventory, not duplicate it under new names. | documented | `Read important-notes/mo_ta_use_case_ATS.md` this session (a project source, not an external one, but genuinely not read before this point in the task) | Confirmed existing use cases directly relevant to this module: `Manage Job Postings` and `View Candidates` (§3 HR Operations Sub-diagram, lines ~109-140, actor `HR/Recruiter`); `Apply` (§6 Candidate Experience Sub-diagram, line 255, actor `Candidate`); `Adjust AI Screening Criteria` (§2 Authentication and Administration, line 72, actor `Admin`); `Manage Department` (§2, line 71) confirmed as full **Create/View/Update/Delete/List** CRUD for `Admin` (line 103, explicit CRUD note). Also confirmed: the document already uses `Admin ──▷ User` generalization (line 49-50) to express "Admin inherits everything User can do, plus more" — the same pattern this module's admin-global-visibility rule should reuse rather than restate in prose. No "Ops"/"System" actor or migration-type use case exists anywhere in the document. |

| 5 | The approved ĐA2 proposal places **per-organization administration** inside its official functional scope, not among its optional extensions — and its GĐ1 phase row covers schema, query filtering, tenant-aware auth **and** updating SRS/UC/ERD within 07/09–27/09. | documented | `Read E:\Learnings\…\Main\DeCuong_DoAn_2_NgoQuangTien_23521574.pdf` (7 pages, read in full) this session. Supervisor-signed 2026-08-24 (ThS. Trần Thị Hồng Yến) | §3.b upgrade table, "Kiến trúc dữ liệu (trọng tâm)": *"...lọc theo tổ chức ở mọi truy vấn, tenant-aware ở đăng nhập và phân quyền, **thêm cấp quản trị theo từng tổ chức**"*. §4 Phạm vi → Chức năng (the **Mở rộng – tùy chọn** section below it contains only Judge0): *"Cách ly ở mức row-level (mọi truy vấn lọc theo tổ chức), **có thêm cấp quản trị theo từng tổ chức**"* and *"**Quản lý tổ chức/phòng ban:** Cho phép **quản trị viên của mỗi doanh nghiệp** thiết lập thông tin doanh nghiệp, quản lý các phòng ban nội bộ và phân quyền cho các cán bộ nhân sự (HR)..."*. GĐ1 row of "Kế hoạch thực hiện": *"07/09–27/09/2026 (3 tuần) — Kiểm chứng lại hệ thống hiện có, vá lỗi tồn đọng; thiết lập kiến trúc multi-tenant row-level (gắn organizationId lên các bảng, lọc theo tổ chức ở mọi truy vấn, tenant-aware ở đăng nhập và phân quyền); **cập nhật** SRS, UC, ERD, kiến trúc"* → Kết quả: *"Nền tảng multi-tenant ổn định + SRS/sơ đồ cập nhật"*. This finding reversed `decision.md` D1 from Scope B to Scope A. |

## Version pinning

| Dependency | Version resolved | Docs URL used |
|---|---|---|
| Prisma | `^7.8` (`libs/CLAUDE.md` §2, confirmed against `package.json` earlier this session) | The two URLs above are general Prisma Client-extensions documentation, not version-pinned to 7.8 specifically — the `$extends`/query-extension API has been stable since Prisma 4.16, so this is a low-risk generality, but it is **not** the same strength of claim as a version-pinned citation and is stated honestly here rather than implied. |

## What was NOT established

- **Which of the two documented mechanisms (client extension vs Postgres RLS) — or the existing
  manual per-query pattern — will actually be used.** Deliberately left open: this module spec states
  required *behaviour* only; the enforcement mechanism is `build-feature`'s decision when this module
  is implemented (see `decision.md`, `plan.md`).
- **How the caller's `organizationId` is threaded into request handling** (AsyncLocalStorage, a JWT
  claim, or something else). Same reasoning — an implementation-approach question, not a spec
  question, and explicitly out of scope here.

Both open items are carried into `module-spec-multi-tenant.md`'s "Explicitly out of scope" note and
`plan.md`'s material-assumptions table — neither blocks this spec, since the spec's acceptance
criteria are written to hold under any of the three mechanisms.
