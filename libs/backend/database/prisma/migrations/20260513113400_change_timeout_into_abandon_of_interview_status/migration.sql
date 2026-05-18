-- AlterEnum
-- Step 1: abandon is already in the enum, ensure it exists
ALTER TYPE "interview_status" ADD VALUE IF NOT EXISTS 'abandon';
