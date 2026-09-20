# Decisions — Organization schema (GĐ1 Tuần 1)

> The running "why it is the way it is". Feeds the project brain's §3.

**Date:** 2026-09-13 · All three were put to the human and answered; none was chosen silently.

---

## D1 — How is an `org-admin` bound to exactly one organization?

**Settles `docs/tasks/multi-tenant-isolation/decision.md` D4**, which the spec deliberately left open
as a mechanism question. It is answered here because Tuần 1 is the run that owns the schema.

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| **1 — new `UserRole.org_admin` + nullable `User.organizationId`** ✅ CHOSEN | The **only** option where `RolesGuard` can read the tier straight from the JWT it already carries — no extra query per request (`survey.md`, `roles.guard.ts:22`). Smallest schema delta: one enum value, one nullable column | The enum must be mirrored by hand into `libs/shared/types/src/lib/enums.ts:5-10`, with **no CI check** to catch drift (`libs/CLAUDE.md` §4-5). Puts a column on `users` that only one role ever populates |
| 2 — `Recruiter.isOrgAdmin` boolean | Zero new binding — reuses the `Recruiter → Department → Organization` chain the codebase already resolves | ⛔ **`Recruiter.departmentId` is NON-NULL** (`schema.prisma:242`). An org-admin modelled as a Recruiter is *forced* to belong to one department, which is wrong for someone administering the whole organization. Fixing that means first making an existing non-null FK nullable on a populated table — a migration of its own |
| 3 — dedicated `OrganizationAdmin` join table | Cleanest semantics; naturally extends to one person administering several organizations later | `RolesGuard` reads only `user.role` off the request today (`roles.guard.ts:20-22`) — a table means **a database query on every guarded request**, or threading a new claim into the JWT anyway |

**Chosen:** **1**. The deciding factor is `roles.guard.ts:22`: the tier has to be readable at guard
time, and option 1 is the only one where it already is. Option 2 was rejected on a hard schema
constraint rather than on taste — the spec's D4 called it "overloads recruiter semantically", and the
survey upgraded that from a semantic objection to a non-null foreign key.

**Mechanism:** a fourth value on the Prisma `UserRole` enum plus `User.organizationId String?`, both
mirrored into the shared types package in the same commit.
**File:** `libs/backend/database/prisma/schema.prisma` + `libs/shared/types/src/lib/enums.ts` —
landing in **Tuần 2**, per D2 below.

**Defence**

| | |
|---|---|
| **Authorised by** | The human, this session, on the survey's two findings — `roles.guard.ts:22` (tier must be readable from the request) and `schema.prisma:242` (option 2's FK is non-null). The *requirement* for the tier to exist at all is the approved proposal (spec `decision.md` D1) |
| **Diverges from the reference system?** | `no` — nothing implements any of the three today |
| **The answer, out loud** | "An org-admin has to be recognisable at the moment a request is authorised. The guard reads the role off the JWT and nothing else, so a role value plus an organization column on the user is the only shape that does not add a database round-trip to every guarded request. The alternative that reused the recruiter record was blocked outright: a recruiter must have a department, and an organization's administrator is not a member of one department." |

**What this does not fix:** the enum mirror stays manual. Nothing mechanical catches
`schema.prisma` and `enums.ts` drifting apart — this is carried as a plan step, not a guarantee.

---

## D2 — Does the `org-admin` binding ship inside Tuần 1's migration, or separately at the head of Tuần 2?

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| **Split — Tuần 1 is `Organization` only** ✅ CHOSEN | The enum value lands **next to the code that handles it**. Tuần 1's migration touches only tables that gain `organizationId`; `User` is not one of them, so splitting costs no re-migration of anything | Two migrations instead of one |
| Bundle — everything in one migration | One review, one run, one backfill verification | `UserRole.org_admin` would exist for a week with **no code that handles it**: `roles.guard.ts:22` hard-codes `admin`, and 29 `@Roles(UserRole.admin)` sites would silently 403 any org-admin created in that window. A wrong state no test would catch |

**Chosen:** Split.

**Reverses a claim made earlier in this session.** The argument for pulling the binding into Tuần 1
was "otherwise the second migration re-touches tables the first one just migrated". That is true of
**option 2** (`Recruiter` is one of the 9 org-scoped tables) and **false of option 1**, which was the
option actually chosen: `User` is a global table and is untouched by Tuần 1. Once D1 landed on option
1, the reason to bundle disappeared, and the reason to split — a dead enum value — remained.

**Mechanism:** two migrations. Tuần 1 = `Organization` + `organizationId` on the 9 tables +
`CandidateSkill` + backfill. Tuần 2 opens with a small migration adding `UserRole.org_admin` and
`User.organizationId`, committed alongside the `RolesGuard` change that reads them.
**File:** `libs/backend/database/prisma/migrations/` — this task authors the first only.

**Defence**

| | |
|---|---|
| **Authorised by** | The human at CP1, this session, presented with both options and the concrete cost of each |
| **Diverges from the reference system?** | `no` |
| **The answer, out loud** | "We keep the new role out of the schema until the week we teach the guard about it. Adding a role value that no code branches on is not neutral — the guard hard-codes a single admin check, so a user given that role would be refused everywhere, and nothing in the suite would report it. Splitting costs one extra migration and no rework, because the user table is not part of this week's change anyway." |

**What this does not fix:** Tuần 2 now opens with a schema step rather than straight into logic. That
is a sequencing cost, accepted deliberately.

---

## D3 — What is the seed organization every existing row is backfilled into?

Closes the `ASSUMPTION` standing against acceptance criterion 4 in
`docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md`.

**Options weighed**

| Option | Pros | Cons |
|---|---|---|
| **A demo company identity** ✅ CHOSEN — `name = "Công ty TNHH Tuyển dụng ATS"`, `slug = "ats-demo"` | Reads as a real tenant when the system is demonstrated; when a second organization is created to *show* isolation, two plausible names side by side make the boundary legible | Slightly overstates what it is — a backfill bucket presented as a company |
| A neutral placeholder — `"Tổ chức mặc định"`, `slug = "default"` | Honest about being where pre-migration data was gathered | Reads as scaffolding in a demonstration; "Mặc định vs Công ty B" is a weaker illustration of tenancy than two real names |

**Chosen:** the demo company identity.

**Mechanism:** the migration's `INSERT` into `organizations` uses a fixed, literal UUID so the
backfill `UPDATE` statements can reference it deterministically within the same migration.
**File:** `libs/backend/database/prisma/migrations/<timestamp>_add_organization_tenant/migration.sql`.

**Defence**

| | |
|---|---|
| **Authorised by** | The human at CP1, this session — the question was raised precisely because the module spec had it standing as an unresolved `ASSUMPTION`, not filled in silently |
| **Diverges from the reference system?** | `no` — no organization concept exists to diverge from |
| **The answer, out loud** | "Every row that exists today belongs to one organization, because until now there was only one. We give it a real company name rather than a placeholder, so that when a second organization is added to demonstrate isolation, the two read as two companies instead of one company and one leftover bucket." |

**What this does not fix:** the name is cosmetic and changeable by a single `UPDATE` later; nothing
here depends on it.
