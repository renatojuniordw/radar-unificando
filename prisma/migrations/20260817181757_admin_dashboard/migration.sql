-- DropForeignKey
ALTER TABLE "pipeline_runs" DROP CONSTRAINT "pipeline_runs_user_id_fkey";

-- AlterTable
ALTER TABLE "pipeline_runs" ADD COLUMN     "companies" JSONB,
ADD COLUMN     "queries" JSONB,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "role" VARCHAR(20) NOT NULL DEFAULT 'user';

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
CREATE TABLE "chat_tool_calls" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "chat_id" UUID,
    "tool_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extension_tokens_token_hash_idx" ON "extension_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "extension_feedback_user_id_idx" ON "extension_feedback"("user_id");

-- CreateIndex
CREATE INDEX "chat_tool_calls_tool_name_created_at_idx" ON "chat_tool_calls"("tool_name", "created_at");

-- CreateIndex
CREATE INDEX "chat_tool_calls_created_at_idx" ON "chat_tool_calls"("created_at");

-- AddForeignKey
ALTER TABLE "extension_tokens" ADD CONSTRAINT "extension_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_feedback" ADD CONSTRAINT "extension_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
