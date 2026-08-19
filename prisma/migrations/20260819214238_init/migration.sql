-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reset_token_hash" VARCHAR(64),
    "reset_token_expires_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "extension_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" BOOLEAN NOT NULL,
    "comment" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_clicks" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "course_id" VARCHAR(100) NOT NULL,
    "skill" VARCHAR(100),
    "platform" VARCHAR(10),
    "origin" VARCHAR(20) NOT NULL DEFAULT 'web',
    "url" VARCHAR,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_jobs" (
    "id" UUID NOT NULL,
    "link" VARCHAR NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'gupy_api',
    "company" VARCHAR NOT NULL,
    "platform" VARCHAR NOT NULL,
    "role_category" VARCHAR,
    "title" VARCHAR,
    "type" VARCHAR,
    "location" VARCHAR,
    "posted_at" VARCHAR,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "detected_at" VARCHAR,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "experience_years" INTEGER,
    "seniority" VARCHAR(50),
    "current_role" VARCHAR(255),
    "area" VARCHAR(100),
    "education" JSONB DEFAULT '[]',
    "resume_text" TEXT,
    "resume_markdown" TEXT,
    "parsed_data" JSONB,
    "profile_source" VARCHAR(20) DEFAULT 'manual',
    "resume_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'gupy_api',
    "company" VARCHAR NOT NULL,
    "platform" VARCHAR NOT NULL,
    "on_list" VARCHAR(3) DEFAULT 'Não',
    "role_category" VARCHAR,
    "title" VARCHAR,
    "type" VARCHAR,
    "location" VARCHAR,
    "link" VARCHAR NOT NULL,
    "company_name_on_platform" VARCHAR,
    "posted_at" VARCHAR,
    "description" TEXT,
    "skills_required" JSONB,
    "score" REAL,
    "alert" VARCHAR DEFAULT '',
    "detected_at" VARCHAR,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "external_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_tool_calls" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "chat_id" UUID,
    "tool_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_usage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "chat_id" UUID,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_content_cache" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID,
    "kind" VARCHAR(30) NOT NULL,
    "cache_key" VARCHAR(64) NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_content_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "stage" VARCHAR NOT NULL DEFAULT 'discovered',
    "score" REAL,
    "breakdown" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_logs" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "from_stage" VARCHAR,
    "to_stage" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_companies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "total_jobs" INTEGER DEFAULT 0,
    "careers_url" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "new_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "total_jobs" INTEGER DEFAULT 0,
    "gupy_jobs" INTEGER DEFAULT 0,
    "inhire_jobs" INTEGER DEFAULT 0,
    "new_companies_found" INTEGER DEFAULT 0,
    "discovery_enabled" BOOLEAN DEFAULT true,
    "started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_presence" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company" VARCHAR NOT NULL,
    "has_gupy" VARCHAR(3) DEFAULT '',
    "gupy_page" VARCHAR,
    "has_inhire" VARCHAR(3) DEFAULT '',
    "inhire_page" VARCHAR,
    "total_inhire_jobs" INTEGER DEFAULT 0,

    CONSTRAINT "company_presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_hash_key" ON "users"("reset_token_hash");

-- CreateIndex
CREATE INDEX "extension_tokens_token_hash_idx" ON "extension_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "extension_feedback_user_id_idx" ON "extension_feedback"("user_id");

-- CreateIndex
CREATE INDEX "course_clicks_created_at_idx" ON "course_clicks"("created_at");

-- CreateIndex
CREATE INDEX "course_clicks_course_id_created_at_idx" ON "course_clicks"("course_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "public_jobs_link_key" ON "public_jobs"("link");

-- CreateIndex
CREATE INDEX "public_jobs_status_expires_at_idx" ON "public_jobs"("status", "expires_at");

-- CreateIndex
CREATE INDEX "public_jobs_role_category_status_idx" ON "public_jobs"("role_category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_resume_hash_idx" ON "profiles"("resume_hash");

-- CreateIndex
CREATE INDEX "jobs_status_last_checked_at_idx" ON "jobs"("status", "last_checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_user_id_link_key" ON "jobs"("user_id", "link");

-- CreateIndex
CREATE INDEX "chats_user_id_updated_at_idx" ON "chats"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "chats_user_id_external_id_key" ON "chats"("user_id", "external_id");

-- CreateIndex
CREATE INDEX "chat_tool_calls_tool_name_created_at_idx" ON "chat_tool_calls"("tool_name", "created_at");

-- CreateIndex
CREATE INDEX "chat_tool_calls_created_at_idx" ON "chat_tool_calls"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_chat_id_position_key" ON "chat_messages"("chat_id", "position");

-- CreateIndex
CREATE INDEX "chat_usage_user_id_created_at_idx" ON "chat_usage"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_usage_ip_hash_created_at_idx" ON "chat_usage"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "generated_content_cache_expires_at_idx" ON "generated_content_cache"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "generated_content_cache_user_id_kind_cache_key_key" ON "generated_content_cache"("user_id", "kind", "cache_key");

-- AddForeignKey
ALTER TABLE "extension_tokens" ADD CONSTRAINT "extension_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_feedback" ADD CONSTRAINT "extension_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_clicks" ADD CONSTRAINT "course_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_usage" ADD CONSTRAINT "chat_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_usage" ADD CONSTRAINT "chat_usage_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content_cache" ADD CONSTRAINT "generated_content_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content_cache" ADD CONSTRAINT "generated_content_cache_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_companies" ADD CONSTRAINT "new_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_presence" ADD CONSTRAINT "company_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
