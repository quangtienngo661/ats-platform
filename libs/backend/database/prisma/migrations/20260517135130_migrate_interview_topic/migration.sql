/*
  Warnings:

  - You are about to drop the column `category` on the `interview_topics` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty_levels` on the `interview_topics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "interview_topics" DROP COLUMN "category",
DROP COLUMN "difficulty_levels",
ADD COLUMN     "category_id" TEXT;

-- AddForeignKey
ALTER TABLE "interview_topics" ADD CONSTRAINT "interview_topics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "job_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
