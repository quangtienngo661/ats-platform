-- Multi-tenant row-level isolation, GĐ1 Tuần 2 (L1): the org-admin tier.
--
-- `admin` stays the PLATFORM administrator (global reach). `org_admin` administers
-- exactly one organization, bound through users.organization_id.
-- Decision: docs/tasks/organization-schema/decision.md D1 (binding shape) and D2
-- (deferred to Tuần 2, so the enum value lands with the code that branches on it).
--
-- The CHECK constraint that makes the binding mandatory lives in the NEXT migration:
-- PostgreSQL refuses to use a newly added enum value inside the transaction that
-- added it ("unsafe use of new value"), and that constraint compares against it.

-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'org_admin';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
