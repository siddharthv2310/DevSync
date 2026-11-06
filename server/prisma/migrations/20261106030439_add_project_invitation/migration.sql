/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `ProjectInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `ProjectInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `ProjectInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `ProjectInvitation` table. All the data in the column will be lost.
  - The `status` column on the `ProjectInvitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[tokenHash]` on the table `ProjectInvitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,invitedUserId]` on the table `ProjectInvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `ProjectInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_organizationId_fkey";

-- DropIndex
DROP INDEX "ProjectInvitation_invitedById_idx";

-- DropIndex
DROP INDEX "ProjectInvitation_organizationId_idx";

-- AlterTable
ALTER TABLE "ProjectInvitation" DROP COLUMN "acceptedAt",
DROP COLUMN "cancelledAt",
DROP COLUMN "organizationId",
DROP COLUMN "rejectedAt",
ADD COLUMN     "message" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_tokenHash_key" ON "ProjectInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "ProjectInvitation_projectId_status_idx" ON "ProjectInvitation"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_invitedUserId_status_idx" ON "ProjectInvitation"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "ProjectInvitation_expiresAt_idx" ON "ProjectInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_projectId_invitedUserId_key" ON "ProjectInvitation"("projectId", "invitedUserId");
