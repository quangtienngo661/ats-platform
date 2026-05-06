/*
  Warnings:

  - You are about to alter the column `overall_score` on the `cv_screenings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,1)`.

*/
-- AlterTable
ALTER TABLE "cv_screenings" ALTER COLUMN "overall_score" SET DATA TYPE DECIMAL(5,1);
