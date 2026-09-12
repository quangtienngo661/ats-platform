-- Change interview_schedules time model:
--   scheduled_date + scheduled_time  ->  start_at + duration_minutes
--
-- Data-preserving (expand/backfill/contract): scheduled_time already holds the real
-- date+time (the web layer builds it via toLocalDateTimeIso), so start_at is backfilled
-- from scheduled_time. duration_minutes has no prior source, so it defaults to 60.
-- Prisma cannot auto-generate this (adding a NOT NULL column to a populated table needs
-- a backfill step), so the migration is authored explicitly.

-- 1. Add the new columns. start_at is nullable first so existing rows can be backfilled.
ALTER TABLE "interview_schedules" ADD COLUMN "start_at" TIMESTAMP(3);
ALTER TABLE "interview_schedules" ADD COLUMN "duration_minutes" INTEGER NOT NULL DEFAULT 60;

-- 2. Backfill start_at from the existing full-datetime column, then enforce NOT NULL.
UPDATE "interview_schedules" SET "start_at" = "scheduled_time" WHERE "start_at" IS NULL;
ALTER TABLE "interview_schedules" ALTER COLUMN "start_at" SET NOT NULL;

-- 3. Drop the old split columns.
ALTER TABLE "interview_schedules" DROP COLUMN "scheduled_date";
ALTER TABLE "interview_schedules" DROP COLUMN "scheduled_time";
