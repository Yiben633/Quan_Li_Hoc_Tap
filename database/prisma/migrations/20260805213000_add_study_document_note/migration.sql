-- CreateEnum
CREATE TYPE "pomodoro_session_type" AS ENUM ('focus', 'short_break', 'long_break');

-- CreateEnum
CREATE TYPE "document_file_type" AS ENUM ('pdf', 'word', 'excel', 'ppt', 'image', 'link', 'video', 'code', 'other');

-- CreateEnum
CREATE TYPE "storage_provider" AS ENUM ('local', 's3', 'cloudinary', 'minio');

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_sessions" (
    "id" UUID NOT NULL,
    "study_session_id" UUID NOT NULL,
    "session_type" "pomodoro_session_type" NOT NULL,
    "planned_minutes" INTEGER NOT NULL,
    "actual_minutes" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "task_id" UUID,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" "document_file_type" NOT NULL,
    "storage_provider" "storage_provider" NOT NULL,
    "size_bytes" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID,
    "task_id" UUID,
    "title" TEXT NOT NULL,
    "content_rich_text" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_sessions_user_id_started_at_idx" ON "study_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "study_sessions_subject_id_started_at_idx" ON "study_sessions"("subject_id", "started_at");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_study_session_id_started_at_idx" ON "pomodoro_sessions"("study_session_id", "started_at");

-- CreateIndex
CREATE INDEX "documents_user_id_subject_id_idx" ON "documents"("user_id", "subject_id");

-- CreateIndex
CREATE INDEX "documents_user_id_task_id_idx" ON "documents"("user_id", "task_id");

-- CreateIndex
CREATE INDEX "documents_user_id_deleted_at_idx" ON "documents"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notes_user_id_is_pinned_idx" ON "notes"("user_id", "is_pinned");

-- CreateIndex
CREATE INDEX "notes_user_id_subject_id_idx" ON "notes"("user_id", "subject_id");

-- CreateIndex
CREATE INDEX "notes_user_id_task_id_idx" ON "notes"("user_id", "task_id");

-- CreateIndex
CREATE INDEX "notes_user_id_deleted_at_idx" ON "notes"("user_id", "deleted_at");

-- AddCheckConstraint
ALTER TABLE "study_sessions"
    ADD CONSTRAINT "study_sessions_total_minutes_check"
    CHECK ("total_minutes" >= 0);

-- AddCheckConstraint
ALTER TABLE "study_sessions"
    ADD CONSTRAINT "study_sessions_time_range_check"
    CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

-- AddCheckConstraint
ALTER TABLE "pomodoro_sessions"
    ADD CONSTRAINT "pomodoro_sessions_planned_minutes_check"
    CHECK ("planned_minutes" > 0);

-- AddCheckConstraint
ALTER TABLE "pomodoro_sessions"
    ADD CONSTRAINT "pomodoro_sessions_actual_minutes_check"
    CHECK ("actual_minutes" IS NULL OR "actual_minutes" >= 0);

-- AddCheckConstraint
ALTER TABLE "pomodoro_sessions"
    ADD CONSTRAINT "pomodoro_sessions_time_range_check"
    CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

-- AddCheckConstraint
ALTER TABLE "documents"
    ADD CONSTRAINT "documents_size_bytes_check"
    CHECK ("size_bytes" IS NULL OR "size_bytes" >= 0);

COMMENT ON TABLE "documents" IS
'Stores document metadata only. File size limits, MIME validation and storage security are enforced in backend services.';

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_study_session_id_fkey" FOREIGN KEY ("study_session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
