# Decisions — Organization enforcement + org_admin tier (GĐ1 Tuần 2)

> Why it is the way it is. D2 and D3 were put to the human (`checkpoint-1.md`); the rest are
> derived from those two, the module spec, or a finding in `survey.md`, and say so.

---

## D1 — Branch base: stacked on the Tuần 1 branch

PR #60 (Tuần 1) was still open when work started; `dev` had no `Organization` model, so a branch
cut from `dev` could not compile Tuần 2. The human had chosen "merge #60 first, then branch from
dev", then asked to proceed directly. Merging is the human's action and was not taken; the branch
was stacked on `feat/organization-tenant-schema` instead — the C-03-on-C-04 precedent.

**Consequence:** until #60 merges, this branch's diff against `dev` includes Tuần 1's commits. Once
it merges, the Tuần 2 PR shrinks to Tuần 2 alone.

---

## D2 — Filtering mechanism: explicit, through one central helper ✅ human's choice

| Option | For | Against |
|---|---|---|
| **Manual, via `common/tenancy/tenant-caller.ts`** ✅ | Matches every existing check in the codebase; testable with the existing Prisma mock factory (assert the `where`); no new dependency | An endpoint written later that forgets the helper leaks — nothing enforces it automatically |
| Prisma `$extends` injecting `where` | New endpoints protected by default | `PrismaService` is a singleton with no request context → needs AsyncLocalStorage; the socket join still needs its own check; the platform admin needs a bypass; mocked specs could not prove it runs |
| Postgres RLS | Blocks at the database, raw SQL included | ALS + a transaction per query for `set_config`, a non-owner DB role (docker-compose / .env), and no test in the repo touches a real database |

**Mechanism:** `organizationScope(caller)` for lists, `assertOrganizationAccess(caller, orgId)` for
one resource, `resolveWriteOrganization(caller, requested)` for rows with no parent.
**File:** `apps/api/src/common/tenancy/tenant-caller.ts`.

**What this does not fix:** the cost named above — a future endpoint must call the helper.

---

## D3 — Propagation: resolved in JwtStrategy, passed as one object ✅ human's choice

The caller's organization is resolved where the user already is (`JwtStrategy.validate()` reads it
from the database per request) and passed to services as **one `TenantCaller` object** replacing the
old `(userId, role)` pair. One object rather than a third string argument: `userId` and
`organizationId` are both strings, and two adjacent strings swapped at a call site still compile.

**Correction recorded rather than hidden.** When this was put to the human, the AsyncLocalStorage
option was described as needing "a new dependency". It does not — `nestjs-cls` is already installed
(used only for log correlation ids). The option's other two costs stand: an implicit dependency in
every service, and BullMQ processors and Socket.IO run outside the HTTP request context the CLS
middleware covers. The choice stands on those; the misstatement is recorded here.

**Mechanism:** `resolveTenantCaller()` — shared by JwtStrategy and the socket handshake so the two
transports cannot disagree; `@CurrentCaller()` param decorator.
**Files:** `common/tenancy/resolve-tenant-caller.ts`, `common/decorators/current-caller.decorator.ts`.

---

## D4 — `org_admin ──▷ recruiter` is implemented once, in RolesGuard

The module spec's generalization says an org_admin inherits the recruiter's use cases. Implemented
in `grantedRoles()` (an org_admin satisfies a `recruiter` requirement) instead of adding `org_admin`
to every `@Roles(recruiter)` — one place, and the direction is one-way: a recruiter does not inherit
org_admin routes. The platform admin's unconditional bypass (`roles.guard.ts`) stays `admin`-only.

**File:** `apps/api/src/common/guards/roles.guard.ts`.

---

## D5 — Which admin routes an org_admin enters

Derived from the module spec (org-owned vs platform taxonomy), not a new choice:

| Admitted, organization-scoped | Refused (platform only) |
|---|---|
| departments, recruiters, ai-config (11 routes) | skills, job-categories, interview topics, ai-usage-logs (13) |

**`users` (5) stays platform-only.** `User` has no organization column for recruiters and
candidates, and the proposal's "phân quyền cho cán bộ nhân sự" is covered by the `recruiters` module,
which *is* organization-scoped. This is the depth reduction Tuần 1's D1 named as the legitimate
lever — the tier exists; its reach into account management is deferred.

