-- CreateEnum
CREATE TYPE "copilot_decision_type" AS ENUM ('accepted', 'dismissed');

-- AlterEnum
ALTER TYPE "ai_action_type" ADD VALUE 'copilot';

-- CreateTable
CREATE TABLE "copilot_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "rule_id" VARCHAR(64) NOT NULL,
    "suggestion_key" VARCHAR(200) NOT NULL,
    "decision" "copilot_decision_type" NOT NULL,
    "decided_by_id" TEXT NOT NULL,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copilot_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_decisions_organization_id_idx" ON "copilot_decisions"("organization_id");

-- CreateIndex
CREATE INDEX "copilot_decisions_application_id_suggestion_key_idx" ON "copilot_decisions"("application_id", "suggestion_key");

-- AddForeignKey
ALTER TABLE "copilot_decisions" ADD CONSTRAINT "copilot_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_decisions" ADD CONSTRAINT "copilot_decisions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_decisions" ADD CONSTRAINT "copilot_decisions_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
