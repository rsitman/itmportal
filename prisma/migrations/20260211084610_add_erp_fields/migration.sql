-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'ERP_UPGRADE';
ALTER TYPE "EventType" ADD VALUE 'ERP_PATCH';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "erpJiraKey" TEXT,
ADD COLUMN     "erpProject" TEXT,
ADD COLUMN     "erpResolver" TEXT,
ADD COLUMN     "erpSourceId" TEXT,
ADD COLUMN     "erpSystems" TEXT,
ADD COLUMN     "erpType" TEXT,
ADD COLUMN     "isErpEvent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Event_isErpEvent_erpSourceId_idx" ON "Event"("isErpEvent", "erpSourceId");
