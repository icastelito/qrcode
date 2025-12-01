-- AlterTable
ALTER TABLE "qr_access_log" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "browser_version" TEXT,
ADD COLUMN     "is_bot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_mobile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_unique_visitor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "referer" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "response_time" INTEGER,
ADD COLUMN     "scan_method" TEXT,
ADD COLUMN     "screen_height" INTEGER,
ADD COLUMN     "screen_width" INTEGER,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "utm_campaign" TEXT,
ADD COLUMN     "utm_content" TEXT,
ADD COLUMN     "utm_medium" TEXT,
ADD COLUMN     "utm_source" TEXT,
ADD COLUMN     "utm_term" TEXT;

-- CreateIndex
CREATE INDEX "qr_access_log_ip_hash_idx" ON "qr_access_log"("ip_hash");

-- CreateIndex
CREATE INDEX "qr_access_log_country_idx" ON "qr_access_log"("country");

-- CreateIndex
CREATE INDEX "qr_access_log_device_idx" ON "qr_access_log"("device");

-- CreateIndex
CREATE INDEX "qr_access_log_browser_idx" ON "qr_access_log"("browser");

-- CreateIndex
CREATE INDEX "qr_access_log_utm_source_idx" ON "qr_access_log"("utm_source");

-- CreateIndex
CREATE INDEX "qr_access_log_utm_campaign_idx" ON "qr_access_log"("utm_campaign");
