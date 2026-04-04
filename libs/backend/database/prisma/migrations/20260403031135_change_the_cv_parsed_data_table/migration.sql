-- AlterTable
ALTER TABLE "cv_parsed_data" ADD COLUMN     "certificates" JSONB,
ADD COLUMN     "links" JSONB,
ADD COLUMN     "projects" JSONB,
ADD COLUMN     "summary" TEXT;
