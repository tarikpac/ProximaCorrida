-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "price" TEXT,
ADD COLUMN     "priceMin" DECIMAL(65,30),
ADD COLUMN     "priceText" TEXT,
ADD COLUMN     "rawLocation" TEXT,
ADD COLUMN     "sourceEventId" TEXT,
ADD COLUMN     "sourcePlatform" TEXT NOT NULL DEFAULT 'corridasemaratonas';

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "statePreferences" TEXT[],
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "Event_sourcePlatform_sourceEventId_idx" ON "Event"("sourcePlatform", "sourceEventId");
