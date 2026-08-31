/*
  Warnings:

  - You are about to drop the column `expiredAt` on the `OrganizationInvitation` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `OrganizationInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OrganizationInvitation_expiredAt_idx";

-- AlterTable
ALTER TABLE "OrganizationInvitation" DROP COLUMN "expiredAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "OrganizationInvitation_expiresAt_idx" ON "OrganizationInvitation"("expiresAt");
