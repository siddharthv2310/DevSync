-- CreateEnum
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redpondedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_tokenHash_key" ON "TeamInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvitation_teamId_status_idx" ON "TeamInvitation"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_invitedUserId_status_idx" ON "TeamInvitation"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "TeamInvitation_expiresAt_idx" ON "TeamInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_teamId_invitedUserId_key" ON "TeamInvitation"("teamId", "invitedUserId");

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
