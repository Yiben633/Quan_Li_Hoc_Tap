-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('deadline_soon', 'task_overdue', 'class_soon', 'exam_soon', 'plan_incomplete', 'goal_at_risk', 'goal_achieved', 'system');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('in_app', 'email', 'push');

-- CreateEnum
CREATE TYPE "group_member_role" AS ENUM ('leader', 'member');

-- CreateEnum
CREATE TYPE "group_member_status" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "feedback_type" AS ENUM ('bug', 'feature_request', 'question');

-- CreateEnum
CREATE TYPE "feedback_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "channel" "notification_channel" NOT NULL DEFAULT 'in_app',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reminder_minutes_before" INTEGER NOT NULL DEFAULT 60,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_sets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" UUID NOT NULL,
    "flashcard_set_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "is_difficult" BOOLEAN NOT NULL DEFAULT false,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_groups" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL,
    "study_group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "group_member_role" NOT NULL DEFAULT 'member',
    "status" "group_member_status" NOT NULL DEFAULT 'pending',
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_tasks" (
    "id" UUID NOT NULL,
    "study_group_id" UUID NOT NULL,
    "assigned_user_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "task_status" NOT NULL DEFAULT 'todo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "feedback_type" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "feedback_status" NOT NULL DEFAULT 'open',
    "admin_reply" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "flashcard_sets_user_id_idx" ON "flashcard_sets"("user_id");

-- CreateIndex
CREATE INDEX "flashcard_sets_subject_id_idx" ON "flashcard_sets"("subject_id");

-- CreateIndex
CREATE INDEX "flashcards_flashcard_set_id_idx" ON "flashcards"("flashcard_set_id");

-- CreateIndex
CREATE INDEX "flashcards_next_review_at_idx" ON "flashcards"("next_review_at");

-- CreateIndex
CREATE INDEX "study_groups_owner_id_idx" ON "study_groups"("owner_id");

-- CreateIndex
CREATE INDEX "group_members_user_id_status_idx" ON "group_members"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_study_group_id_user_id_key" ON "group_members"("study_group_id", "user_id");

-- CreateIndex
CREATE INDEX "group_tasks_study_group_id_status_idx" ON "group_tasks"("study_group_id", "status");

-- CreateIndex
CREATE INDEX "group_tasks_assigned_user_id_status_idx" ON "group_tasks"("assigned_user_id", "status");

-- CreateIndex
CREATE INDEX "group_tasks_due_date_idx" ON "group_tasks"("due_date");

-- CreateIndex
CREATE INDEX "feedbacks_user_id_status_idx" ON "feedbacks"("user_id", "status");

-- CreateIndex
CREATE INDEX "feedbacks_status_created_at_idx" ON "feedbacks"("status", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_created_at_idx" ON "activity_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- AddCheckConstraint
ALTER TABLE "notification_settings"
    ADD CONSTRAINT "notification_settings_reminder_minutes_before_check"
    CHECK ("reminder_minutes_before" >= 0);

-- AddCheckConstraint
ALTER TABLE "flashcards"
    ADD CONSTRAINT "flashcards_correct_count_check"
    CHECK ("correct_count" >= 0);

-- AddCheckConstraint
ALTER TABLE "flashcards"
    ADD CONSTRAINT "flashcards_wrong_count_check"
    CHECK ("wrong_count" >= 0);

COMMENT ON TABLE "notifications" IS
'Notifications may use related_entity_type and related_entity_id as a soft polymorphic reference. Backend validates the target entity.';

COMMENT ON TABLE "activity_logs" IS
'Activity logs may be system-generated when user_id is NULL.';

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_sets" ADD CONSTRAINT "flashcard_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_sets" ADD CONSTRAINT "flashcard_sets_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_flashcard_set_id_fkey" FOREIGN KEY ("flashcard_set_id") REFERENCES "flashcard_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_study_group_id_fkey" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tasks" ADD CONSTRAINT "group_tasks_study_group_id_fkey" FOREIGN KEY ("study_group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tasks" ADD CONSTRAINT "group_tasks_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
