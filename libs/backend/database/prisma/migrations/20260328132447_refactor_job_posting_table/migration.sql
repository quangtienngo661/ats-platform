/*
  Warnings:

  - The `parsed_requirements` column on the `job_postings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "job_postings" DROP COLUMN "parsed_requirements",
ADD COLUMN     "parsed_requirements" JSONB;
