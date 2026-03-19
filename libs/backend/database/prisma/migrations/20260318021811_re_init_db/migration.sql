-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('candidate', 'hr', 'admin');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "location_type" AS ENUM ('remote', 'onsite', 'hybrid');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "parsing_status" AS ENUM ('pending', 'processing', 'success', 'failed');

-- CreateEnum
CREATE TYPE "screening_status" AS ENUM ('pending', 'processing', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ai_recommendation" AS ENUM ('hire', 'interview', 'reject');

-- CreateEnum
CREATE TYPE "ai_action_type" AS ENUM ('cv_parsing', 'cv_scoring', 'mock_interview');

-- CreateEnum
CREATE TYPE "ai_log_status" AS ENUM ('success', 'failed');

-- CreateEnum
CREATE TYPE "interview_status" AS ENUM ('in_progress', 'completed', 'timeout');

-- CreateEnum
CREATE TYPE "interview_type" AS ENUM ('online', 'onsite');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "candidate_skill_source" AS ENUM ('cv_parsed', 'manual');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('application', 'interview', 'system');

-- CreateEnum
CREATE TYPE "related_entity_type" AS ENUM ('application', 'interview', 'job');

-- CreateEnum
CREATE TYPE "difficulty_level" AS ENUM ('easy', 'medium', 'hard');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "candidate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_title" TEXT,
    "years_of_experience" INTEGER,
    "profile_data" JSONB,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("candidate_id")
);

-- CreateTable
CREATE TABLE "hr_recruiters" (
    "hr_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "position" TEXT,

    CONSTRAINT "hr_recruiters_pkey" PRIMARY KEY ("hr_id")
);

-- CreateTable
CREATE TABLE "job_categories" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_category_id" TEXT,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "skills" (
    "skill_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "synonyms" JSONB,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "job_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "category_id" TEXT,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location_type" "location_type" NOT NULL,
    "salary_min" DECIMAL(65,30),
    "salary_max" DECIMAL(65,30),
    "description" TEXT,
    "parsed_requirements" TEXT,
    "status" "job_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "job_posting_skills" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "job_posting_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cvs" (
    "cv_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "raw_text" TEXT,
    "error_log" TEXT,
    "parsing_status" "parsing_status" NOT NULL DEFAULT 'pending',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cvs_pkey" PRIMARY KEY ("cv_id")
);

-- CreateTable
CREATE TABLE "cv_parsed_data" (
    "id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "experience" JSONB,
    "education" JSONB,
    "skills" JSONB,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cv_parsed_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "application_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'applied',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_stage_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "application_history" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "from_status" "application_status",
    "to_status" "application_status" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_screenings" (
    "screening_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "status" "screening_status" NOT NULL DEFAULT 'pending',
    "overall_score" DECIMAL(65,30),
    "ai_recommendation" "ai_recommendation",
    "ai_reasoning" TEXT,
    "matched_skills" JSONB,
    "missing_skills" JSONB,
    "error_log" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "screened_at" TIMESTAMP(3),

    CONSTRAINT "cv_screenings_pkey" PRIMARY KEY ("screening_id")
);

-- CreateTable
CREATE TABLE "ai_configs" (
    "config_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "skills_weight" DECIMAL(65,30) NOT NULL,
    "experience_weight" DECIMAL(65,30) NOT NULL,
    "education_weight" DECIMAL(65,30) NOT NULL,
    "minimum_score_threshold" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "log_id" TEXT NOT NULL,
    "action_type" "ai_action_type" NOT NULL,
    "reference_id" TEXT,
    "model_name" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "status" "ai_log_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "interview_topics" (
    "topic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "difficulty_levels" JSONB,

    CONSTRAINT "interview_topics_pkey" PRIMARY KEY ("topic_id")
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "session_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "difficulty_level" "difficulty_level" NOT NULL,
    "status" "interview_status" NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "interview_qnas" (
    "qna_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "expected_points" JSONB,
    "answer_text" TEXT,
    "correctness_score" DECIMAL(65,30),
    "feedback" TEXT,
    "missed_points" JSONB,
    "has_followup" BOOLEAN NOT NULL DEFAULT false,
    "followup_question" TEXT,
    "followup_answer" TEXT,

    CONSTRAINT "interview_qnas_pkey" PRIMARY KEY ("qna_id")
);

-- CreateTable
CREATE TABLE "interview_results" (
    "result_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "overall_score" DECIMAL(65,30) NOT NULL,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "action_plan" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_results_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "interview_schedules" (
    "interview_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "session_id" TEXT,
    "scheduled_by" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "interview_type" "interview_type" NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "online_meeting_link" TEXT,
    "status" "schedule_status" NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "interview_schedules_pkey" PRIMARY KEY ("interview_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_entity_id" TEXT,
    "related_entity_type" "related_entity_type",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_user_id_key" ON "candidates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_recruiters_user_id_key" ON "hr_recruiters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_posting_skills_job_id_skill_id_key" ON "job_posting_skills"("job_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "cv_parsed_data_cv_id_key" ON "cv_parsed_data"("cv_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_id_candidate_id_key" ON "applications"("job_id", "candidate_id");

-- CreateIndex
CREATE INDEX "application_history_application_id_idx" ON "application_history"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "cv_screenings_application_id_key" ON "cv_screenings"("application_id");

-- CreateIndex
CREATE INDEX "ai_usage_logs_action_type_created_at_idx" ON "ai_usage_logs"("action_type", "created_at");

-- CreateIndex
CREATE INDEX "interview_qnas_session_id_order_index_idx" ON "interview_qnas"("session_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "interview_results_session_id_key" ON "interview_results"("session_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recruiters" ADD CONSTRAINT "hr_recruiters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recruiters" ADD CONSTRAINT "hr_recruiters_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "job_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "job_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "hr_recruiters"("hr_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_skills" ADD CONSTRAINT "job_posting_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_skills" ADD CONSTRAINT "job_posting_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("skill_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("candidate_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_parsed_data" ADD CONSTRAINT "cv_parsed_data_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("cv_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("candidate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("cv_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("cv_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "ai_configs"("config_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("candidate_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "interview_topics"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_qnas" ADD CONSTRAINT "interview_qnas_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