---

## D6 — Some cross-organization moves are refused for everyone, platform admin included

Handing a job posting to a recruiter of another organization (F7), or assigning an interviewer from
another organization to a schedule: both would carry one organization's data into another while the
rows' `organizationId` stayed behind. Refused for every caller. A platform admin may still move a
**recruiter** to another organization's department — its `organizationId` now moves with it (F6).

---

## D7 — The org_admin binding is a database invariant

`CHECK ((role = 'org_admin') = (organization_id IS NOT NULL))` on `users`, plus `ON DELETE RESTRICT`
on the FK. In its own migration because PostgreSQL rejects using a newly added enum value in the
transaction that added it. The service layer repeats the rule for a readable 400/404.

**Files:** migrations `20260916133839_add_org_admin_role`, `20260916133840_add_org_admin_binding_check`.

---

## D8 — Organizations: create / list / read only

`POST/GET /organizations` (platform admin), `GET /organizations/me` (org staff). A new organization
gets its own default AI config in the same transaction (F5 makes the default per organization, so
one without a default could not screen). No update or delete: removing a tenant removes its hiring
history, which this build deliberately does not expose.

---

## D9 — Responses still carry `organizationId`

Tuần 1 already put the column on the models, and every `findUnique` without a `select` returns it.
Not stripped globally — no web type requires it, and for staff it is their own organization. The
one typed summary that had been widened only for an access check (`getScreeningStats().job`) is
listed field by field so it does not gain the column.

---

## D10 — A platform admin picks the organization in the two create forms ✅ human's choice

Criterion 7 left the web's department and AI-config create forms returning 400 for the platform
admin (`checkpoint-2.md`). Chosen: an organization picker in both forms, shown only to that admin —
over leaving the regression to Tuần 3, or an API fallback that would bend criterion 7.

**Mechanism:** the page (a Server Component) calls `getOrganizationOptionsForCurrentUser()`, which
returns `GET /organizations` only when `GET /users/me` reports `admin`, and `[]` for everyone else.
The list goes page → client → modal; the modal renders a required `<select name="organizationId">`
only when the list is non-empty — and for departments only when creating, since a department never
changes organization. The create actions forward `organizationId` only when the form sent one, so an
org_admin's request is unchanged and the API applies its own organization. Duplicating an AI config
sends the source config's `organizationId`, so the copy stays where the original is, for every caller.

**Not done:** the admin's lists do not say which organization each department or config belongs to —
with two organizations they mix unlabelled. Tuần 3 (admin UI).

**Files (D10):** `apps/web/src/servers/organizations/organizations.action.ts` ·
`libs/shared/types/src/lib/interfaces/organizations/organizations.interface.ts` ·
`apps/web/src/components/department-management/ui/MutateDepartmentModal.tsx` ·
`apps/web/src/components/ai-configuration/ui/AddProfileModal.tsx` ·
`apps/web/src/servers/departments/departments.action.ts` · `apps/web/src/servers/ai-config/ai-config.action.ts`
— plus the two pages and two client components that pass the list down.

---

## D11 — One default AI config per organization, enforced by the database (defect found live)

The operation walk found that no second organization could be created: a partial unique index from
March, `ai_configs_only_one_default_idx` on `(is_default) WHERE is_default`, allowed one default in the
whole system, and D8 gives every new organization its own (`operation.md` §2). No unit test could see it —
Prisma is mocked, and a partial index exists only in a migration, never in `schema.prisma`.

Replaced, not dropped: the index becomes unique on `organization_id` where `is_default`, so the database
still guarantees what the service's `clearDefault(tx, organizationId)` maintains — one default **per
organization**. Dropping it outright would have left that invariant to application code alone.

**Proof:** `results/probe-one-default-per-org.js` — RED before the migration (second organization's default
rejected), GREEN after (accepted), and its control (two defaults in one organization) rejected both times.

**Left as is:** `OrganizationsService.create` still reads any P2002 as a slug conflict. After this fix the
only unique constraint that transaction can hit is the slug (a brand-new organization has no default to
collide with), so the message is now correct by construction; narrowing it by `meta.target` would depend on
the driver adapter's error shape, which was not checked here.

**File:** `libs/backend/database/prisma/migrations/20260919053000_ai_config_default_per_organization/migration.sql`.
