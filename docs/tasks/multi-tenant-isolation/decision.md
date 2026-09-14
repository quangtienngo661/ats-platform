# Decisions — Multi-tenant row-level isolation (GĐ1 module spec)

> The running "why it is the way it is". Feeds the project brain's §3.

**Date:** 2026-09-12

---

## D1 — How much of the admin/auth layer changes in this build?

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| **A — Full: split `platform-admin` (orgs + taxonomy) vs `org-admin` (one org's departments/recruiters/AiConfig)** ✅ CHOSEN | **Required by the approved proposal** (see Defence); a real org can self-manage without the global admin | Heaviest slice of the module — new role, new guard branch, new UI gating; real pressure on the (already-compressed) 3-week window |
| B — Lean: keep the single global `admin`, unchanged | Isolation correctness is identical to A; smallest slice | **Contradicts the approved ĐA2 proposal**, which lists per-organization administration inside its official scope, not as an optional extension. Also leaves an org unable to self-manage until GĐ2 |

**Chosen:** **A** — not on a cost/benefit judgement, but because the ĐA2 proposal signed off by the
supervisor on 2026-08-24 puts per-organization administration **inside the committed scope**.
Isolation *correctness* genuinely is identical either way; what differs is whether the delivered
system matches what was formally promised.

**Reversed from an earlier B.** This entry originally recorded **B** (lean), chosen at this run's
`AskUserQuestion` gate on a schedule-risk argument. That choice rested on an unverified assumption —
that the proposal did not mandate a role split — made **before the proposal PDF itself had been
read**. It was read in full afterwards, the assumption proved false, and the decision was put back
to the human, who chose A. See Reversals below.

**Mechanism:** `module-spec-multi-tenant.md`'s Scope section states two administrative tiers
(`platform-admin` global, `org-admin` bound to exactly one organization); criteria 6a/6b/7 state
their respective visibility and write-target rules.
**File:** `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` — Scope + Acceptance criteria.

**Defence**

| | |
|---|---|
| **Authorised by** | The approved proposal, in two separate places: §3.b (upgrade table, "trọng tâm" row) — *"...tenant-aware ở đăng nhập và phân quyền, **thêm cấp quản trị theo từng tổ chức**"*; and §4 Phạm vi (official functional scope, **not** the "Mở rộng – tùy chọn" section that holds Judge0) — *"Cách ly ở mức row-level..., **có thêm cấp quản trị theo từng tổ chức**"* plus *"Cho phép **quản trị viên của mỗi doanh nghiệp** thiết lập thông tin doanh nghiệp, quản lý các phòng ban nội bộ..."*. File: `E:\…\Main\DeCuong_DoAn_2_NgoQuangTien_23521574.pdf`, read in full 2026-09-12 |
| **Diverges from the reference system?** | `no` — and specifically, this decision *removes* a divergence: the earlier B choice would have shipped a system narrower than the approved proposal's stated scope |
| **The answer, out loud** | "Per-organization administration isn't an optional nicety we traded away for schedule — the approved proposal lists it inside the official functional scope, in two places, alongside the multi-tenant core rather than beside the one item it does mark optional. We briefly chose the leaner option before reading the proposal end-to-end; once we did, we reversed it." |

**What this does not fix:** it adds real work to weeks 2–3 (a new role, guard branches, and admin UI
gating) in a window that already lost its first week. If that pressure becomes real, the honest
lever is to reduce the *depth* of org-admin (basic CRUD only) — not to silently drop the tier, which
is what would put the build back out of line with the proposal.

---

## D2 — Does this spec's acceptance criteria explicitly close the 4 gap surfaces the survey found?

(`job-postings.service.ts` findAll/findOne, `recruiters.service.ts` findAll/findOne,
`departments.service.ts` CRUD, and `socket-io.service.ts`'s `canJoinJobRoom` — none of which have any
department-scoping today; see `survey.md`.)

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| Include — close all 4 as part of this module's criteria | Ships org-isolation without a known, immediate hole on day one | Adds real implementation surface later (`build-feature`'s problem, not this spec's) |
| Exclude — document as pre-existing gaps, leave for a later pass | Smaller acceptance-criteria list | The exact code that leaks org-wide today would leak **cross-tenant** the moment `Organization` exists — shipping a "multi-tenant isolation" module with a documented, known leak defeats its own purpose |

**Chosen:** Include — these 4 surfaces become genuine cross-tenant data leaks the instant
`Organization` exists; they are not optional polish.

**Mechanism:** `module-spec-multi-tenant.md`'s acceptance criterion #2 (cross-org resource-by-id and
Socket.IO room-join refusal) and edge case E1 (the 3 previously-open REST surfaces gain the same
check, not an exception).
**File:** `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` — Scope + Acceptance
criteria sections.

