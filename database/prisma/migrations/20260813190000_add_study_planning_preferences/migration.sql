-- User-specific planning defaults for the deterministic AI Coach. Optional
-- study windows intentionally allow the availability engine to use its own
-- conservative defaults when a user has not configured a preference yet.
CREATE TABLE "study_planning_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "preferred_study_start" TEXT,
    "preferred_study_end" TEXT,
    "max_study_minutes_per_day" INTEGER NOT NULL DEFAULT 180,
    "default_session_minutes" INTEGER NOT NULL DEFAULT 45,
    "min_break_minutes" INTEGER NOT NULL DEFAULT 10,
    "allow_weekend" BOOLEAN NOT NULL DEFAULT true,
    "preferred_days" INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_planning_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_planning_preferences_user_id_key"
  ON "study_planning_preferences"("user_id");

ALTER TABLE "study_planning_preferences"
  ADD CONSTRAINT "study_planning_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
