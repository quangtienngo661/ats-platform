/*
  Warnings:

  - You are about to drop the column `email` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `links` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `cv_parsed_data` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `cv_parsed_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cv_parsed_data" DROP COLUMN "email",
DROP COLUMN "full_name",
DROP COLUMN "links",
DROP COLUMN "phone_number",
DROP COLUMN "summary";