**Defence**

| | |
|---|---|
| **Authorised by** | The survey finding itself (`survey.md`, file:line evidenced this session) — a correctness requirement surfaced by reading the current code, not a preference |
| **Diverges from the reference system?** | `no` — this closes a gap in the CURRENT system's behaviour rather than diverging from any documented or observed target |
| **The answer, out loud** | "These three REST surfaces plus the Socket.IO job-room join have zero department-scoping today — a low-severity gap while there's only one organization in the world. The instant a second organization exists, the identical code becomes a cross-tenant leak, so closing them is part of correctly shipping org-isolation, not a bonus scope addition." |

**What this does not fix:** the pre-existing `getMySchedules`-vs-`assertCanViewSchedule`
boundary-width inconsistency on `InterviewSchedule` (survey.md), and the dead
`interview-schedule` `OwnershipGuard` branch — both are noted in the module spec (edge case E3) and
deliberately left untouched: neither is a cross-org leak, and reconciling the first or
resurrecting/removing the second is unrelated scope creep with no isolation-correctness value.

---

## D3 — Does `organizationId` live directly on every org-scoped table, or only on the tables closest to `Organization` (with child tables deriving it via a join through their parent)?

Surfaced during a deeper post-writing review (the human asked for "phân tích sâu các lỗ hỏng" after
the first draft), not at the original plan-approval gate — recorded here rather than silently folded
into the ERD as if it had always been explicit.

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| Denormalize `organizationId` onto **all 9** org-scoped tables, including pure children (`JobPostingSkill`, `ApplicationHistory`, `CVScreening`, `InterviewSchedule`) | Works identically under **all three** candidate mechanisms (`research.md` #1-2 + the existing manual pattern) — a Postgres RLS policy is per-table and needs the column present on that table to reference it directly; a Prisma extension's `where` injection stays uniform across every model | A child row's `organizationId` could in principle drift from its parent's if a future write path sets it wrong; no schema-level guarantee (a `CHECK` constraint or trigger) is proposed here |
| Only the tables directly under `Organization`/`Department` carry the column; children derive org-scope by joining through their parent | No drift possible — one source of truth per row | Materially harder under Postgres RLS specifically (a policy would need a subquery joining to the parent table, not a flat column comparison) — this is not a marginal cost, it changes which of the three researched mechanisms stays simple |

**Chosen:** Denormalize onto all 9 — it is the option that keeps every one of the three researched
mechanisms viable without extra complexity, which matters precisely because this spec deliberately
leaves the mechanism choice to `build-feature` (see Scope, "explicitly out of scope"). Choosing the
join-only option here would have quietly narrowed that later choice without saying so.

**Mechanism:** `module-spec-multi-tenant.md`'s embedded ERD draws `organizationId FK` directly on
every org-scoped entity's attribute block; a new Business rules bullet states this explicitly rather
than leaving it implied by the diagram alone.
**File:** `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md` — ERD + Business rules.

**Defence**

| | |
|---|---|
| **Authorised by** | `research.md` #1-2 (both documented mechanisms are simplest against a directly-present column; RLS specifically requires it on the policy's own table) — a correctness/feasibility finding, not a bare preference |
| **Diverges from the reference system?** | `no` — there is no live reference system with a different schema shape to diverge from |
| **The answer, out loud** | "We put `organizationId` on every org-scoped table, including pure child tables, because that's what keeps all three enforcement mechanisms this spec researched equally usable later — a join-only design would have quietly ruled out Postgres RLS as a realistic option before `build-feature` even got to choose. The honest cost is a drift risk this document does not close: nothing here forces a child row's `organizationId` to match its parent's at the database level." |

**What this does not fix:** no schema-level guarantee (`CHECK` constraint, trigger, or generated
column) prevents a child row from being written with an `organizationId` that disagrees with its
parent's. Left to `build-feature`'s own judgement whether that extra safety is worth the complexity.

---

## D4 — How is an `org-admin` bound to exactly one organization? (deliberately left open)

Introduced by D1's reversal to Scope A: the system now needs an administrative principal who belongs
to one organization, and today's schema has no such concept — `UserRole` is only
`candidate | recruiter | admin` (`survey.md`), and the only existing way any principal resolves to an
organization at all is `Recruiter.departmentId → Department.organizationId`.

**Options weighed — none chosen here**

| Option | Pros | Cons |
|---|---|---|
| New `UserRole.org_admin` + a nullable `User.organizationId` | Smallest schema delta; org resolves in one hop | Puts a column on `User` that only one role ever uses |
| `org-admin` is a `Recruiter` row carrying an `isOrgAdmin` flag | Zero new binding — reuses the existing `Recruiter → Department → Organization` chain the whole codebase already resolves | Overloads "recruiter" semantically; an org-admin who manages no jobs is still modelled as a recruiter |
| A dedicated `OrganizationAdmin` join table (`userId` + `organizationId`) | Cleanest semantics; naturally allows one person to administer several orgs later | One more table and one more resolution path to maintain |

**Chosen:** *(none — deliberately deferred)*. This is a **mechanism** question, and this document's
standing rule is that it states required behaviour and leaves mechanism to the `build-feature` run
that implements the module (see the module spec's Scope, "explicitly out of scope"). The spec instead
states the *behavioural* constraint every option must satisfy: an `org-admin` resolves to exactly one
organization, that binding is resolvable on every request, and it can never be self-elevated to
another organization.

**Mechanism:** stated as a constraint rather than a schema choice — `module-spec-multi-tenant.md`
Business rules + criteria 6b/7.
**File:** `docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md`.

**Defence**

| | |
|---|---|
| **Authorised by** | The proposal requires the *tier* to exist (`decision.md` D1's Defence) but says nothing about how it is stored — so the storage shape is genuinely the implementer's, and pinning it here would be over-specification of exactly the kind this project's `module-spec.md` template warns against |
| **Diverges from the reference system?** | `no` — nothing existing implements any of the three options |
| **The answer, out loud** | "The proposal requires that each organization has its own administrator; it does not say whether that's a new role column, a flag on the recruiter record, or a join table. We specified the behaviour it must satisfy and left the storage shape to implementation, because all three satisfy it and the choice depends on code we haven't written yet." |

**What this does not fix:** the ERD in the module spec therefore cannot draw this binding concretely
— it is called out there as an open point rather than illustrated, which makes the ERD incomplete on
exactly one relationship until `build-feature` settles it.

---

## Reversals

**module-spec-multi-tenant.md's original UC section** (Stage 4, first draft) listed 5 flat
"actor + goal" rows as if each were a new use case. On the same deeper review that surfaced D3, this
was found to duplicate use cases this project's own `mo_ta_use_case_ATS.md` already models
(`research.md` #4) under new names, instead of extending them the way that document's own
`<<extend>>`/generalization convention is built for. Corrected directly in
`module-spec-multi-tenant.md`'s UC section: most rows now state which existing use case they extend
(citing `research.md` #4) rather than standing alone; two genuinely new acceptance criteria (admin's
global read visibility, and an admin-created `Department` needing an explicit organization target)
were added because the flat UC list had been silently substituting for stating them as criteria.
`plan.md`'s Step 6 ("write a UC list, one per criterion") is left as the historical record of the
original, less-precise intention — not rewritten to match the correction.

| Decision | Reversed by | What changed underneath it |
|---|---|---|
| UC section as 5 standalone new use cases (original Stage 4 draft) | This entry, prompted by the human's deeper-review request | Discovery of `important-notes/mo_ta_use_case_ATS.md` (`research.md` #4) — an existing artefact the original survey pass should have found and did not |
| **D1 = Scope B** (single global admin, org-admin deferred to GĐ2) — chosen at this run's `AskUserQuestion` gate | **D1 = Scope A**, re-decided by the human on 2026-09-12 after the proposal was read | `research.md` #5 — the approved ĐA2 proposal PDF was read end-to-end for the first time and puts per-organization administration in its **official** scope (§3.b and §4), not among its optional extensions. The original B choice rested on the unverified assumption that the proposal did not mandate it; that assumption was the failure, not the reasoning built on top of it |

## Path notes

None — no files referenced in this record have moved.
