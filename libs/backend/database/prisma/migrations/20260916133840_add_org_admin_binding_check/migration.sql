-- An org_admin is bound to exactly one organization, and nobody else carries one.
--
--   role = org_admin  ->  organization_id IS NOT NULL
--   any other role    ->  organization_id IS NULL
--
-- Enforced here rather than only in application code because the binding is the
-- whole tenant boundary for this role: an org_admin with no organization would
-- have to be special-cased everywhere, and a recruiter or candidate carrying one
-- would be a second, contradictory source of "which organization is this".
-- Prisma's schema language cannot express a CHECK constraint, so it lives only here.
-- Existing rows satisfy it: no org_admin exists yet and every organization_id is NULL.

ALTER TABLE "users" ADD CONSTRAINT "users_org_admin_binding_check"
    CHECK (("role" = 'org_admin') = ("organization_id" IS NOT NULL));
