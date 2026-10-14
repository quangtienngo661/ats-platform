-- CreateEnum
CREATE TYPE "email_notification_type" AS ENUM ('application_received', 'application_interview', 'application_offer', 'application_hired', 'application_rejected', 'schedule_created', 'schedule_updated', 'schedule_cancelled');

-- CreateEnum
CREATE TYPE "email_notification_status" AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "email_notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "interview_id" TEXT,
    "type" "email_notification_type" NOT NULL,
    "status" "email_notification_status" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "last_error" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_notifications_organization_id_idx" ON "email_notifications"("organization_id");

-- CreateIndex
CREATE INDEX "email_notifications_application_id_idx" ON "email_notifications"("application_id");

-- AddForeignKey
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;
