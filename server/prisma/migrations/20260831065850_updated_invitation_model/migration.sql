/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `OrganizationInvitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationInvitation" DROP COLUMN "acceptedAt",
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
