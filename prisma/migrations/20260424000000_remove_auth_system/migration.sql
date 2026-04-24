-- Remove auth system: drop user, session, password_reset_code tables
-- Remove userId from project and qr_code
-- Drop foreign key constraints first
ALTER TABLE "session"
DROP CONSTRAINT IF EXISTS "session_user_id_fkey";

ALTER TABLE "password_reset_code"
DROP CONSTRAINT IF EXISTS "password_reset_code_user_id_fkey";

ALTER TABLE "project"
DROP CONSTRAINT IF EXISTS "project_user_id_fkey";

-- Drop auth tables
DROP TABLE IF EXISTS "password_reset_code";

DROP TABLE IF EXISTS "session";

-- Remove userId from project
ALTER TABLE "project"
DROP COLUMN IF EXISTS "user_id";

-- Remove userId from qr_code
DROP INDEX IF EXISTS "qr_code_user_id_idx";

ALTER TABLE "qr_code"
DROP COLUMN IF EXISTS "user_id";

-- Drop user table (after removing all references)
DROP TABLE IF EXISTS "user";