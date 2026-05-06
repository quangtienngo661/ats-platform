/*
  Warnings:

  - The values [success] on the enum `parsing_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [success] on the enum `screening_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "parsing_status_new" AS ENUM ('pending', 'processing', 'completed', 'failed');
ALTER TABLE "public"."cvs" ALTER COLUMN "parsing_status" DROP DEFAULT;
ALTER TABLE "cvs" ALTER COLUMN "parsing_status" TYPE "parsing_status_new" USING ("parsing_status"::text::"parsing_status_new");
ALTER TYPE "parsing_status" RENAME TO "parsing_status_old";
ALTER TYPE "parsing_status_new" RENAME TO "parsing_status";
DROP TYPE "public"."parsing_status_old";
ALTER TABLE "cvs" ALTER COLUMN "parsing_status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "screening_status_new" AS ENUM ('pending', 'processing', 'completed', 'failed');
ALTER TABLE "public"."cv_screenings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cv_screenings" ALTER COLUMN "status" TYPE "screening_status_new" USING ("status"::text::"screening_status_new");
ALTER TYPE "screening_status" RENAME TO "screening_status_old";
ALTER TYPE "screening_status_new" RENAME TO "screening_status";
DROP TYPE "public"."screening_status_old";
ALTER TABLE "cv_screenings" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
