-- AlterEnum
BEGIN;
CREATE TYPE "ai_recommendation_new" AS ENUM ('interview', 'reject');
ALTER TABLE "cv_screenings" ALTER COLUMN "ai_recommendation" TYPE "ai_recommendation_new" USING ("ai_recommendation"::text::"ai_recommendation_new");
ALTER TYPE "ai_recommendation" RENAME TO "ai_recommendation_old";
ALTER TYPE "ai_recommendation_new" RENAME TO "ai_recommendation";
DROP TYPE "public"."ai_recommendation_old";
COMMIT;
