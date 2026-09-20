-- Multi-tenant row-level isolation, GĐ1 Tuần 1: introduce Organization as the tenant
-- boundary and denormalise organization_id onto all 9 org-scoped tables.
--
-- Data-preserving (expand -> backfill -> contract). Prisma cannot auto-generate this:
-- adding a NOT NULL column to a populated table needs a backfill step in between, so
-- the migration is authored explicitly. Same technique as
-- 20260830100000_change_schedule_to_start_at_duration on this codebase.
--
-- The database is single-tenant today, so every existing row belongs to the one seed
-- organization. Its UUID is a fixed literal (not gen_random_uuid()) so the backfill
-- statements below can reference it deterministically within this same migration.
--
-- Spec: docs/tasks/multi-tenant-isolation/module-spec-multi-tenant.md (criterion 4)
-- Decisions: docs/tasks/organization-schema/decision.md (D2 split, D3 seed identity)
--
-- NOT in this migration, deliberately (decision.md D2): UserRole.org_admin and
-- User.organization_id. Those land at the head of Tuan 2, alongside the RolesGuard
-- change that reads them — an enum value no code branches on is a wrong state that
-- no test would catch.

-- CreateTable
CREATE TABLE "organizations" (
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Seed the organization every pre-existing row is backfilled into.
INSERT INTO "organizations" ("organization_id", "name", "slug") VALUES
    ('00000000-0000-4000-8000-000000000001', 'Công ty TNHH Tuyển dụng ATS', 'ats-demo');

-- ============================================================
-- EXPAND — add the column nullable so existing rows survive
-- ============================================================
ALTER TABLE "departments"          ADD COLUMN "organization_id" TEXT;
ALTER TABLE "recruiters"           ADD COLUMN "organization_id" TEXT;
ALTER TABLE "job_postings"         ADD COLUMN "organization_id" TEXT;
ALTER TABLE "job_posting_skills"   ADD COLUMN "organization_id" TEXT;
ALTER TABLE "applications"         ADD COLUMN "organization_id" TEXT;
ALTER TABLE "application_history"  ADD COLUMN "organization_id" TEXT;
ALTER TABLE "cv_screenings"        ADD COLUMN "organization_id" TEXT;
ALTER TABLE "ai_configs"           ADD COLUMN "organization_id" TEXT;
ALTER TABLE "interview_schedules"  ADD COLUMN "organization_id" TEXT;

-- ============================================================
-- BACKFILL — exactly one organization exists, so every row takes it.
-- 8 of these 9 tables could equally be derived by joining up to departments;
-- ai_configs has no parent to derive from at all (no FK upward), so a direct
-- assignment is the only option there and is used uniformly for all 9.
-- ============================================================
UPDATE "departments"         SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "recruiters"          SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "job_postings"        SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "job_posting_skills"  SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "applications"        SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "application_history" SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "cv_screenings"       SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "ai_configs"          SET "organization_id" = '00000000-0000-4000-8000-000000000001';
UPDATE "interview_schedules" SET "organization_id" = '00000000-0000-4000-8000-000000000001';

-- ============================================================
-- CONTRACT — enforce NOT NULL now that no row is null
-- ============================================================
ALTER TABLE "departments"         ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "recruiters"          ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "job_postings"        ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "job_posting_skills"  ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "applications"        ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "application_history" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "cv_screenings"       ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "ai_configs"          ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "interview_schedules" ALTER COLUMN "organization_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recruiters" ADD CONSTRAINT "recruiters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_posting_skills" ADD CONSTRAINT "job_posting_skills_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");
CREATE INDEX "recruiters_organization_id_idx" ON "recruiters"("organization_id");
CREATE INDEX "job_postings_organization_id_idx" ON "job_postings"("organization_id");
CREATE INDEX "job_posting_skills_organization_id_idx" ON "job_posting_skills"("organization_id");
CREATE INDEX "applications_organization_id_idx" ON "applications"("organization_id");
CREATE INDEX "application_history_organization_id_idx" ON "application_history"("organization_id");
CREATE INDEX "cv_screenings_organization_id_idx" ON "cv_screenings"("organization_id");
CREATE INDEX "ai_configs_organization_id_idx" ON "ai_configs"("organization_id");
CREATE INDEX "interview_schedules_organization_id_idx" ON "interview_schedules"("organization_id");

-- ============================================================
-- CandidateSkill — the model the candidate_skill_source enum was written for and has
-- been orphaned without. Carries NO organization_id: candidates are one shared pool
-- across every organization (module spec, Scope). Seeded now so GĐ3's RAG work does
-- not force another schema change later.
-- ============================================================

-- CreateTable
CREATE TABLE "candidate_skills" (
    "candidate_skill_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "source" "candidate_skill_source" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("candidate_skill_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_skills_candidate_id_skill_id_key" ON "candidate_skills"("candidate_id", "skill_id");

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("candidate_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;
