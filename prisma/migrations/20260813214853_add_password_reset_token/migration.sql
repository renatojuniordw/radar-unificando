-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "reset_token_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_hash_key" ON "users"("reset_token_hash");