-- CreateTable
CREATE TABLE "qr_code" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "style" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_access_log" (
    "id" TEXT NOT NULL,
    "qr_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "device" TEXT,
    "platform" TEXT,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "qr_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qr_access_log_qr_id_idx" ON "qr_access_log"("qr_id");

-- CreateIndex
CREATE INDEX "qr_access_log_timestamp_idx" ON "qr_access_log"("timestamp");

-- CreateIndex
CREATE INDEX "qr_access_log_qr_id_timestamp_idx" ON "qr_access_log"("qr_id", "timestamp");

-- AddForeignKey
ALTER TABLE "qr_access_log" ADD CONSTRAINT "qr_access_log_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "qr_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
