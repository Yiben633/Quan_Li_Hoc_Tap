-- CreateEnum
CREATE TYPE "semester_status" AS ENUM ('planning', 'active', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "subject_status" AS ENUM ('in_progress', 'completed', 'dropped', 'archived');

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "semesters" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "semester_status" NOT NULL DEFAULT 'planning',
    "target_gpa" DECIMAL(4,2),
    "expected_credits" INTEGER,
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "semester_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "lecturer" TEXT,
    "room" TEXT,
    "color_hex" TEXT NOT NULL,
    "target_grade" DECIMAL(4,2),
    "status" "subject_status" NOT NULL DEFAULT 'in_progress',
    "note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "semesters_user_id_status_idx" ON "semesters"("user_id", "status");

-- CreateIndex
CREATE INDEX "semesters_user_id_deleted_at_idx" ON "semesters"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_id_user_id_key" ON "semesters"("id", "user_id");

-- CreateIndex
CREATE INDEX "subjects_user_id_status_idx" ON "subjects"("user_id", "status");

-- CreateIndex
CREATE INDEX "subjects_semester_id_status_idx" ON "subjects"("semester_id", "status");

-- CreateIndex
CREATE INDEX "subjects_user_id_deleted_at_idx" ON "subjects"("user_id", "deleted_at");

-- CreateIndex
-- Soft unique rule: a user cannot have two non-deleted subjects with the same
-- code in the same semester. Deleted subjects can keep their historical code.
CREATE UNIQUE INDEX "subjects_active_user_semester_code_key"
ON "subjects"("user_id", "semester_id", "code")
WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_semester_id_user_id_fkey" FOREIGN KEY ("semester_id", "user_id") REFERENCES "semesters"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
