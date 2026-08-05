-- CreateEnum
CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "study_plan_status" AS ENUM ('not_started', 'in_progress', 'paused', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('todo', 'in_progress', 'waiting', 'done');

-- CreateTable
CREATE TABLE "study_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "target_goal" TEXT,
    "estimated_hours" DECIMAL(6,2),
    "priority" "priority" NOT NULL DEFAULT 'medium',
    "status" "study_plan_status" NOT NULL DEFAULT 'not_started',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "study_plan_id" UUID,
    "subject_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "due_date" TIMESTAMP(3),
    "estimated_minutes" INTEGER,
    "difficulty" INTEGER,
    "priority" "priority" NOT NULL DEFAULT 'medium',
    "status" "task_status" NOT NULL DEFAULT 'todo',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_tasks" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plans_user_id_status_idx" ON "study_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "study_plans_subject_id_status_idx" ON "study_plans"("subject_id", "status");

-- CreateIndex
CREATE INDEX "study_plans_user_id_priority_idx" ON "study_plans"("user_id", "priority");

-- CreateIndex
CREATE INDEX "study_plans_user_id_deleted_at_idx" ON "study_plans"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tasks_user_id_status_idx" ON "tasks"("user_id", "status");

-- CreateIndex
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "tasks_study_plan_id_status_idx" ON "tasks"("study_plan_id", "status");

-- CreateIndex
CREATE INDEX "tasks_subject_id_status_idx" ON "tasks"("subject_id", "status");

-- CreateIndex
CREATE INDEX "tasks_user_id_priority_due_date_idx" ON "tasks"("user_id", "priority", "due_date");

-- CreateIndex
CREATE INDEX "tasks_user_id_deleted_at_idx" ON "tasks"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "sub_tasks_task_id_sort_order_idx" ON "sub_tasks"("task_id", "sort_order");

-- CreateIndex
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- AddCheckConstraint
ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_difficulty_check"
    CHECK ("difficulty" IS NULL OR ("difficulty" >= 1 AND "difficulty" <= 5));

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_tasks" ADD CONSTRAINT "sub_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
