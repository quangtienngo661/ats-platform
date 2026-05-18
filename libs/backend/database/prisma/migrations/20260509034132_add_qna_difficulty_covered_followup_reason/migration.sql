/*
  Warnings:

  - Added the required column `difficulty` to the `interview_qnas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "interview_qnas" ADD COLUMN     "covered_points" JSONB,
ADD COLUMN     "difficulty" "difficulty_level" NOT NULL,
ADD COLUMN     "followup_reason" TEXT;
