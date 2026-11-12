-- AlterTable
ALTER TABLE "ai_usage_logs" ADD COLUMN     "organization_id" TEXT;

-- CreateTable
CREATE TABLE "ai_model_prices" (
    "model_name" VARCHAR(100) NOT NULL,
    "input_usd_per_million" DECIMAL(12,4) NOT NULL,
    "output_usd_per_million" DECIMAL(12,4) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "ai_model_prices_pkey" PRIMARY KEY ("model_name")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_organization_id_created_at_idx" ON "ai_usage_logs"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_prices" ADD CONSTRAINT "ai_model_prices_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill (GĐ4 R20): a screening's calls carry its screeningId as reference, so their
-- organization is the screening's. Other rows stay null: nothing ties them to one.
UPDATE "ai_usage_logs" AS l
SET "organization_id" = s."organization_id"
FROM "cv_screenings" AS s
WHERE l."organization_id" IS NULL
  AND l."reference_id" = s."screening_id"
  AND l."action_type" IN ('cv_scoring', 'embedding');
