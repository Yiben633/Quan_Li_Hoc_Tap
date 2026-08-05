-- CreateEnum
CREATE TYPE "schedule_type" AS ENUM ('class', 'self_study', 'exam', 'presentation', 'group_work', 'personal');

-- CreateEnum
CREATE TYPE "recurrence_rule" AS ENUM ('none', 'daily', 'weekly');

-- CreateEnum
CREATE TYPE "goal_type" AS ENUM ('score', 'study_time', 'task_count', 'course_completion', 'gpa');

-- CreateEnum
CREATE TYPE "goal_status" AS ENUM ('in_progress', 'achieved', 'failed', 'archived');

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "type" "schedule_type" NOT NULL,
    "title" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "recurrence_rule" "recurrence_rule" NOT NULL DEFAULT 'none',
    "color_hex" TEXT,
    "reminder_before" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "color_hex" TEXT,
    "reminder_before" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "name" TEXT NOT NULL,
    "type" "goal_type" NOT NULL,
    "target_value" DECIMAL(10,2) NOT NULL,
    "current_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deadline" DATE,
    "status" "goal_status" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_user_id_start_date_idx" ON "schedules"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "schedules_user_id_deleted_at_idx" ON "schedules"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "schedules_subject_id_idx" ON "schedules"("subject_id");

-- CreateIndex
CREATE INDEX "events_user_id_start_at_idx" ON "events"("user_id", "start_at");

-- CreateIndex
CREATE INDEX "events_user_id_deleted_at_idx" ON "events"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_subject_id_status_idx" ON "goals"("subject_id", "status");

-- CreateIndex
CREATE INDEX "goals_user_id_deadline_idx" ON "goals"("user_id", "deadline");

-- AddCheckConstraint
ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_day_of_week_check"
    CHECK ("day_of_week" IS NULL OR ("day_of_week" >= 0 AND "day_of_week" <= 6));

-- AddCheckConstraint
ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_reminder_before_check"
    CHECK ("reminder_before" IS NULL OR "reminder_before" >= 0);

-- AddCheckConstraint
ALTER TABLE "schedules"
    ADD CONSTRAINT "schedules_date_range_check"
    CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

-- AddCheckConstraint
ALTER TABLE "events"
    ADD CONSTRAINT "events_reminder_before_check"
    CHECK ("reminder_before" IS NULL OR "reminder_before" >= 0);

-- AddCheckConstraint
ALTER TABLE "events"
    ADD CONSTRAINT "events_time_range_check"
    CHECK ("end_at" IS NULL OR "end_at" >= "start_at");

-- AddCheckConstraint
ALTER TABLE "goals"
    ADD CONSTRAINT "goals_target_value_check"
    CHECK ("target_value" >= 0);

-- AddCheckConstraint
ALTER TABLE "goals"
    ADD CONSTRAINT "goals_current_value_check"
    CHECK ("current_value" >= 0);

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
