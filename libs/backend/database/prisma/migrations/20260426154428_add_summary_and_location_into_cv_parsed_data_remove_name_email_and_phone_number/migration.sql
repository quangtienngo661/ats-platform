/*
  Warnings:

  - You are about to drop the column `email` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `cv_parsed_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cv_parsed_data" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone_number",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "summary" TEXT;
