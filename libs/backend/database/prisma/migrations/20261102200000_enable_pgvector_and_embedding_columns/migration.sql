-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "cv_parsed_data" ADD COLUMN     "embedding" vector(1536);
