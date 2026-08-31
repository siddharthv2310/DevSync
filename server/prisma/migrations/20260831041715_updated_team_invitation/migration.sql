/*
  Warnings:

  - You are about to drop the column `redpondedAt` on the `TeamInvitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeamInvitation" DROP COLUMN "redpondedAt",
ADD COLUMN     "respondedAt" TIMESTAMP(3);
