-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "resume_hash" VARCHAR(64);

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

-- CreateIndex
CREATE INDEX "chat_usage_user_id_created_at_idx" ON "chat_usage"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_usage_ip_hash_created_at_idx" ON "chat_usage"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "profiles_resume_hash_idx" ON "profiles"("resume_hash");

-- AddForeignKey
ALTER TABLE "chat_usage" ADD CONSTRAINT "chat_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_usage" ADD CONSTRAINT "chat_usage_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

