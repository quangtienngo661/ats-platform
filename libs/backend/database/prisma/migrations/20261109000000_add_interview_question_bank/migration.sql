-- CreateEnum
CREATE TYPE "question_source" AS ENUM ('bank', 'generated');

-- AlterTable
ALTER TABLE "interview_qnas" ADD COLUMN     "bank_question_id" TEXT,
ADD COLUMN     "source" "question_source" NOT NULL DEFAULT 'generated';

-- CreateTable
CREATE TABLE "interview_questions" (
    "question_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "difficulty" "difficulty_level" NOT NULL,
    "question_text" TEXT NOT NULL,
    "expected_points" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateIndex
CREATE INDEX "interview_questions_topic_id_difficulty_is_active_idx" ON "interview_questions"("topic_id", "difficulty", "is_active");

-- AddForeignKey
ALTER TABLE "interview_qnas" ADD CONSTRAINT "interview_qnas_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "interview_questions"("question_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "interview_topics"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
