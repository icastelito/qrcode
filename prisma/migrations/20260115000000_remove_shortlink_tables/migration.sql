-- DropForeignKey
ALTER TABLE "shortened_link_access_log"
DROP CONSTRAINT "shortened_link_access_log_link_id_fkey";

-- DropTable
DROP TABLE "shortened_link_access_log";

-- DropTable
DROP TABLE "shortened_link";