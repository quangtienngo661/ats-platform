-- Address of an onsite interview. Nullable, additive only: existing rows keep NULL.
ALTER TABLE "interview_schedules" ADD COLUMN "location" VARCHAR(255);
