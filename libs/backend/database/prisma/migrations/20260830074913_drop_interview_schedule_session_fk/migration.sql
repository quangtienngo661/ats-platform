/*
  Warnings:

  - You are about to drop the column `session_id` on the `interview_schedules` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "interview_schedules" DROP CONSTRAINT "interview_schedules_session_id_fkey";

-- AlterTable
ALTER TABLE "interview_schedules" DROP COLUMN "session_id";
