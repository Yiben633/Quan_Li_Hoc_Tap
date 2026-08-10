-- CreateEnum
CREATE TYPE "ai_conversation_status" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "ai_message_role" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "ai_plan_draft_status" AS ENUM ('draft', 'applied', 'discarded', 'expired');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "status" "ai_conversation_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "ai_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_plan_drafts" (
    "id" UUID NOT NULL,
    "conversation_id" UUID,
    "user_id" UUID NOT NULL,
    "draft_type" TEXT NOT NULL,
    "status" "ai_plan_draft_status" NOT NULL DEFAULT 'draft',
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "ai_plan_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_updated_at_idx" ON "ai_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_plan_drafts_user_id_status_idx" ON "ai_plan_drafts"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_plan_drafts_conversation_id_idx" ON "ai_plan_drafts"("conversation_id");

-- Ai plan drafts contain validated, user-visible action payloads only. Never store
-- API keys, raw provider errors, or hidden reasoning in their JSON metadata.
COMMENT ON TABLE "ai_plan_drafts" IS
'Inert AI action drafts. Database changes happen only after explicit user apply and backend transaction validation.';

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_plan_drafts" ADD CONSTRAINT "ai_plan_drafts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_plan_drafts" ADD CONSTRAINT "ai_plan_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
