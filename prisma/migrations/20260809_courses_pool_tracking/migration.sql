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

-- AddForeignKey
ALTER TABLE "course_clicks" ADD CONSTRAINT "course_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

