-- Remove project_id column from qr_code table
ALTER TABLE "qr_code"
DROP COLUMN IF EXISTS "project_id";

-- Drop index on project_id
DROP INDEX IF EXISTS "qr_code_project_id_idx";

-- Drop project table
DROP TABLE IF EXISTS "project";