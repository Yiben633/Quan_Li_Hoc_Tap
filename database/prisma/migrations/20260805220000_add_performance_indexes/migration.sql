-- Dashboard: counts for today, overdue and status buckets by user.
CREATE INDEX IF NOT EXISTS "tasks_dashboard_user_status_due_deleted_idx"
ON "tasks"("user_id", "status", "due_date", "deleted_at");

-- Dashboard/Kanban: fast board loading by user, subject, status and manual order.
CREATE INDEX IF NOT EXISTS "tasks_kanban_user_subject_status_sort_idx"
ON "tasks"("user_id", "subject_id", "status", "sort_order");

-- Calendar: one-pass event lookup in a visible range.
CREATE INDEX IF NOT EXISTS "events_calendar_user_start_end_deleted_idx"
ON "events"("user_id", "start_at", "end_at", "deleted_at");

-- Calendar: schedule occurrence expansion by user and visible range.
CREATE INDEX IF NOT EXISTS "schedules_calendar_user_start_end_rule_deleted_idx"
ON "schedules"("user_id", "start_date", "end_date", "recurrence_rule", "deleted_at");

-- Calendar: recurring weekly schedules by day and start time.
CREATE INDEX IF NOT EXISTS "schedules_weekly_user_day_time_idx"
ON "schedules"("user_id", "day_of_week", "start_time");

-- Statistics: study time by user, subject and date range.
CREATE INDEX IF NOT EXISTS "study_sessions_stats_user_subject_started_idx"
ON "study_sessions"("user_id", "subject_id", "started_at");

-- Statistics: completed tasks by subject over time.
CREATE INDEX IF NOT EXISTS "tasks_stats_user_subject_completed_idx"
ON "tasks"("user_id", "subject_id", "completed_at");

-- Dashboard: active goals by user and deadline.
CREATE INDEX IF NOT EXISTS "goals_dashboard_user_status_deadline_idx"
ON "goals"("user_id", "status", "deadline");

-- Notifications: unread newest-first queries.
CREATE INDEX IF NOT EXISTS "notifications_unread_user_read_created_idx"
ON "notifications"("user_id", "is_read", "created_at");

-- Documents/Notes: library views by subject and soft-delete state.
CREATE INDEX IF NOT EXISTS "documents_library_user_subject_deleted_idx"
ON "documents"("user_id", "subject_id", "deleted_at");

CREATE INDEX IF NOT EXISTS "notes_library_user_subject_pinned_deleted_idx"
ON "notes"("user_id", "subject_id", "is_pinned", "deleted_at");

