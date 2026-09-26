/*
  Warnings:

  - The values [CONTACTED,QUOTED,CLOSED] on the enum `QuoteStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[confirmationToken]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventProductionStage" AS ENUM ('NOT_STARTED', 'SHOOTING_SCHEDULED', 'SHOT', 'EDITING', 'EDITED', 'DELIVERED');

-- AlterEnum
BEGIN;
CREATE TYPE "QuoteStatus_new" AS ENUM ('NEW', 'WAITLISTED', 'REJECTED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED');
ALTER TABLE "public"."Quote" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Quote" ALTER COLUMN "status" TYPE "QuoteStatus_new" USING ("status"::text::"QuoteStatus_new");
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";
ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus";
DROP TYPE "public"."QuoteStatus_old";
ALTER TABLE "Quote" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "clientDeclinedAt" TIMESTAMP(3),
ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "confirmationToken" TEXT,
ADD COLUMN     "confirmationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "finalTotal" INTEGER,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "termsAndConditions" TEXT;

-- AlterTable
ALTER TABLE "QuoteEvent" ADD COLUMN     "productionStage" "EventProductionStage" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateIndex
CREATE UNIQUE INDEX "Quote_confirmationToken_key" ON "Quote"("confirmationToken");

-- CreateIndex
CREATE INDEX "Quote_confirmationToken_idx" ON "Quote"("confirmationToken");
