-- Roles required by public registration and authorization on a fresh database.
-- Keep this idempotent so existing development and demo databases retain their
-- current role identifiers and assignments.
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'student', 'Default learner role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin', 'System administrator role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
