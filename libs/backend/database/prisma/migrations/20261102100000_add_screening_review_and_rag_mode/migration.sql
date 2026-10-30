-- CreateEnum
CREATE TYPE "rag_mode" AS ENUM ('none', 'skills', 'skills_anchors');

-- AlterTable
ALTER TABLE "cv_screenings" ADD COLUMN     "anchor_screening_ids" JSONB,
ADD COLUMN     "rag_mode" "rag_mode",
ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" TEXT,
ADD COLUMN     "reviewed_education_score" DECIMAL(5,1),
ADD COLUMN     "reviewed_experience_score" DECIMAL(5,1),
ADD COLUMN     "reviewed_overall_score" DECIMAL(5,1),
ADD COLUMN     "reviewed_skills_score" DECIMAL(5,1);

-- AddForeignKey
ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
