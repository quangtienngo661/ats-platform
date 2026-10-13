-- CreateEnum
CREATE TYPE "scorecard_recommendation" AS ENUM ('strong_no', 'no', 'yes', 'strong_yes');

-- CreateTable
CREATE TABLE "interview_scorecards" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "interview_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "technical_skills" INTEGER NOT NULL,
    "problem_solving" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "culture_fit" INTEGER NOT NULL,
    "recommendation" "scorecard_recommendation" NOT NULL,
    "comment" VARCHAR(2000),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interview_scorecards_interview_id_key" ON "interview_scorecards"("interview_id");
CREATE INDEX "interview_scorecards_organization_id_idx" ON "interview_scorecards"("organization_id");
CREATE INDEX "application_notes_application_id_idx" ON "application_notes"("application_id");
CREATE INDEX "application_notes_organization_id_idx" ON "application_notes"("organization_id");

-- AddForeignKey
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interview_schedules"("interview_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Every score is an integer from 1 through 5, enforced in the database as well as
-- application validation so writes outside the API cannot bypass the bounds.
-- Prisma's schema language cannot express CHECK constraints, so they live here.
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_technical_skills_check"
    CHECK ("technical_skills" BETWEEN 1 AND 5);
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_problem_solving_check"
    CHECK ("problem_solving" BETWEEN 1 AND 5);
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_communication_check"
    CHECK ("communication" BETWEEN 1 AND 5);
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_culture_fit_check"
    CHECK ("culture_fit" BETWEEN 1 AND 5);
