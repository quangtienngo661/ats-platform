/*
  Warnings:

  - You are about to drop the column `device_info` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `refresh_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "device_info",
DROP COLUMN "ip_address";
