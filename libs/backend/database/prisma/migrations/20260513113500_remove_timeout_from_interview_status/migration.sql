-- AlterEnum
-- Remove 'timeout' from interview_status enum by recreating the type
-- Step 1: Migrate any existing 'timeout' rows to 'abandon'
UPDATE "interview_sessions"
SET "status" = 'abandon'::"interview_status"
WHERE "status" = 'timeout'::"interview_status";

-- Step 2: Create new enum without 'timeout'
CREATE TYPE "interview_status_new" AS ENUM ('in_progress', 'completed', 'abandon');

-- Step 3: Drop column default (references old enum)
ALTER TABLE "interview_sessions" ALTER COLUMN "status" DROP DEFAULT;

-- Step 4: Swap column type
ALTER TABLE "interview_sessions"
  ALTER COLUMN "status" TYPE "interview_status_new"
  USING "status"::text::"interview_status_new";

-- Step 5: Restore default
ALTER TABLE "interview_sessions"
  ALTER COLUMN "status" SET DEFAULT 'in_progress'::"interview_status_new";

-- Step 6: Drop old enum
DROP TYPE "interview_status";

-- Step 7: Rename new enum
ALTER TYPE "interview_status_new" RENAME TO "interview_status";

-- Step 8: Restore default with final name (needed for some PG versions)
ALTER TABLE "interview_sessions"
  ALTER COLUMN "status" SET DEFAULT 'in_progress'::"interview_status";
